"""
Rent status computation utilities.

Rent status is computed on-the-fly from RentPayment records and
the agreed monthly rent stored in RoomOccupancy (fallback: Room.rent).

Status values
-------------
PAID    – total paid for the month >= agreed rent
PARTIAL – 0 < total paid < agreed rent
PENDING – no payment yet, and the month is the current or a future month
OVERDUE – no payment (or partial), and the month is in the past
UNKNOWN – agreed rent could not be determined

These functions accept a pre-fetched occupancy and payments list so that
callers can avoid N+1 queries by bulk-fetching both relations upfront.
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal


# ── helpers ───────────────────────────────────────────────────────────────────

def _first_day(d: date) -> date:
    return d.replace(day=1)


def _next_month(d: date) -> date:
    if d.month == 12:
        return date(d.year + 1, 1, 1)
    return date(d.year, d.month + 1, 1)


def _months_between(start: date, end: date):
    """Yield the first day of each month from start to end (inclusive)."""
    cur = _first_day(start)
    stop = _first_day(end)
    while cur <= stop:
        yield cur
        cur = _next_month(cur)


# ── agreed rent lookup ────────────────────────────────────────────────────────

def get_agreed_rent(tenant) -> Decimal | None:
    """
    Return the agreed monthly rent for the tenant.
    Priority: most-recent RoomOccupancy.monthly_rent_agreed → Room.rent
    """
    from .models import RoomOccupancy
    occ = (
        RoomOccupancy.objects
        .filter(tenant=tenant, monthly_rent_agreed__isnull=False)
        .order_by('-start_date')
        .values_list('monthly_rent_agreed', flat=True)
        .first()
    )
    if occ:
        return occ
    if tenant.room and tenant.room.rent:
        return tenant.room.rent
    return None


# ── single-month status ───────────────────────────────────────────────────────

def month_rent_status(tenant, for_month: date, payments_qs=None) -> dict:
    """
    Compute the rent status for one calendar month.

    Parameters
    ----------
    tenant      : Tenant instance
    for_month   : any date inside the target month (normalised to the 1st)
    payments_qs : optional pre-fetched queryset / list of RentPayment for
                  this tenant (avoids an extra DB hit when called in bulk)
    """
    from django.db.models import Sum
    from .models import RentPayment

    target = _first_day(for_month)
    today_month = _first_day(date.today())

    agreed = get_agreed_rent(tenant)
    if agreed is None:
        return {
            'for_month': target.strftime('%Y-%m-%d'),
            'for_month_display': target.strftime('%B %Y'),
            'rent_status': 'UNKNOWN',
            'agreed_rent': None,
            'total_paid': 0,
            'due': 0,
        }

    # Sum payments for the target month
    if payments_qs is not None:
        total_paid = sum(
            p.amount_paid
            for p in payments_qs
            if p.for_month.year == target.year and p.for_month.month == target.month
        ) or Decimal('0')
    else:
        total_paid = (
            RentPayment.objects
            .filter(
                tenant=tenant,
                for_month__year=target.year,
                for_month__month=target.month,
            )
            .aggregate(total=Sum('amount_paid'))['total']
        ) or Decimal('0')

    due = max(Decimal('0'), agreed - total_paid)

    if total_paid >= agreed:
        rent_status = 'PAID'
    elif total_paid > 0:
        # Partial payment — overdue if it's a past month
        rent_status = 'OVERDUE' if target < today_month else 'PARTIAL'
    elif target < today_month:
        rent_status = 'OVERDUE'
    else:
        rent_status = 'PENDING'

    return {
        'for_month': target.strftime('%Y-%m-%d'),
        'for_month_display': target.strftime('%B %Y'),
        'rent_status': rent_status,
        'agreed_rent': float(agreed),
        'total_paid': float(total_paid),
        'due': float(due),
    }


# ── current month convenience ─────────────────────────────────────────────────

def current_month_rent_status(tenant) -> dict:
    """Return rent status for the current calendar month."""
    return month_rent_status(tenant, date.today())


# ── full ledger ───────────────────────────────────────────────────────────────

def build_rent_ledger(tenant) -> list[dict]:
    """
    Return a rent-status entry for every month from the tenant's joining_date
    up to and including the current month (or vacating_date month if vacated).

    All RentPayment records are fetched in one query to avoid N+1.
    Result is ordered most-recent first.
    """
    from .models import RentPayment

    if not tenant.joining_date:
        return []

    end = tenant.vacating_date or date.today()

    # Single bulk fetch of all payments for this tenant
    all_payments = list(RentPayment.objects.filter(tenant=tenant))

    ledger = []
    for month_start in _months_between(tenant.joining_date, end):
        entry = month_rent_status(tenant, month_start, payments_qs=all_payments)
        ledger.append(entry)

    ledger.reverse()  # Most recent first
    return ledger
