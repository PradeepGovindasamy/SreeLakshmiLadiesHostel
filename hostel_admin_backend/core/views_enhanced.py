# core/views_enhanced.py
import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, F
from django.contrib.auth.models import User
from .models import Branch, Room, Tenant, RoomOccupancy, RentPayment, UserProfile, WardenAssignment
from .serializers import (
    BranchSerializer, RoomSerializer, TenantSerializer,
    RoomOccupancySerializer, RentPaymentSerializer, UserProfileSerializer,
    WardenAssignmentSerializer
)

logger = logging.getLogger(__name__)


class RoleBasedPermission(permissions.BasePermission):
    """
    Custom permission class that checks user roles
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if not hasattr(request.user, 'profile'):
            try:
                UserProfile.objects.get_or_create(
                    user=request.user,
                    defaults={'role': 'tenant'}  # safe default — never auto-grant owner
                )
            except Exception:
                return False

        if request.method == 'POST':
            user_role = request.user.profile.role

            if view.__class__.__name__ == 'EnhancedBranchViewSet':
                return user_role in ['owner', 'admin']

            if view.__class__.__name__ in ['EnhancedRoomViewSet', 'EnhancedTenantViewSet']:
                # Custom detail actions (checkout, reactivate, etc.) operate on an
                # existing object identified by pk.  has_object_permission() already
                # enforces warden constraints for those, so we only apply the strict
                # branch-presence check for the 'create' action.
                view_action = getattr(view, 'action', None)
                if view_action and view_action != 'create':
                    return True  # delegate to has_object_permission

                if user_role == 'warden':
                    perm_field = (
                        'can_manage_rooms'
                        if view.__class__.__name__ == 'EnhancedRoomViewSet'
                        else 'can_manage_tenants'
                    )
                    branch_id = (
                        request.data.get('branch')
                        or request.query_params.get('branch')
                    )
                    if not branch_id:
                        logger.warning(
                            'Warden %s attempted to create without branch_id', request.user
                        )
                        return False
                    return WardenAssignment.objects.filter(
                        warden=request.user,
                        branch_id=branch_id,
                        is_active=True,
                        **{perm_field: True}
                    ).exists()
                return user_role in ['owner', 'admin']

            if view.__class__.__name__ == 'EnhancedRentPaymentViewSet':
                if user_role == 'warden':
                    tenant_id = request.data.get('tenant')
                    if not tenant_id:
                        return False
                    return WardenAssignment.objects.filter(
                        warden=request.user,
                        branch__rooms__tenants__id=tenant_id,
                        is_active=True,
                        can_collect_payments=True
                    ).exists()
                return user_role in ['owner', 'admin']

        return True

    def has_object_permission(self, request, view, obj):
        user = request.user

        if not hasattr(user, 'profile') or not user.profile:
            return False

        user_role = user.profile.role

        if user_role == 'admin':
            return True

        if isinstance(obj, Branch):
            if user_role == 'owner':
                return obj.owner == user
            if user_role == 'warden':
                return WardenAssignment.objects.filter(
                    warden=user, branch=obj, is_active=True
                ).exists()
            if user_role == 'tenant':
                return request.method in permissions.SAFE_METHODS

        elif isinstance(obj, Room):
            if user_role == 'owner':
                return obj.branch.owner == user
            if user_role == 'warden':
                if request.method not in permissions.SAFE_METHODS:
                    return WardenAssignment.objects.filter(
                        warden=user, branch=obj.branch,
                        is_active=True, can_manage_rooms=True
                    ).exists()
                return WardenAssignment.objects.filter(
                    warden=user, branch=obj.branch, is_active=True
                ).exists()

        elif isinstance(obj, Tenant):
            if obj.user == user:
                return True
            if not obj.room:
                return False
            branch = obj.room.branch
            if user_role == 'owner':
                return branch.owner == user
            if user_role == 'warden':
                if request.method not in permissions.SAFE_METHODS:
                    return WardenAssignment.objects.filter(
                        warden=user, branch=branch,
                        is_active=True, can_manage_tenants=True
                    ).exists()
                return WardenAssignment.objects.filter(
                    warden=user, branch=branch, is_active=True
                ).exists()

        elif isinstance(obj, RentPayment):
            if not obj.tenant or not obj.tenant.room:
                return False
            branch = obj.tenant.room.branch
            if user_role == 'owner':
                return branch.owner == user
            if user_role == 'warden':
                perm_field = 'can_collect_payments' if request.method not in permissions.SAFE_METHODS else 'can_view_payments'
                return WardenAssignment.objects.filter(
                    warden=user, branch=branch,
                    is_active=True, **{perm_field: True}
                ).exists()
            if user_role == 'tenant':
                return obj.tenant.user == user and request.method in permissions.SAFE_METHODS

        return False


class EnhancedBranchViewSet(viewsets.ModelViewSet):
    """
    Enhanced Branch ViewSet with role-based access
    """
    serializer_class = BranchSerializer
    permission_classes = [RoleBasedPermission]
    
    def get_queryset(self):
        user = self.request.user
        
        if not hasattr(user, 'profile') or not user.profile:
            return Branch.objects.none()
        
        user_role = user.profile.role
        
        # Admins see all branches
        if user_role == 'admin':
            return Branch.objects.all()
        
        # Owners see their own branches
        elif user_role == 'owner':
            return Branch.objects.filter(owner=user)
        
        # Wardens see assigned branches
        elif user_role == 'warden':
            from .models import WardenAssignment
            assigned_branches = WardenAssignment.objects.filter(
                warden=user, is_active=True
            ).values_list('branch', flat=True)
            return Branch.objects.filter(id__in=assigned_branches)
        
        # Tenants see all branches (for selection)
        elif user_role == 'tenant':
            return Branch.objects.filter(is_active=True)
        
        return Branch.objects.none()
    
    def perform_create(self, serializer):
        # Set the current user as owner when creating a branch
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role in ['owner', 'admin']:
            # Allow admins to assign a different owner via the request payload
            if user.profile.role == 'admin':
                owner_id = self.request.data.get('owner')
                if owner_id:
                    from django.contrib.auth.models import User as DjangoUser
                    try:
                        selected_owner = DjangoUser.objects.get(id=owner_id)
                        serializer.save(owner=selected_owner)
                        return
                    except DjangoUser.DoesNotExist:
                        pass
            serializer.save(owner=user)
        else:
            # If user is not owner/admin, they shouldn't be able to create
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only owners and admins can create branches")

    def perform_update(self, serializer):
        user = self.request.user
        # Allow admins to reassign the owner on edit
        if hasattr(user, 'profile') and user.profile.role == 'admin':
            owner_id = self.request.data.get('owner')
            if owner_id:
                from django.contrib.auth.models import User as DjangoUser
                try:
                    selected_owner = DjangoUser.objects.get(id=owner_id)
                    serializer.save(owner=selected_owner)
                    return
                except DjangoUser.DoesNotExist:
                    pass
        serializer.save()
    
    # ── Manager / Warden assignment actions ──────────────────────────────

    @action(detail=True, methods=['post'], url_path='assign_manager')
    def assign_manager(self, request, pk=None):
        """
        Assign or update a manager/warden for this branch.
        Only owner of the branch or admin may call this.
        POST /api/v2/branches/{id}/assign_manager/
        Body: { warden_id, can_manage_rooms, can_manage_tenants,
                can_view_payments, can_collect_payments }
        """
        branch = self.get_object()
        user = request.user
        user_role = getattr(user, 'profile', None) and user.profile.role

        if user_role not in ['owner', 'admin']:
            return Response({'error': 'Only owners and admins can assign managers'},
                            status=status.HTTP_403_FORBIDDEN)
        if user_role == 'owner' and branch.owner != user:
            return Response({'error': 'You do not own this branch'},
                            status=status.HTTP_403_FORBIDDEN)

        warden_id = request.data.get('warden_id')
        if not warden_id:
            return Response({'error': 'warden_id is required'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            warden_user = User.objects.get(id=warden_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(warden_user, 'profile') or warden_user.profile.role != 'warden':
            return Response({'error': 'Selected user does not have the warden role'},
                            status=status.HTTP_400_BAD_REQUEST)

        assignment, created = WardenAssignment.objects.get_or_create(
            warden=warden_user,
            branch=branch,
            defaults={'assigned_by': user}
        )
        assignment.is_active = True
        assignment.assigned_by = user
        assignment.can_manage_rooms = request.data.get('can_manage_rooms', assignment.can_manage_rooms)
        assignment.can_manage_tenants = request.data.get('can_manage_tenants', assignment.can_manage_tenants)
        assignment.can_view_payments = request.data.get('can_view_payments', assignment.can_view_payments)
        assignment.can_collect_payments = request.data.get('can_collect_payments', assignment.can_collect_payments)
        assignment.save()

        serializer = WardenAssignmentSerializer(assignment)
        return Response(serializer.data,
                        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='managers')
    def list_managers(self, request, pk=None):
        """
        List all active managers assigned to this branch.
        GET /api/v2/branches/{id}/managers/
        """
        branch = self.get_object()
        assignments = WardenAssignment.objects.filter(
            branch=branch, is_active=True
        ).select_related('warden', 'warden__profile', 'assigned_by')
        serializer = WardenAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='managers/(?P<assignment_id>[^/.]+)/permissions')
    def update_manager_permissions(self, request, pk=None, assignment_id=None):
        """
        Update permission flags for a specific manager assignment.
        PATCH /api/v2/branches/{id}/managers/{assignment_id}/permissions/
        Body: { can_manage_rooms, can_manage_tenants, can_view_payments, can_collect_payments }
        """
        branch = self.get_object()
        user = request.user
        user_role = getattr(getattr(user, 'profile', None), 'role', None)

        if user_role not in ['owner', 'admin']:
            return Response({'error': 'Only owners and admins can update manager permissions'},
                            status=status.HTTP_403_FORBIDDEN)
        if user_role == 'owner' and branch.owner != user:
            return Response({'error': 'You do not own this branch'},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            assignment = WardenAssignment.objects.get(id=assignment_id, branch=branch)
        except WardenAssignment.DoesNotExist:
            return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)

        for field in ['can_manage_rooms', 'can_manage_tenants', 'can_view_payments', 'can_collect_payments']:
            if field in request.data:
                setattr(assignment, field, request.data[field])
        assignment.save()

        serializer = WardenAssignmentSerializer(assignment)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], url_path='managers/(?P<assignment_id>[^/.]+)')
    def remove_manager(self, request, pk=None, assignment_id=None):
        """
        Deactivate (soft-remove) a manager assignment.
        DELETE /api/v2/branches/{id}/managers/{assignment_id}/
        """
        branch = self.get_object()
        user = request.user
        user_role = getattr(getattr(user, 'profile', None), 'role', None)

        if user_role not in ['owner', 'admin']:
            return Response({'error': 'Only owners and admins can remove managers'},
                            status=status.HTTP_403_FORBIDDEN)
        if user_role == 'owner' and branch.owner != user:
            return Response({'error': 'You do not own this branch'},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            assignment = WardenAssignment.objects.get(id=assignment_id, branch=branch)
        except WardenAssignment.DoesNotExist:
            return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)

        assignment.is_active = False
        assignment.save()
        return Response({'message': 'Manager removed from branch'}, status=status.HTTP_200_OK)

    # ── Existing branch detail actions ────────────────────────────────────

    @action(detail=True, methods=['get'])
    def rooms(self, request, pk=None):
        """Get all rooms for a branch"""
        branch = self.get_object()
        rooms = Room.objects.filter(branch=branch)
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def tenants(self, request, pk=None):
        """Get all tenants for a branch"""
        branch = self.get_object()
        tenants = Tenant.objects.filter(room__branch=branch)
        serializer = TenantSerializer(tenants, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def occupancy_stats(self, request, pk=None):
        """Get occupancy statistics for a branch.

        Field names deliberately mirror BranchSerializer so the frontend can
        use the same keys regardless of whether the data came from the list
        endpoint or this detail endpoint.
        """
        branch = self.get_object()

        rooms = Room.objects.filter(branch=branch).prefetch_related('tenants')
        total_rooms = rooms.count()

        # Total beds = sum of sharing_type (capacity) across all rooms
        total_beds = sum(room.sharing_type or 0 for room in rooms)

        # Active tenants = joined and not yet vacated (matches Room.current_occupancy)
        occupied_beds = Tenant.objects.filter(
            room__branch=branch,
            joining_date__isnull=False,
            vacating_date__isnull=True,
        ).count()

        vacant_beds = total_beds - occupied_beds

        # Rooms that contain at least one active tenant
        occupied_rooms = Room.objects.filter(
            branch=branch,
            tenants__joining_date__isnull=False,
            tenants__vacating_date__isnull=True,
        ).distinct().count()

        return Response({
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'vacant_rooms': total_rooms - occupied_rooms,
            'total_beds': total_beds,
            'occupied_beds': occupied_beds,
            'vacant_beds': vacant_beds,
            'bed_occupancy_rate': (occupied_beds / total_beds * 100) if total_beds > 0 else 0,
            'room_occupancy_rate': (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0,
        })


class EnhancedRoomViewSet(viewsets.ModelViewSet):
    """
    Enhanced Room ViewSet with role-based access
    """
    serializer_class = RoomSerializer
    permission_classes = [RoleBasedPermission]
    
    def get_queryset(self):
        user = self.request.user
        
        if not hasattr(user, 'profile'):
            return Room.objects.none()
        
        user_role = user.profile.role
        
        if user_role == 'admin':
            queryset = Room.objects.all().select_related('branch')

        elif user_role == 'owner':
            queryset = Room.objects.filter(branch__owner=user).select_related('branch')
        
        # Wardens see rooms in assigned branches
        elif user_role == 'warden':
            from .models import WardenAssignment
            assigned_branches = WardenAssignment.objects.filter(
                warden=user, is_active=True
            ).values_list('branch', flat=True)
            queryset = Room.objects.filter(branch__in=assigned_branches).select_related('branch')
        
        # Tenants see available rooms in active branches
        elif user_role == 'tenant':
            queryset = Room.objects.filter(
                branch__is_active=True,
                is_available=True
            ).select_related('branch')
        else:
            return Room.objects.none()
        
        # Apply query parameter filters
        branch_id = self.request.query_params.get('branch', None)
        if branch_id and branch_id != 'all':
            queryset = queryset.filter(branch_id=branch_id)
        
        status = self.request.query_params.get('status', None)
        if status and status != 'all':
            if status == 'available':
                # Available: is_available=True AND has vacant beds
                queryset = queryset.filter(
                    is_available=True
                ).annotate(
                    occupancy_count=Count('tenants', filter=Q(tenants__joining_date__isnull=False, tenants__vacating_date__isnull=True))
                ).filter(
                    Q(occupancy_count__lt=F('sharing_type')) | Q(sharing_type__isnull=True)
                )
            elif status == 'occupied':
                # Occupied: is_available=True AND room is full
                queryset = queryset.filter(
                    is_available=True
                ).annotate(
                    occupancy_count=Count('tenants', filter=Q(tenants__joining_date__isnull=False, tenants__vacating_date__isnull=True))
                ).filter(
                    occupancy_count__gte=F('sharing_type'),
                    sharing_type__isnull=False
                )
            elif status == 'maintenance':
                queryset = queryset.filter(is_available=False)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def tenants(self, request, pk=None):
        """Get current tenants in a room"""
        room = self.get_object()
        tenants = Tenant.objects.filter(room=room, vacating_date__isnull=True)
        serializer = TenantSerializer(tenants, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Check room availability"""
        room = self.get_object()
        current_occupancy = room.current_occupancy
        available_slots = room.sharing_type - current_occupancy
        
        return Response({
            'room_name': room.room_name,
            'sharing_type': room.sharing_type,
            'current_occupancy': current_occupancy,
            'available_slots': available_slots,
            'is_available': available_slots > 0,
            'is_full': room.is_full
        })


