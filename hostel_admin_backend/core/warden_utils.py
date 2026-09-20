import logging

from django.utils import timezone

from .models import Branch, WardenAssignment

logger = logging.getLogger(__name__)


def sync_warden_assignments(warden_user, branch_ids, assigned_by):
    """Create or reactivate warden assignments for the given branch IDs."""
    branch_ids = list(branch_ids or [])
    WardenAssignment.objects.filter(warden=warden_user).update(is_active=False)
    for branch_id in branch_ids:
        try:
            branch = Branch.objects.get(id=branch_id)
            assignment, created = WardenAssignment.objects.update_or_create(
                warden=warden_user,
                branch=branch,
                defaults={
                    'assigned_by': assigned_by,
                    'assigned_date': timezone.now(),
                    'is_active': True,
                }
            )
            if created:
                assignment.can_manage_rooms = True
                assignment.can_manage_tenants = True
                assignment.can_view_payments = True
                assignment.can_collect_payments = False
                assignment.save()
        except Branch.DoesNotExist:
            logger.warning('Branch %s not found for warden assignment', branch_id)
