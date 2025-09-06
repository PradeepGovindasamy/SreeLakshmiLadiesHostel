# core/views_auth.py
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Q
from .models import UserProfile, Branch
from .serializers import UserSerializer, UserProfileSerializer, UserWithProfileSerializer
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_user_with_profile_standalone(request):
    """
    Standalone function-based view for creating users with profiles
    This is an alternative to the ViewSet action method
    """
    try:
        with transaction.atomic():
            # Log the incoming request data (without password)
            safe_data = request.data.copy()
            if 'password' in safe_data:
                safe_data['password'] = '***'
            logger.info(f"Creating user with data: {safe_data}")
            
            # Extract user data
            user_data = {
                'username': request.data.get('username'),
                'email': request.data.get('email', ''),
                'first_name': request.data.get('first_name', ''),
                'last_name': request.data.get('last_name', ''),
            }
            
            password = request.data.get('password')
            profile_data = request.data.get('profile', {})
            
            # Validate required fields
            if not user_data['username'] or not password:
                return Response({
                    'error': 'Username and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if username already exists
            if User.objects.filter(username=user_data['username']).exists():
                return Response({
                    'error': 'Username already exists'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create user
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=password,
                first_name=user_data['first_name'],
                last_name=user_data['last_name']
            )
            
            # Create profile
            profile = UserProfile.objects.create(
                user=user,
                role=profile_data.get('role', 'owner'),
                phone_number=profile_data.get('phone_number', ''),
                business_name=profile_data.get('business_name', ''),
                business_license=profile_data.get('business_license', ''),
                is_active=profile_data.get('is_active', True),
            )
            
            response_data = {
                'user': UserSerializer(user).data,
                'profile': UserProfileSerializer(profile).data,
                'message': 'User created successfully'
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error in standalone user creation: {str(e)}", exc_info=True)
        return Response({
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CanCreateUser(permissions.BasePermission):
    """
    Permission that allows user creation for:
    1. Unauthenticated users (self-registration)
    2. Authenticated admin/owner users (creating other users)
    """
    
    def has_permission(self, request, view):
        # Allow unauthenticated users to create accounts (self-registration)
        if not request.user.is_authenticated:
            return True
        
        # Allow authenticated admin/owner users to create other users
        if hasattr(request.user, 'profile'):
            return request.user.profile.role in ['admin', 'owner']
        
        # Default to allowing if user doesn't have a profile (for backwards compatibility)
        return True


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes user profile information"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user profile information to the token response
        user = self.user
        try:
            profile = user.profile
            data['user'] = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
            data['profile'] = {
                'role': profile.role,
                'role_display': profile.get_role_display(),
                'phone_number': profile.phone_number,
                'branch_id': profile.branch.id if profile.branch else None,
                'branch_name': profile.branch.name if profile.branch else None,
            }
        except UserProfile.DoesNotExist:
            # Create a default profile if it doesn't exist
            profile = UserProfile.objects.create(user=user, role='tenant')
            data['profile'] = {
                'role': profile.role,
                'role_display': profile.get_role_display(),
                'phone_number': profile.phone_number,
                'branch_id': None,
                'branch_name': None,
            }
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that returns user profile information"""
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Custom login view that returns user and profile information
    Expected by frontend: /api/auth/login/
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'detail': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response({
            'detail': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active:
        return Response({
            'detail': 'User account is disabled'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Use the custom token serializer
    serializer = CustomTokenObtainPairSerializer()
    token_data = serializer.get_token(user)
    
    return Response({
        'access': str(token_data.access_token),
        'refresh': str(token_data),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        },
        'profile': {
            'role': user.profile.role if hasattr(user, 'profile') else 'tenant',
            'role_display': user.profile.get_role_display() if hasattr(user, 'profile') else 'Tenant',
            'phone_number': user.profile.phone_number if hasattr(user, 'profile') else '',
            'branch_id': user.profile.branch.id if hasattr(user, 'profile') and user.profile.branch else None,
            'branch_name': user.profile.branch.name if hasattr(user, 'profile') and user.profile.branch else None,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_detail_view(request):
    """
    Get current user details
    Expected by frontend: /api/auth/user/
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Get or update current user profile
    Expected by frontend: /api/auth/profile/
    """
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        # Create a default profile if it doesn't exist
        profile = UserProfile.objects.create(user=request.user, role='tenant')
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        serializer = UserProfileSerializer(
            profile, 
            data=request.data, 
            partial=(request.method == 'PATCH')
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users with profiles
    Supports creating users with roles in one step
    """
    queryset = User.objects.all()
    serializer_class = UserWithProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter users based on current user's role"""
        user = self.request.user
        if not hasattr(user, 'profile'):
            return User.objects.none()
        
        # Owners and admins can see all users
        if user.profile.role in ['owner', 'admin']:
            return User.objects.all().select_related('profile')
        
        # Wardens can see users in their assigned branches
        elif user.profile.role == 'warden':
            # Get branches where user is assigned as warden
            from .models import WardenAssignment
            assigned_branches = WardenAssignment.objects.filter(
                warden=user, is_active=True
            ).values_list('branch', flat=True)
            
            return User.objects.filter(
                profile__branch__in=assigned_branches
            ).select_related('profile')
        
        # Tenants can only see themselves
        else:
            return User.objects.filter(id=user.id).select_related('profile')
    
    def list(self, request, *args, **kwargs):
        """List users with optional role filtering and search"""
        queryset = self.get_queryset()
        
        # Apply role filter if provided
        role_filter = request.query_params.get('role')
        if role_filter and role_filter != 'all':
            queryset = queryset.filter(profile__role=role_filter)
        
        # Apply search filter if provided
        search_term = request.query_params.get('search')
        if search_term:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(username__icontains=search_term) |
                Q(first_name__icontains=search_term) |
                Q(last_name__icontains=search_term) |
                Q(email__icontains=search_term)
            )
        
        # Serialize and return
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['POST'], permission_classes=[CanCreateUser])
    def create_with_profile(self, request):
        """
        Create a user with profile in one step
        Expected payload:
        {
            "username": "user123",
            "password": "password123",
            "email": "user@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "profile": {
                "role": "tenant",
                "phone_number": "1234567890",
                "branch": 1
            }
        }
        """
        try:
            with transaction.atomic():
                # Log the incoming request data (without password)
                safe_data = request.data.copy()
                if 'password' in safe_data:
                    safe_data['password'] = '***'
                logger.info(f"Creating user with data: {safe_data}")
                
                # Extract user data
                user_data = {
                    'username': request.data.get('username'),
                    'email': request.data.get('email', ''),
                    'first_name': request.data.get('first_name', ''),
                    'last_name': request.data.get('last_name', ''),
                }
                
                password = request.data.get('password')
                profile_data = request.data.get('profile', {})
                
                # Validate required fields
                if not user_data['username'] or not password:
                    logger.warning("Missing required fields: username or password")
                    return Response({
                        'error': 'Username and password are required'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if username already exists
                if User.objects.filter(username=user_data['username']).exists():
                    logger.warning(f"Username already exists: {user_data['username']}")
                    return Response({
                        'error': 'Username already exists'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Create user
                logger.info(f"Creating user: {user_data['username']}")
                user = User.objects.create_user(
                    username=user_data['username'],
                    email=user_data['email'],
                    password=password,
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name']
                )
                logger.info(f"User created successfully: {user.id}")
                
                # Create or update profile
                profile_defaults = {
                    'role': profile_data.get('role', 'tenant'),
                    'phone_number': profile_data.get('phone_number', ''),
                    'business_name': profile_data.get('business_name', ''),
                    'business_license': profile_data.get('business_license', ''),
                    'is_active': profile_data.get('is_active', True),
                }
                logger.info(f"Profile defaults: {profile_defaults}")
                
                # Handle branch assignment
                branch_id = profile_data.get('branch')
                if branch_id:
                    try:
                        logger.info(f"Looking for branch with ID: {branch_id}")
                        branch = Branch.objects.get(id=branch_id)
                        profile_defaults['branch'] = branch
                        logger.info(f"Branch found: {branch.name}")
                    except Branch.DoesNotExist:
                        logger.error(f"Branch with id {branch_id} does not exist")
                        return Response({
                            'error': f'Branch with id {branch_id} does not exist'
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                logger.info("Creating user profile")
                profile, created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults=profile_defaults
                )
                logger.info(f"Profile created: {created}, Profile ID: {profile.id}")
                
                if not created:
                    # Update existing profile
                    logger.info("Updating existing profile")
                    for key, value in profile_defaults.items():
                        setattr(profile, key, value)
                    profile.save()
                
                # Prepare response data
                response_data = {
                    'user': UserSerializer(user).data,
                    'profile': UserProfileSerializer(profile).data,
                    'message': 'User created successfully'
                }
                
                logger.info(f"User creation completed successfully for: {user.username}")
                return Response(response_data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error(f"Error creating user with profile: {str(e)}", exc_info=True)
            return Response({
                'error': f'An error occurred while creating the user: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'])
    def update_profile(self, request, pk=None):
        """Update user profile"""
        user = self.get_object()
        
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user, role='tenant')
        
        serializer = UserProfileSerializer(
            profile, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'user': UserSerializer(user).data,
                'profile': serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_branches(request):
    """
    Get branches available for assignment based on user role
    """
    user = request.user
    
    if not hasattr(user, 'profile'):
        return Response({'branches': []})
    
    # Owners and admins can see all branches
    if user.profile.role in ['owner', 'admin']:
        branches = Branch.objects.filter(is_active=True)
    
    # Wardens can see their assigned branches
    elif user.profile.role == 'warden':
        from .models import WardenAssignment
        assigned_branches = WardenAssignment.objects.filter(
            warden=user, is_active=True
        ).values_list('branch', flat=True)
        branches = Branch.objects.filter(id__in=assigned_branches, is_active=True)
    
    # Tenants can see all branches (for room selection)
    else:
        branches = Branch.objects.filter(is_active=True)
    
    from .serializers import BranchSerializer
    serializer = BranchSerializer(branches, many=True)
    return Response({'branches': serializer.data})
