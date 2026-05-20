"""
Kitchen utility functions: cutoff checks, meal count derivation, consumption calculation.

Cutoff rules (configurable via Django settings):
  BREAKFAST / LUNCH  → changes allowed until 8 PM the PREVIOUS day
  SNACKS / DINNER    → changes allowed until 2 PM the SAME day
"""

from datetime import timedelta, time as dtime
from decimal import Decimal

from django.conf import settings
from django.utils import timezone

# --- Configurable cutoff times (can be overridden in settings.py) ---
MORNING_MEAL_CUTOFF_HOUR = getattr(settings, 'KITCHEN_MORNING_CUTOFF_HOUR', 20)   # 8 PM prev day
EVENING_MEAL_CUTOFF_HOUR = getattr(settings, 'KITCHEN_EVENING_CUTOFF_HOUR', 14)   # 2 PM same day

MORNING_MEALS = {'breakfast', 'lunch'}
EVENING_MEALS = {'snacks', 'dinner'}


def get_cutoff_datetime(date, meal_type):
    """Return the deadline (aware datetime) after which availability cannot be changed."""
    if meal_type in MORNING_MEALS:
        cutoff_date = date - timedelta(days=1)
        cutoff_naive = timezone.datetime.combine(cutoff_date, dtime(MORNING_MEAL_CUTOFF_HOUR, 0))
    else:
        cutoff_naive = timezone.datetime.combine(date, dtime(EVENING_MEAL_CUTOFF_HOUR, 0))
    return timezone.make_aware(cutoff_naive)


def is_availability_change_allowed(date, meal_type):
    """True if the cutoff has not yet passed."""
    return timezone.now() < get_cutoff_datetime(date, meal_type)


def get_cutoff_display(date, meal_type):
    """Return a human-friendly cutoff description for the UI."""
    if meal_type in MORNING_MEALS:
        cutoff_date = date - timedelta(days=1)
        return f"Previous day ({cutoff_date.strftime('%d %b')}) by 8:00 PM"
    else:
        return f"Same day ({date.strftime('%d %b')}) by 2:00 PM"


# ---------------------------------------------------------------------------
# Meal count derivation
# ---------------------------------------------------------------------------

def get_active_tenants_for_meals(date, branch_id=None, user=None):
    """
    Return tenants who should be included in meal counts.

    Matches the Tenants page definition of ACTIVE:
      - joining_date is set and on/before the meal date
      - vacating_date is null
      - assigned to a room (actually residing in the hostel)

    Optionally scoped by branch and/or the requesting user's role.
    """
    from core.models import Tenant, WardenAssignment

    qs = Tenant.objects.filter(
        joining_date__isnull=False,
        joining_date__lte=date,
        vacating_date__isnull=True,
        room__isnull=False,
    )

    if branch_id:
        qs = qs.filter(room__branch_id=branch_id)
    elif user and hasattr(user, 'profile'):
        role = user.profile.role
        if role == 'owner':
            qs = qs.filter(room__branch__owner=user)
        elif role == 'warden':
            branch_ids = WardenAssignment.objects.filter(
                warden=user, is_active=True,
            ).values_list('branch_id', flat=True)
            qs = qs.filter(room__branch_id__in=branch_ids)

    return qs


def derive_meal_count(date, meal_type, branch_id=None, user=None):
    """
    Dynamically calculate how many tenants will eat a given meal.

    Returns a dict:
        total_residents: active tenants in scope (see get_active_tenants_for_meals)
        unavailable_count: those who opted out
        meal_count: total_residents − unavailable_count
    """
    from core.models import TenantMealAvailability

    active_tenants = get_active_tenants_for_meals(date, branch_id=branch_id, user=user)
    total_residents = active_tenants.count()

    unavailable_count = TenantMealAvailability.objects.filter(
        date=date,
        meal_type=meal_type,
        is_available=False,
        tenant__in=active_tenants,
    ).count()

    meal_count = max(0, total_residents - unavailable_count)
    return {
        'total_residents': total_residents,
        'unavailable_count': unavailable_count,
        'meal_count': meal_count,
    }


def _convert_to_base_unit(quantity, unit):
    """
    Normalise recipe quantities to the grocery item's base unit.
    We store transactions in whatever unit the recipe specifies;
    the caller is responsible for using consistent units.
    Returns (quantity_decimal, unit_string).
    """
    return Decimal(str(quantity)), unit


# ---------------------------------------------------------------------------
# Consumption generation
# ---------------------------------------------------------------------------

def generate_consumption_for_meal(date, meal_type, branch, triggered_by=None):
    """
    1. Derive (or retrieve) meal count snapshot.
    2. For every FoodMenuItem → MenuIngredient on that date/meal_type:
       - Calculate total ingredient consumption = qty_per_person × meal_count
       - Create an InventoryTransaction (deducts from GroceryStock)
    3. Mark snapshot.consumption_generated = True.

    Returns a dict summarising what was done.
    """
    from core.models import FoodMenu, MealCountSnapshot
    from groceries.inventory_service import record_inventory_transaction

    # Step 1: snapshot meal count (scoped to this branch)
    count_data = derive_meal_count(date, meal_type, branch_id=branch.id)
    meal_count = count_data['meal_count']

    snapshot, created = MealCountSnapshot.objects.get_or_create(
        date=date,
        meal_type=meal_type,
        defaults={
            'total_residents': count_data['total_residents'],
            'unavailable_count': count_data['unavailable_count'],
            'meal_count': meal_count,
            'taken_by': triggered_by,
        },
    )

    if snapshot.consumption_generated:
        return {
            'status': 'already_done',
            'snapshot_id': snapshot.id,
            'meal_count': snapshot.meal_count,
            'transactions': 0,
        }

    if meal_count == 0:
        snapshot.consumption_generated = True
        snapshot.save(update_fields=['consumption_generated'])
        return {
            'status': 'no_residents',
            'snapshot_id': snapshot.id,
            'meal_count': 0,
            'transactions': 0,
        }

    # Step 2: calculate and create transactions
    transactions_created = []
    try:
        menus = FoodMenu.objects.filter(date=date, meal_type=meal_type).prefetch_related(
            'menu_items__ingredients__grocery_item'
        )
    except Exception:
        menus = []

    for menu in menus:
        for dish in menu.menu_items.all():
            for ingredient in dish.ingredients.all():
                total_qty, unit = _convert_to_base_unit(
                    ingredient.quantity_per_person * meal_count,
                    ingredient.unit,
                )
                txn = record_inventory_transaction(
                    branch=branch,
                    grocery_item=ingredient.grocery_item,
                    transaction_type='consumption',
                    quantity=total_qty,
                    unit=unit,
                    reference_type='meal',
                    reference_id=snapshot.id,
                    notes=f"{dish.name} × {meal_count} persons on {date} {meal_type}",
                    created_by=triggered_by,
                )
                transactions_created.append(txn)

    # Step 3: mark snapshot done
    snapshot.consumption_generated = True
    snapshot.save(update_fields=['consumption_generated'])

    return {
        'status': 'done',
        'snapshot_id': snapshot.id,
        'meal_count': meal_count,
        'transactions': len(transactions_created),
    }
