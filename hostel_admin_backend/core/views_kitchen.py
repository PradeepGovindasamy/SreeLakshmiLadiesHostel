"""
Kitchen-module ViewSets:
  FoodMenuItemViewSet       – dishes within a meal
  MenuIngredientViewSet     – recipe ingredients per dish
  ResidentAvailabilityViewSet – tenant meal opt-out
  MealCountViewSet          – view snapshots + trigger consumption
  InventoryTransactionViewSet – in groceries app
"""

import logging
from datetime import date, timedelta

from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.kitchen_utils import (
    derive_meal_count,
    generate_consumption_for_meal,
    get_cutoff_datetime,
    get_cutoff_display,
    is_availability_change_allowed,
)
from core.models import (
    Branch,
    FoodMenu,
    FoodMenuItem,
    MealCountSnapshot,
    MenuIngredient,
    TenantMealAvailability,
    Tenant,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_role(request):
    try:
        return request.user.profile.role
    except Exception:
        return None


def _require_roles(request, allowed_roles):
    role = _get_role(request)
    if role not in allowed_roles:
        raise permissions.PermissionDenied(f"Role '{role}' is not permitted for this action.")


# ---------------------------------------------------------------------------
# Serializers (inline, concise)
# ---------------------------------------------------------------------------

class MenuIngredientSerializer(serializers.ModelSerializer):
    grocery_item_name = serializers.CharField(source='grocery_item.name', read_only=True)
    grocery_item_unit = serializers.CharField(source='grocery_item.unit', read_only=True)

    class Meta:
        from groceries.models import GroceryItem  # noqa: imported for field validation
        model = MenuIngredient
        fields = [
            'id', 'menu_item', 'grocery_item', 'grocery_item_name',
            'grocery_item_unit', 'quantity_per_person', 'unit',
        ]


class FoodMenuItemSerializer(serializers.ModelSerializer):
    ingredients = MenuIngredientSerializer(many=True, read_only=True)

    class Meta:
        model = FoodMenuItem
        fields = ['id', 'food_menu', 'name', 'description', 'display_order', 'ingredients']


class FoodMenuWithItemsSerializer(serializers.ModelSerializer):
    """Extended FoodMenu serializer that nests dishes and their ingredients."""
    meal_type_display = serializers.CharField(source='get_meal_type_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    menu_items = FoodMenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = FoodMenu
        fields = [
            'id', 'date', 'meal_type', 'meal_type_display',
            'items', 'notes',
            'menu_items',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class TenantAvailabilitySerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    meal_type_display = serializers.CharField(source='get_meal_type_display', read_only=True)
    cutoff_display = serializers.SerializerMethodField()
    can_modify = serializers.SerializerMethodField()

    class Meta:
        model = TenantMealAvailability
        fields = [
            'id', 'tenant', 'tenant_name',
            'date', 'meal_type', 'meal_type_display',
            'is_available', 'updated_at',
            'cutoff_display', 'can_modify',
        ]
        read_only_fields = ['updated_at']

    def get_cutoff_display(self, obj):
        return get_cutoff_display(obj.date, obj.meal_type)

    def get_can_modify(self, obj):
        return is_availability_change_allowed(obj.date, obj.meal_type)


class MealCountSnapshotSerializer(serializers.ModelSerializer):
    meal_type_display = serializers.CharField(source='get_meal_type_display', read_only=True)

    class Meta:
        model = MealCountSnapshot
        fields = [
            'id', 'date', 'meal_type', 'meal_type_display',
            'total_residents', 'unavailable_count', 'meal_count',
            'snapshot_taken_at', 'consumption_generated',
        ]


# ---------------------------------------------------------------------------
# ViewSets
# ---------------------------------------------------------------------------

class FoodMenuItemViewSet(viewsets.ModelViewSet):
    """CRUD for individual dishes within a meal plan."""
    serializer_class = FoodMenuItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = FoodMenuItem.objects.select_related('food_menu').prefetch_related('ingredients')
        food_menu_id = self.request.query_params.get('food_menu')
        if food_menu_id:
            qs = qs.filter(food_menu_id=food_menu_id)
        return qs

    def _check_write_permission(self):
        _require_roles(self.request, ['admin', 'owner'])

    def perform_create(self, serializer):
        self._check_write_permission()
        serializer.save()

    def perform_update(self, serializer):
        self._check_write_permission()
        serializer.save()

    def perform_destroy(self, instance):
        self._check_write_permission()
        instance.delete()


class MenuIngredientViewSet(viewsets.ModelViewSet):
    """CRUD for recipe ingredient mappings (qty per person per dish)."""
    serializer_class = MenuIngredientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = MenuIngredient.objects.select_related('menu_item', 'grocery_item')
        menu_item_id = self.request.query_params.get('menu_item')
        if menu_item_id:
            qs = qs.filter(menu_item_id=menu_item_id)
        return qs

    def _check_write_permission(self):
        _require_roles(self.request, ['admin', 'owner'])

    def perform_create(self, serializer):
        self._check_write_permission()
        serializer.save()

    def perform_update(self, serializer):
        self._check_write_permission()
        serializer.save()

    def perform_destroy(self, instance):
        self._check_write_permission()
        instance.delete()


class TenantAvailabilityViewSet(viewsets.ModelViewSet):
    """
    Tenants mark their own meal availability.
    Admins/wardens can view all and override.
    """
    serializer_class = TenantAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        role = _get_role(self.request)
        qs = TenantMealAvailability.objects.select_related('tenant')

        if role == 'tenant':
            try:
                tenant = Tenant.objects.get(user=self.request.user)
                qs = qs.filter(tenant=tenant)
            except Tenant.DoesNotExist:
                return qs.none()

        date_param = self.request.query_params.get('date')
        if date_param:
            qs = qs.filter(date=date_param)

        meal_type_param = self.request.query_params.get('meal_type')
        if meal_type_param:
            qs = qs.filter(meal_type=meal_type_param)

        return qs

    def perform_create(self, serializer):
        role = _get_role(self.request)
        target_date = serializer.validated_data['date']
        meal_type = serializer.validated_data['meal_type']
        target_tenant = serializer.validated_data['tenant']

        if role == 'tenant':
            try:
                my_tenant = Tenant.objects.get(user=self.request.user)
            except Tenant.DoesNotExist:
                raise permissions.PermissionDenied("No tenant profile linked to your account.")
            if target_tenant != my_tenant:
                raise permissions.PermissionDenied("You can only update your own availability.")

        if not is_availability_change_allowed(target_date, meal_type):
            cutoff = get_cutoff_display(target_date, meal_type)
            raise serializers.ValidationError(
                f"Availability cutoff has passed for {meal_type} on {target_date}. "
                f"Changes were allowed until: {cutoff}"
            )

        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        role = _get_role(self.request)
        instance = self.get_object()

        if role == 'tenant':
            try:
                my_tenant = Tenant.objects.get(user=self.request.user)
            except Tenant.DoesNotExist:
                raise permissions.PermissionDenied("No tenant profile linked to your account.")
            if instance.tenant != my_tenant:
                raise permissions.PermissionDenied("You can only update your own availability.")

        if not is_availability_change_allowed(instance.date, instance.meal_type):
            cutoff = get_cutoff_display(instance.date, instance.meal_type)
            raise serializers.ValidationError(
                f"Availability cutoff has passed. Changes were allowed until: {cutoff}"
            )

        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='my')
    def my_availability(self, request):
        """Current tenant's availability for today + next 7 days."""
        try:
            tenant = Tenant.objects.get(user=request.user)
        except Tenant.DoesNotExist:
            return Response({'error': 'No tenant profile found.'}, status=404)

        today = date.today()
        records = TenantMealAvailability.objects.filter(
            tenant=tenant,
            date__gte=today,
            date__lte=today + timedelta(days=7),
        )

        meals = ['breakfast', 'lunch', 'snacks', 'dinner']
        result = []
        for day_offset in range(8):
            d = today + timedelta(days=day_offset)
            day_data = {'date': str(d), 'meals': {}}
            for mt in meals:
                record = next((r for r in records if str(r.date) == str(d) and r.meal_type == mt), None)
                day_data['meals'][mt] = {
                    'is_available': record.is_available if record else True,
                    'record_id': record.id if record else None,
                    'can_modify': is_availability_change_allowed(d, mt),
                    'cutoff': get_cutoff_display(d, mt),
                }
            result.append(day_data)

        return Response(result)

    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        """
        Bulk update availability for the current tenant.
        Body: [{ date, meal_type, is_available }, ...]
        """
        role = _get_role(request)
        try:
            my_tenant = Tenant.objects.get(user=request.user) if role == 'tenant' else None
        except Tenant.DoesNotExist:
            return Response({'error': 'No tenant profile found.'}, status=404)

        updates = request.data if isinstance(request.data, list) else request.data.get('updates', [])
        errors = []
        saved = []

        for item in updates:
            target_date = item.get('date')
            meal_type = item.get('meal_type')
            is_available = item.get('is_available', True)
            tenant_id = item.get('tenant') or (my_tenant.id if my_tenant else None)

            if not all([target_date, meal_type, tenant_id]):
                errors.append({'item': item, 'error': 'Missing date, meal_type, or tenant'})
                continue

            from datetime import datetime
            try:
                d = datetime.strptime(str(target_date), '%Y-%m-%d').date()
            except ValueError:
                errors.append({'item': item, 'error': 'Invalid date format'})
                continue

            if not is_availability_change_allowed(d, meal_type):
                errors.append({'item': item, 'error': f"Cutoff passed: {get_cutoff_display(d, meal_type)}"})
                continue

            try:
                tenant = Tenant.objects.get(id=tenant_id)
                obj, _ = TenantMealAvailability.objects.update_or_create(
                    tenant=tenant, date=d, meal_type=meal_type,
                    defaults={'is_available': is_available, 'updated_by': request.user},
                )
                saved.append({'id': obj.id, 'date': str(d), 'meal_type': meal_type, 'is_available': is_available})
            except Tenant.DoesNotExist:
                errors.append({'item': item, 'error': 'Tenant not found'})
            except Exception as e:
                errors.append({'item': item, 'error': str(e)})

        return Response({'saved': saved, 'errors': errors})


class MealCountViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View meal count snapshots and trigger on-demand consumption generation.
    Read: all authenticated. Trigger consumption: admin/owner/warden only.
    """
    serializer_class = MealCountSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = MealCountSnapshot.objects.all()
        date_param = self.request.query_params.get('date')
        if date_param:
            qs = qs.filter(date=date_param)
        return qs

    @action(detail=False, methods=['get'], url_path='live')
    def live_count(self, request):
        """Return live (dynamic, not persisted) meal count for a given date."""
        date_str = request.query_params.get('date', str(date.today()))
        meal_type = request.query_params.get('meal_type')

        try:
            from datetime import datetime
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format.'}, status=400)

        meal_types = [meal_type] if meal_type else ['breakfast', 'lunch', 'snacks', 'dinner']
        result = {}
        for mt in meal_types:
            result[mt] = derive_meal_count(target_date, mt)

        return Response({'date': date_str, 'counts': result})

    @action(detail=False, methods=['post'], url_path='trigger-consumption')
    def trigger_consumption(self, request):
        """
        Manually trigger consumption generation for a specific date/meal_type/branch.
        Body: { date, meal_type, branch_id }
        Allowed: admin, owner, warden
        """
        _require_roles(request, ['admin', 'owner', 'warden'])

        date_str = request.data.get('date', str(date.today()))
        meal_type = request.data.get('meal_type')
        branch_id = request.data.get('branch_id')

        if not meal_type:
            return Response({'error': 'meal_type is required.'}, status=400)

        try:
            from datetime import datetime
            target_date = datetime.strptime(str(date_str), '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format.'}, status=400)

        if branch_id:
            branches = Branch.objects.filter(id=branch_id)
        else:
            branches = Branch.objects.all()

        results = []
        for branch in branches:
            result = generate_consumption_for_meal(
                date=target_date,
                meal_type=meal_type,
                branch=branch,
                triggered_by=request.user,
            )
            results.append({'branch': branch.name, **result})

        return Response({'date': date_str, 'meal_type': meal_type, 'results': results})
