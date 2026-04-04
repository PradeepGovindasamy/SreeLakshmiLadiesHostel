# core/backends.py
"""
Custom authentication backend to allow login with email or username
"""
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()


class EmailOrUsernameBackend(ModelBackend):
    """
    Authenticate users with either email or username
    This allows flexible login while maintaining security
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate user with email or username
        
        Args:
            request: HTTP request object
            username: Can be either username or email
            password: User's password
            
        Returns:
            User object if authentication successful, None otherwise
        """
        if username is None or password is None:
            return None
        
        try:
            # Determine if input is email or username
            if '@' in username:
                # It's an email - case insensitive search
                user = User.objects.get(email__iexact=username)
            else:
                # It's a username - case insensitive search
                user = User.objects.get(username__iexact=username)
            
            # Verify password
            if user.check_password(password):
                return user
            
        except User.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a nonexistent user
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            # This shouldn't happen if email is unique
            return None
        
        return None
    
    def get_user(self, user_id):
        """
        Get user by ID
        Required by Django authentication system
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
