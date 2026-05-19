# core/views_enhanced.py
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
                if user_role == 'warden':
                    # enforce can_manage_rooms / can_manage_tenants flag
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
        """Get occupancy statistics for a branch"""
        branch = self.get_object()
        
        rooms = Room.objects.filter(branch=branch)
        total_rooms = rooms.count()
        total_capacity = sum(room.sharing_type for room in rooms)
        
        active_tenants = Tenant.objects.filter(
            room__branch=branch, 
            vacating_date__isnull=True
        ).count()
        
        occupied_rooms = Room.objects.filter(
            branch=branch,
            tenants__vacating_date__isnull=True
        ).distinct().count()
        
        return Response({
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'total_capacity': total_capacity,
            'current_occupancy': active_tenants,
            'occupancy_rate': (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0,
            'capacity_utilization': (active_tenants / total_capacity * 100) if total_capacity > 0 else 0
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
        # Set created_by to current user
        serializer.save(created_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Override create to add better error handling"""
        try:
            print(f"Creating tenant with data: {request.data}")
            serializer = self.get_serializer(data=request.data)
            
            if not serializer.is_valid():
                print(f"Serializer validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            print(f"Error creating tenant: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to create tenant: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """Get payment history for a tenant"""
        tenant = self.get_object()
        payments = RentPayment.objects.filter(tenant=tenant).order_by('-payment_date')
        serializer = RentPaymentSerializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        """Check out a tenant (set vacating date)"""
        tenant = self.get_object()
        
        from datetime import date
        vacating_date = request.data.get('vacating_date', date.today())
        
        tenant.vacating_date = vacating_date
        tenant.save()
        
        serializer = self.get_serializer(tenant)
        return Response({
            'message': 'Tenant checked out successfully',
            'tenant': serializer.data
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
        
        tenant.vacating_date = None
        tenant.save()
        
        serializer = self.get_serializer(tenant)
        return Response({
            'message': 'Tenant reactivated successfully',
            'tenant': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to prevent hard delete - only soft delete allowed"""
        return Response(
            {
                'error': 'Hard delete is not allowed. Use checkout action to mark tenant as vacated.',
                'detail': 'To vacate a tenant, use POST /api/v2/tenants/{id}/checkout/ with vacating_date'
            },
            status=status.HTTP_403_FORBIDDEN
        )


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
