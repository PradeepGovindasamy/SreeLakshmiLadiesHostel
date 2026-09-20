from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User, UserProfile
from .warden_utils import sync_warden_assignments


class CanManageWardenAssignments:
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = getattr(getattr(request.user, 'profile', None), 'role', None)
        return role in ['admin', 'owner']


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated, CanManageWardenAssignments])
def sync_user_warden_assignments(request, user_id):
    """
    Sync warden property assignments for a user.
    PUT/PATCH /api/users/{user_id}/warden-assignments/
    Body: { "assigned_branches": [1, 2] }
    """
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if not hasattr(target_user, 'profile') or target_user.profile.role != 'warden':
        return Response({'error': 'User is not a warden'}, status=status.HTTP_400_BAD_REQUEST)

    assigned_branch_ids = request.data.get('assigned_branches')
    if assigned_branch_ids is None:
        return Response({'error': 'assigned_branches is required'}, status=status.HTTP_400_BAD_REQUEST)

    sync_warden_assignments(target_user, assigned_branch_ids, request.user)
    branch_ids = list(
        target_user.warden_assignments.filter(is_active=True).values_list('branch_id', flat=True)
    )
    return Response({'assigned_branches': branch_ids})
