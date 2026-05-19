"""
/api/my/ — tenant self-service endpoints.

These endpoints always derive the tenant from request.user.
No tenant ID is accepted from the client, which prevents
any tenant from accessing another tenant's data.

Accessible by: tenant role (and admin for testing)
"""
import logging

from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Tenant
from .serializers import TenantSerializer, RentPaymentSerializer
from .rent_utils import current_month_rent_status, build_rent_ledger

logger = logging.getLogger(__name__)


def _get_my_tenant(request):
    """
    Resolve the Tenant record for the authenticated user.
    Returns (tenant, None) on success or (None, Response) on failure.
    """
    user = request.user
    try:
        tenant = Tenant.objects.select_related('room', 'room__branch').get(user=user)
        return tenant, None
    except Tenant.DoesNotExist:
        logger.warning('No tenant profile found for user %s (id=%s)', user, user.pk)
        return None, Response(
            {
                'error': 'No tenant profile linked to your account.',
                'detail': 'Please contact the hostel management.',
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    except Tenant.MultipleObjectsReturned:
        # Edge case: multiple tenants linked — return the active one
        tenant = (
            Tenant.objects
            .select_related('room', 'room__branch')
            .filter(user=user, vacating_date__isnull=True)
            .first()
        )
        if not tenant:
            tenant = Tenant.objects.select_related('room', 'room__branch').filter(user=user).first()
        return tenant, None


# ── /api/my/profile/ ──────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_profile(request):
    """
    GET /api/my/profile/
    Returns the tenant's own profile (no sensitive management fields).
    """
    tenant, err = _get_my_tenant(request)
    if err:
        return err

    serializer = TenantSerializer(tenant, context={'request': request})
    return Response(serializer.data)


# ── /api/my/rent-status/ ──────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_rent_status(request):
    """
    GET /api/my/rent-status/
    GET /api/my/rent-status/?month=YYYY-MM   (optional; defaults to current month)

    Returns rent status for a specific month.
    """
    from datetime import date
    tenant, err = _get_my_tenant(request)
    if err:
        return err

    month_param = request.query_params.get('month')
    if month_param:
        try:
            # Accept YYYY-MM or YYYY-MM-DD
            parts = month_param.split('-')
            year, month = int(parts[0]), int(parts[1])
            target_month = date(year, month, 1)
        except (ValueError, IndexError):
            return Response(
                {'error': 'Invalid month format. Use YYYY-MM.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        target_month = date.today()

    from .rent_utils import month_rent_status
    result = month_rent_status(tenant, target_month)

    return Response({
        'tenant_name': tenant.name,
        'room': tenant.room_display if hasattr(tenant, 'room_display') else (
            tenant.room.room_name if tenant.room else None
        ),
        'branch': tenant.room.branch.name if tenant.room and tenant.room.branch else None,
        **result,
    })


# ── /api/my/rent-ledger/ ─────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_rent_ledger(request):
    """
    GET /api/my/rent-ledger/

    Returns the full rent ledger for the authenticated tenant —
    one entry per month from joining_date to today (most recent first).
    """
    tenant, err = _get_my_tenant(request)
    if err:
        return err

    ledger = build_rent_ledger(tenant)

    # Summary statistics
    total_paid = sum(e['total_paid'] for e in ledger)
    total_due = sum(e['due'] for e in ledger)
    overdue_months = [e for e in ledger if e['rent_status'] == 'OVERDUE']
    current_status = ledger[0] if ledger else None

    return Response({
        'tenant_name': tenant.name,
        'room': tenant.room.room_name if tenant.room else None,
        'branch': tenant.room.branch.name if tenant.room and tenant.room.branch else None,
        'joining_date': tenant.joining_date,
        'summary': {
            'total_months': len(ledger),
            'total_paid': total_paid,
            'total_due': total_due,
            'overdue_months_count': len(overdue_months),
            'current_month_status': current_status['rent_status'] if current_status else None,
        },
        'ledger': ledger,
    })


# ── /api/my/payments/ ────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_payments(request):
    """
    GET /api/my/payments/

    Returns all rent payment records for the authenticated tenant.
    Tenant can only see their own payments.
    """
    from .models import RentPayment
    tenant, err = _get_my_tenant(request)
    if err:
        return err

    payments = (
        RentPayment.objects
        .filter(tenant=tenant)
        .order_by('-payment_date')
        .select_related('collected_by')
    )
    serializer = RentPaymentSerializer(payments, many=True, context={'request': request})
    return Response({
        'count': payments.count(),
        'results': serializer.data,
    })