class EnhancedTenantViewSet(viewsets.ModelViewSet):
    """
    Enhanced Tenant ViewSet with role-based access.

    Supported query parameters
    --------------------------
    status   : active | vacated | pending   (lifecycle filter)
    branch   : <branch_id> | all            (branch filter; ignored for tenant role)
    search   : <string>                     (name / phone / email icontains)
    page     : <int>                        (pagination; works with DRF PageNumberPagination)
    page_size: <int>
    """
    serializer_class = TenantSerializer
    permission_classes = [RoleBasedPermission]

    # ── Status filter mapping ──────────────────────────────────────────────
    _STATUS_FILTERS = {
        'active':  {'joining_date__isnull': False, 'vacating_date__isnull': True},
        'vacated': {'vacating_date__isnull': False},
        'pending': {'joining_date__isnull': True},
    }

    def get_queryset(self):
        user = self.request.user

        if not hasattr(user, 'profile'):
            return Tenant.objects.none()

        user_role = user.profile.role

        # ── 1. Role-based base queryset ────────────────────────────────────
        if user_role == 'admin':
            queryset = Tenant.objects.all()

        elif user_role == 'owner':
            queryset = Tenant.objects.filter(room__branch__owner=user)

        elif user_role == 'warden':
            from .models import WardenAssignment
            assigned_branches = WardenAssignment.objects.filter(
                warden=user, is_active=True
            ).values_list('branch', flat=True)
            queryset = Tenant.objects.filter(room__branch__in=assigned_branches)

        elif user_role == 'tenant':
            # Tenants always see only themselves; skip further param filters
            return (
                Tenant.objects
                .filter(user=user)
                .select_related('user', 'room', 'room__branch')
            )

        else:
            return Tenant.objects.none()

        # ── 2. Lifecycle status filter ─────────────────────────────────────
        status_param = self.request.query_params.get('status', '').strip().lower()
        if status_param in self._STATUS_FILTERS:
            queryset = queryset.filter(**self._STATUS_FILTERS[status_param])

        # ── 3. Branch filter ───────────────────────────────────────────────
        branch_param = self.request.query_params.get('branch', '').strip()
        if branch_param and branch_param != 'all':
            queryset = queryset.filter(room__branch_id=branch_param)

        # ── 4. Full-text search (name / phone / email) ─────────────────────
        search_param = self.request.query_params.get('search', '').strip()
        if search_param:
            queryset = queryset.filter(
                Q(name__icontains=search_param)
                | Q(phone_number__icontains=search_param)
                | Q(email__icontains=search_param)
            )

        return queryset.select_related('user', 'room', 'room__branch')
    
    def perform_create(self, serializer):
        tenant = serializer.save(created_by=self.request.user)
        credentials = self._auto_create_tenant_user(tenant)
        # Stash credentials on the tenant instance so create() can include them
        tenant._generated_credentials = credentials

    def _auto_create_tenant_user(self, tenant):
        """Create a Django User account for a newly added tenant.

        Username  : phone number (stripped of spaces/dashes)
        Password  : {username}@{birth_year}  (e.g. 9876543210@1995)
        Returns a dict with the generated credentials, or None if skipped.
        """
        phone = (tenant.phone_number or '').strip().replace(' ', '').replace('-', '')
        if not phone:
            logger.warning('Tenant %s has no phone number; skipping user creation', tenant.pk)
            return None

        username = phone
        dob = tenant.date_of_birth
        birth_year = str(dob.year) if dob else '0000'
        password = f"{username}@{birth_year}"

        if User.objects.filter(username=username).exists():
            # User already exists (e.g. re-adding the same tenant) — just link
            existing_user = User.objects.get(username=username)
            if not hasattr(existing_user, 'tenant_profile') or existing_user.tenant_profile is None:
                tenant.user = existing_user
                tenant.save(update_fields=['user'])
            logger.info('Tenant user already exists for phone %s; linked to tenant %s', username, tenant.pk)
            return None

        name_parts = (tenant.name or '').split()
        first_name = name_parts[0] if name_parts else ''
        last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''

        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            email=tenant.email or '',
        )
        UserProfile.objects.create(
            user=user,
            role='tenant',
            phone_number=phone,
            must_change_password=True,
        )
        tenant.user = user
        tenant.save(update_fields=['user'])
        logger.info('Auto-created user "%s" for tenant %s', username, tenant.pk)
        return {'username': username, 'password': password}

    def create(self, request, *args, **kwargs):
        """Override create to add better error handling and return generated credentials."""
        try:
            logger.debug('Creating tenant with data: %s', request.data)
            serializer = self.get_serializer(data=request.data)

            if not serializer.is_valid():
                logger.warning('Tenant create validation errors: %s', serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            self.perform_create(serializer)
            logger.info('Tenant created: %s by %s', serializer.data.get('name'), request.user)
            headers = self.get_success_headers(serializer.data)

            # Include generated login credentials in response so the UI can show them
            response_data = dict(serializer.data)
            tenant_instance = serializer.instance
            creds = getattr(tenant_instance, '_generated_credentials', None)
            if creds:
                response_data['generated_credentials'] = creds
            return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as exc:
            logger.exception('Error creating tenant: %s', exc)
            return Response(
                {'error': f'Failed to create tenant: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    
    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """Get payment history for a tenant"""
        tenant = self.get_object()
        payments = RentPayment.objects.filter(tenant=tenant).order_by('-payment_date')
        serializer = RentPaymentSerializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='rent-ledger')
    def rent_ledger(self, request, pk=None):
        """
        GET /api/v2/tenants/{id}/rent-ledger/
        Returns full rent ledger for a specific tenant.
        Accessible by admin, owner (own branch), warden (assigned branch).
        """
        from .rent_utils import build_rent_ledger, current_month_rent_status
        tenant = self.get_object()  # enforces has_object_permission

        ledger = build_rent_ledger(tenant)
        total_paid = sum(e['total_paid'] for e in ledger)
        total_due = sum(e['due'] for e in ledger)
        overdue_count = sum(1 for e in ledger if e['rent_status'] == 'OVERDUE')
        current = ledger[0] if ledger else None

        return Response({
            'tenant_id': tenant.pk,
            'tenant_name': tenant.name,
            'room': tenant.room.room_name if tenant.room else None,
            'branch': tenant.room.branch.name if tenant.room and tenant.room.branch else None,
            'joining_date': tenant.joining_date,
            'vacating_date': tenant.vacating_date,
            'summary': {
                'total_months': len(ledger),
                'total_paid': total_paid,
                'total_due': total_due,
                'overdue_months_count': overdue_count,
                'current_month_status': current['rent_status'] if current else None,
            },
            'ledger': ledger,
        })

    @action(detail=True, methods=['post'], url_path='record-payment')
    def record_payment(self, request, pk=None):
        """
        POST /api/v2/tenants/{id}/record-payment/

        Record or update a rent payment for a specific month.
        Uses update_or_create so partial payments can be topped-up safely
        without violating the unique_together(tenant, for_month) constraint.

        Body:
            for_month       str  YYYY-MM or YYYY-MM-DD (required)
            amount_paid     num  payment amount (required)
            payment_method  str  cash|upi|bank_transfer|card|cheque (default: cash)
            payment_date    str  YYYY-MM-DD (default: today)
            reference_number str (optional)
            notes           str  (optional)
        """
        from datetime import date as date_type, datetime
        from decimal import Decimal, InvalidOperation

        tenant = self.get_object()  # enforces has_object_permission

        # ── Validate for_month ─────────────────────────────────────────
        raw_month = request.data.get('for_month', '')
        if not raw_month:
            return Response(
                {'error': 'for_month is required. Use YYYY-MM format.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            for_month_date = datetime.strptime(raw_month[:7], '%Y-%m').date().replace(day=1)
        except ValueError:
            return Response(
                {'error': f'Invalid for_month: "{raw_month}". Use YYYY-MM.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Validate amount ────────────────────────────────────────────
        raw_amount = request.data.get('amount_paid')
        if raw_amount is None:
            return Response(
                {'error': 'amount_paid is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            amount = Decimal(str(raw_amount))
            if amount <= 0:
                raise ValueError('must be positive')
        except (InvalidOperation, ValueError):
            return Response(
                {'error': 'amount_paid must be a positive number.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Parse payment_date ─────────────────────────────────────────
        raw_pd = request.data.get('payment_date', '')
        try:
            payment_date = datetime.strptime(raw_pd, '%Y-%m-%d').date() if raw_pd else date_type.today()
        except ValueError:
            payment_date = date_type.today()

        payment_method   = request.data.get('payment_method', 'cash')
        reference_number = request.data.get('reference_number', '')
        notes            = request.data.get('notes', '')

        payment, created = RentPayment.objects.update_or_create(
            tenant=tenant,
            for_month=for_month_date,
            defaults={
                'amount_paid':      amount,
                'payment_date':     payment_date,
                'payment_method':   payment_method,
                'reference_number': reference_number,
                'notes':            notes,
                'collected_by':     request.user,
            },
        )

        action_word = 'recorded' if created else 'updated'
        logger.info(
            'Rent payment %s for tenant %s (id=%s) month=%s amount=%s by %s',
            action_word, tenant.name, tenant.pk, for_month_date, amount, request.user,
        )

        # Return a lightweight response — avoid the nested TenantSerializer
        # chain (Tenant → Room → Branch) which can fail if related objects
        # are not pre-fetched on the freshly updated payment instance.
        return Response(
            {
                'message': f'Payment {action_word} successfully.',
                'created': created,
                'payment': {
                    'id':               payment.pk,
                    'for_month':        payment.for_month.strftime('%Y-%m-%d'),
                    'for_month_display': for_month_date.strftime('%B %Y'),
                    'amount_paid':      float(payment.amount_paid),
                    'payment_method':   payment.payment_method,
                    'payment_date':     payment.payment_date.strftime('%Y-%m-%d'),
                    'reference_number': payment.reference_number,
                    'notes':            payment.notes,
                },
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'], url_path='rent-status')
    def rent_status(self, request, pk=None):
        """
        GET /api/v2/tenants/{id}/rent-status/
        GET /api/v2/tenants/{id}/rent-status/?month=YYYY-MM
        Returns rent status for a specific month (defaults to current month).
        """
        from datetime import date
        from .rent_utils import month_rent_status
        tenant = self.get_object()

        month_param = request.query_params.get('month')
        if month_param:
            try:
                parts = month_param.split('-')
                target = date(int(parts[0]), int(parts[1]), 1)
            except (ValueError, IndexError):
                return Response(
                    {'error': 'Invalid month format. Use YYYY-MM.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            target = date.today()

        result = month_rent_status(tenant, target)
        return Response({'tenant_id': tenant.pk, 'tenant_name': tenant.name, **result})
    
    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        """
        Check out a tenant by setting vacating_date.
        Body: { "vacating_date": "YYYY-MM-DD" }  (optional; defaults to today)
        """
        from datetime import date as date_type
        tenant = self.get_object()

        if tenant.vacating_date:
            return Response(
                {
                    'error': 'Tenant is already checked out.',
                    'detail': f'vacating_date is already set to {tenant.vacating_date}.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw_date = request.data.get('vacating_date')
        if raw_date:
            try:
                from datetime import datetime
                vacating_date = datetime.strptime(raw_date, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            vacating_date = date_type.today()

        try:
            tenant.vacating_date = vacating_date
            tenant.save()
        except Exception as exc:
            logger.exception(
                'checkout failed for tenant %s (id=%s): %s', tenant.name, tenant.pk, exc
            )
            return Response(
                {'error': 'Checkout failed.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        logger.info(
            'Tenant %s (id=%s) checked out on %s by %s',
            tenant.name, tenant.pk, vacating_date, request.user,
        )
        serializer = self.get_serializer(tenant)
        return Response({
            'message': 'Tenant checked out successfully',
            'tenant': serializer.data,
        })

    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        """Reactivate a tenant (clear vacating date)"""
        tenant = self.get_object()

        if not tenant.vacating_date:
            return Response(
                {'error': 'Tenant is already active'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            tenant.vacating_date = None
            tenant.save()
        except Exception as exc:
            logger.exception(
                'reactivate failed for tenant %s (id=%s): %s', tenant.name, tenant.pk, exc
            )
            return Response(
                {'error': 'Reactivation failed.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        logger.info('Tenant %s (id=%s) reactivated by %s', tenant.name, tenant.pk, request.user)
        serializer = self.get_serializer(tenant)
        return Response({
            'message': 'Tenant reactivated successfully',
            'tenant': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """
        Hard delete a tenant record.
        Allowed only for admin and owner roles.
        Wardens and tenants should use the checkout action instead.
        """
        user_role = getattr(getattr(request.user, 'profile', None), 'role', None)
        if user_role not in ('admin', 'owner'):
            return Response(
                {
                    'error': 'Delete is not permitted for your role.',
                    'detail': (
                        'Use the Checkout action to mark a tenant as vacated. '
                        'This preserves the full history.'
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        tenant = self.get_object()
        logger.info(
            'Hard-deleting tenant %s (id=%s) by user %s',
            tenant.name, tenant.pk, request.user,
        )
        return super().destroy(request, *args, **kwargs)


class EnhancedRoomOccupancyViewSet(viewsets.ModelViewSet):
    """
    Enhanced Room Occupancy ViewSet with role-based access
    """
    serializer_class = RoomOccupancySerializer
    permission_classes = [RoleBasedPermission]
    
    def get_queryset(self):
        user = self.request.user
        
        if not hasattr(user, 'profile'):
            return RoomOccupancy.objects.none()
        
        user_role = user.profile.role
        
        if user_role == 'admin':
            return RoomOccupancy.objects.all().select_related('room', 'tenant', 'room__branch')

        elif user_role == 'owner':
            return RoomOccupancy.objects.filter(
                room__branch__owner=user
            ).select_related('room', 'tenant', 'room__branch')
        
        # Wardens see occupancy in assigned branches
        elif user_role == 'warden':
            from .models import WardenAssignment
            assigned_branches = WardenAssignment.objects.filter(
                warden=user, is_active=True
            ).values_list('branch', flat=True)
            return RoomOccupancy.objects.filter(
                room__branch__in=assigned_branches
            ).select_related('room', 'tenant', 'room__branch')
        
        # Tenants see only their own occupancy records
        elif user_role == 'tenant':
            return RoomOccupancy.objects.filter(
                tenant__user=user
            ).select_related('room', 'tenant', 'room__branch')
        
        return RoomOccupancy.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EnhancedRentPaymentViewSet(viewsets.ModelViewSet):
    """
    Enhanced Rent Payment ViewSet with role-based access
    """
    serializer_class = RentPaymentSerializer
    permission_classes = [RoleBasedPermission]
    
    def get_queryset(self):
        user = self.request.user
        
        if not hasattr(user, 'profile'):
            return RentPayment.objects.none()
        
        user_role = user.profile.role
        
        if user_role == 'admin':
            return RentPayment.objects.all().select_related('tenant', 'tenant__room', 'tenant__room__branch')

        elif user_role == 'owner':
            return RentPayment.objects.filter(
                tenant__room__branch__owner=user
            ).select_related('tenant', 'tenant__room', 'tenant__room__branch')

        elif user_role == 'warden':
            assigned_branches = WardenAssignment.objects.filter(
                warden=user, is_active=True, can_view_payments=True
            ).values_list('branch', flat=True)
            return RentPayment.objects.filter(
                tenant__room__branch__in=assigned_branches
            ).select_related('tenant', 'tenant__room', 'tenant__room__branch')
        
        # Tenants see only their own payments
        elif user_role == 'tenant':
            return RentPayment.objects.filter(
                tenant__user=user
            ).select_related('tenant', 'tenant__room', 'tenant__room__branch')
        
        return RentPayment.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(collected_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """Get monthly payment summary"""
        from django.db.models import Sum, Count
        from datetime import date, timedelta
        
        # Get date range (current month by default)
        today = date.today()
        month = request.query_params.get('month', today.month)
        year = request.query_params.get('year', today.year)
        
        payments = self.get_queryset().filter(
            payment_date__month=month,
            payment_date__year=year
        )
        
        summary = payments.aggregate(
            total_amount=Sum('amount_paid'),
            total_payments=Count('id')
        )
        
        return Response({
            'month': month,
            'year': year,
            'total_amount': summary['total_amount'] or 0,
            'total_payments': summary['total_payments'] or 0,
            'payments': RentPaymentSerializer(payments, many=True).data
        })


class FoodMenuViewSet(viewsets.ModelViewSet):
    """CRUD for food menu.

    Admin / Owner  — full create, update, delete.
    Warden         — read-only.
    Tenant         — read-only (only today + upcoming 7 days).
    """
    from .models import FoodMenu
    from .serializers import FoodMenuSerializer

    serializer_class = None   # set in get_serializer_class
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        from .views_kitchen import FoodMenuWithItemsSerializer
        return FoodMenuWithItemsSerializer

    def get_queryset(self):
        from .models import FoodMenu
        from datetime import date, timedelta
        role = getattr(self.request.user, 'profile', None)
        role_name = role.role if role else None
        qs = FoodMenu.objects.all()

        # Tenants only see today and next 7 days
        if role_name == 'tenant':
            today = date.today()
            qs = qs.filter(date__gte=today, date__lte=today + timedelta(days=7))

        # Optional ?date=YYYY-MM-DD filter
        date_param = self.request.query_params.get('date')
        if date_param:
            qs = qs.filter(date=date_param)

        # Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD range filter
        from_date = self.request.query_params.get('from')
        to_date = self.request.query_params.get('to')
        if from_date:
            qs = qs.filter(date__gte=from_date)
        if to_date:
            qs = qs.filter(date__lte=to_date)

        return qs

    def _check_write_permission(self):
        role = getattr(self.request.user, 'profile', None)
        role_name = role.role if role else None
        if role_name not in ('admin', 'owner'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only admin and owners can manage the food menu.')

    def perform_create(self, serializer):
        self._check_write_permission()
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        self._check_write_permission()
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        self._check_write_permission()
        instance.delete()

    @action(detail=False, methods=['get'], url_path='today')
    def today(self, request):
        """Return all meals for today grouped by meal_type."""
        from datetime import date
        from .views_kitchen import FoodMenuWithItemsSerializer
        menus = FoodMenu.objects.filter(date=date.today()).prefetch_related('menu_items__ingredients__grocery_item')
        return Response(FoodMenuWithItemsSerializer(menus, many=True).data)

    @action(detail=False, methods=['get'], url_path='week')
    def week(self, request):
        """Return meals for today + next 6 days grouped by date."""
        from datetime import date, timedelta
        from .views_kitchen import FoodMenuWithItemsSerializer
        today = date.today()
        menus = FoodMenu.objects.filter(
            date__gte=today, date__lte=today + timedelta(days=6)
        ).prefetch_related('menu_items__ingredients__grocery_item')
        return Response(FoodMenuWithItemsSerializer(menus, many=True).data)
