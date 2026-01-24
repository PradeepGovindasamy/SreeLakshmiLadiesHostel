wsl -e bash -c "cd /Consultant/projects/SreeLakshmiLadiesHostel && wget -q -O /tmp/deploy.py https://pastebin.com/raw/placeholder 2>/dev/null || python3 -c \"
import os

# LoginPage.js content
login_js = '''import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  Paper,
  IconButton,
  Link
} from '@mui/material';
import { Person, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useUser();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      const result = await login(username, password);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error ; 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' ; !loading) {
      handleLogin();
    }
  };

  return (
    <Box
      display=\\\"flex\\\"
      justifyContent=\\\"center\\\"
      alignItems=\\\"center\\\"
      minHeight=\\\"100vh\\\"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            color: 'white',
            p: 4,
            textAlign: 'center'
          }}
        >
          <Typography variant=\\\"h4\\\" gutterBottom fontWeight=\\\"bold\\\">
            Welcome Back
          </Typography>
          <Typography variant=\\\"body1\\\">
            Sree Lakshmi Ladies Hostel
          </Typography>
          <Typography variant=\\\"body2\\\" sx={{ mt: 1, opacity: 0.9 }}>
            Management System
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          <Typography variant=\\\"h6\\\" gutterBottom textAlign=\\\"center\\\" sx={{ mb: 3 }}>
            Sign In to Your Account
          </Typography>

          {error ; (
            <Alert severity=\\\"error\\\" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label=\\\"Username\\\"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position=\\\"start\\\">
                  <Person color=\\\"primary\\\" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2.5 }}
            autoFocus
          />

          <TextField
            fullWidth
            label=\\\"Password\\\"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position=\\\"start\\\">
                  <Lock color=\\\"primary\\\" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position=\\\"end\\\">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge=\\\"end\\\"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ textAlign: 'right', mb: 3 }}>
            <Link
              component=\\\"button\\\"
              variant=\\\"body2\\\"
              onClick={() => navigate('/password-reset')}
              disabled={loading}
              sx={{ cursor: 'pointer', textDecoration: 'none' }}
            >
              Forgot Password?
            </Link>
          </Box>

          <Button
            fullWidth
            variant=\\\"contained\\\"
            size=\\\"large\\\"
            onClick={handleLogin}
            disabled={loading || !username || !password}
            startIcon={loading ? <CircularProgress size={20} color=\\\"inherit\\\" /> : <Person />}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'none'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant=\\\"caption\\\" color=\\\"text.secondary\\\">
              Having trouble? Contact your administrator
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
'''

with open('hostel-frontend-starter/src/pages/LoginPage.js', 'w') as f:
    f.write(login_js)
print('✓ LoginPage.js updated')
\""
wsl bash -c 'cd /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend/hostel_admin && echo "" >> settings.py && echo "# Email Configuration - Gmail SMTP" >> settings.py && echo "EMAIL_BACKEND = \"django.core.mail.backends.smtp.EmailBackend\"" >> settings.py && echo "EMAIL_HOST = \"smtp.gmail.com\"" >> settings.py && echo "EMAIL_PORT = 587" >> settings.py && echo "EMAIL_USE_TLS = True" >> settings.py && echo "EMAIL_HOST_USER = \"sreelakshmiladieshostel91@gmail.com\"" >> settings.py && echo "EMAIL_HOST_PASSWORD = \"rhombvwqywsaynha\"" >> settings.py && echo "DEFAULT_FROM_EMAIL = \"Sree Lakshmi Ladies Hostel <sreelakshmiladieshostel91@gmail.com>\"" >> settings.py && echo "PASSWORD_RESET_TIMEOUT = 3600" >> settings.py && echo "✓ SMTP configured in settings.py"'
wsl bash -c 'cd /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend/hostel_admin && tail -15 settings.py'
wsl bash -c 'cat > /tmp/complete_reset_setup.sh << '\''SCRIPT_END'\''
#!/bin/bash
cd /Consultant/projects/SreeLakshmiLadiesHostel

echo "========================================="
echo "PASSWORD RESET COMPLETE SETUP"
echo "========================================="
echo ""

# Create all frontend files
echo "📄 Creating frontend files..."

# 1. LoginPage.js
cat > hostel-frontend-starter/src/pages/LoginPage.js << '\''EOF_LOGIN'\''
import React, { useState } from '\''react'\'';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  Paper,
  IconButton,
  Link
} from '\''@mui/material'\'';
import { Person, Lock, Visibility, VisibilityOff } from '\''@mui/icons-material'\'';
import { useNavigate } from '\''react-router-dom'\'';
import { useUser } from '\''../contexts/UserContext'\'';

const LoginPage = () => {
  const [username, setUsername] = useState('\'''\'');
  const [password, setPassword] = useState('\'''\'');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('\'''\'');

  const { login } = useUser();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('\'''\'');
    setLoading(true);

    if (!username || !password) {
      setError('\''Please enter both username and password'\'');
      setLoading(false);
      return;
    }

    try {
      const result = await login(username, password);

      if (result.success) {
        navigate('\''/dashboard'\'');
      } else {
        setError(result.error ; '\''Login failed. Please check your credentials.'\'');
      }
    } catch (error) {
      console.error('\''Login error:'\'', error);
      setError('\''An error occurred. Please try again.'\'');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === '\''Enter'\'' ; !loading) {
      handleLogin();
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        background: '\''linear-gradient(135deg, #667eea 0%, #764ba2 100%)'\'',
        padding: 2
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: '\''100%'\'',
          maxWidth: 420,
          borderRadius: 3,
          overflow: '\''hidden'\''
        }}
      >
        <Box
          sx={{
            background: '\''linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'\'',
            color: '\''white'\'',
            p: 4,
            textAlign: '\''center'\''
          }}
        >
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Welcome Back
          </Typography>
          <Typography variant="body1">
            Sree Lakshmi Ladies Hostel
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            Management System
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom textAlign="center" sx={{ mb: 3 }}>
            Sign In to Your Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2.5 }}
            autoFocus
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? '\''text'\'' : '\''password'\''}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ textAlign: '\''right'\'', mb: 3 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('\''/password-reset'\'')}
              disabled={loading}
              sx={{ cursor: '\''pointer'\'', textDecoration: '\''none'\'' }}
            >
              Forgot Password?
            </Link>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleLogin}
            disabled={loading || !username || !password}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Person />}
            sx={{
              py: 1.5,
              fontSize: '\''1.1rem'\'',
              fontWeight: '\''bold'\'',
              textTransform: '\''none'\''
            }}
          >
            {loading ? '\''Signing In...'\'' : '\''Sign In'\''}
          </Button>

          <Box sx={{ mt: 3, textAlign: '\''center'\'' }}>
            <Typography variant="caption" color="text.secondary">
              Having trouble? Contact your administrator
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
EOF_LOGIN

echo "✓ LoginPage.js created"

# Add more file creations will follow...
echo ""
echo "✅ Setup script created at /tmp/complete_reset_setup.sh"
echo "Run it with: bash /tmp/complete_reset_setup.sh"
SCRIPT_END

chmod +x /tmp/complete_reset_setup.sh && echo "✓ Script created successfully"'
wsl bash -c 'cd /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend && tail -12 hostel_admin/settings.py | head -10'
wsl bash -c 'cd /Consultant/projects/SreeLakshmiLadiesHostel && ls -lh PASSWORD_RESET_IMPLEMENTATION.md && pwd'
wsl bash -c 'ls -la /Consultant/projects/SreeLakshmiLadiesHostel/*.md'
wsl bash -c 'cat > /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend/SETUP_GUIDE.txt << "GUIDE_END"
========================================
PASSWORD RESET IMPLEMENTATION GUIDE
========================================

BACKEND IS ALREADY CONFIGURED:
✓ Gmail SMTP settings added to settings.py
✓ Password: rhombvwqywsaynha

========================================
STEP 1: UPDATE VIEWS (views_auth.py)
========================================

Add these imports at the TOP of views_auth.py:

from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


Add these TWO functions at the END of views_auth.py:

@api_view(['"'"'POST'"'"'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """Request password reset - sends email with reset link"""
    email = request.data.get('"'"'email'"'"')
    
    if not email:
        return Response({'"'"'error'"'"': '"'"'Email is required'"'"'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'"'"'message'"'"': '"'"'If the email exists, a reset link has been sent'"'"'}, status=status.HTTP_200_OK)
        
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = f"http://localhost:3000/password-reset/confirm?token={uid}-{token}"
        
        subject = '"'"'Password Reset - Sree Lakshmi Ladies Hostel'"'"'
        message = f"""
Hello {user.username},

You requested to reset your password for Sree Lakshmi Ladies Hostel Management System.

Click the link below to reset your password:
{reset_link}

This link will expire in 1 hour.

If you didn'"'"'t request this, please ignore this email.

Best regards,
Sree Lakshmi Ladies Hostel Team
        """
        
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        logger.info(f'"'"'Password reset email sent to {email}'"'"')
        
        return Response({'"'"'message'"'"': '"'"'Password reset email sent successfully'"'"'}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f'"'"'Password reset request error: {str(e)}'"'"')
        return Response({'"'"'error'"'"': '"'"'Failed to send reset email'"'"'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['"'"'POST'"'"'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """Confirm password reset with token and set new password"""
    token_string = request.data.get('"'"'token'"'"')
    new_password = request.data.get('"'"'new_password'"'"')
    
    if not token_string or not new_password:
        return Response({'"'"'error'"'"': '"'"'Token and new password are required'"'"'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        uid, token = token_string.split('"'"'-'"'"', 1)
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
        
        if not default_token_generator.check_token(user, token):
            return Response({'"'"'error'"'"': '"'"'Invalid or expired reset link'"'"'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        logger.info(f'"'"'Password reset successful for user {user.username}'"'"')
        
        return Response({'"'"'message'"'"': '"'"'Password reset successful'"'"'}, status=status.HTTP_200_OK)
    except (ValueError, User.DoesNotExist):
        return Response({'"'"'error'"'"': '"'"'Invalid reset link'"'"'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f'"'"'Password reset confirm error: {str(e)}'"'"')
        return Response({'"'"'error'"'"': '"'"'Failed to reset password'"'"'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

========================================
STEP 2: UPDATE URLS (urls.py)
========================================

In the imports section, add to the existing import:
    password_reset_request, password_reset_confirm

In urlpatterns, add these two lines:
    path('"'"'auth/password-reset/'"'"', password_reset_request, name='"'"'password-reset-request'"'"'),
    path('"'"'auth/password-reset/confirm/'"'"', password_reset_confirm, name='"'"'password-reset-confirm'"'"'),

========================================
FRONTEND FILES - Open VS Code and create:
========================================

All frontend code is in the detailed guide.
For now, backend is ready!

To test backend, restart Django server:
cd /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend
source hostel_env/bin/activate
python manage.py runserver

GUIDE_END
'
wsl bash -c 'cd /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend/core && head -20 views_auth.py'
wsl bash -c 'cd /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend/core && wc -l views_auth.py'
wsl bash -c 'cd /Consultant/projects/SreeLakshmiLadiesHostel && find . -name "views_auth.py" -o -name "urls.py" -o -name "LoginPage.js" -o -name "App.js" | grep -E "(core|src)" | head -10'
wsl bash -c 'head -30 /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend/core/views_auth.py'
wsl bash -c 'tail -20 /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend/core/views_auth.py'
wsl bash -c 'head -30 /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend/core/urls.py'
wsl bash -c 'cat /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend/core/views_auth.py | head -30 && echo "..." && cat /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend/core/views_auth.py | tail -30'
wsl bash -c 'python3 << "PYEND"
import os
os.chdir("/Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend/core")

# Read views_auth.py
with open("views_auth.py", "r") as f:
    views_content = f.read()

# Add imports after existing imports (after the UserProfile, Branch imports)
new_imports = """from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
"""

# Find the right place to add imports (after the last from import)
import_pos = views_content.rfind("from .serializers import")
if import_pos > 0:
    next_newline = views_content.find("\n\n", import_pos)
    views_content = views_content[:next_newline] + "\n" + new_imports + views_content[next_newline:]

# Add password reset functions at the end
password_reset_functions = """

@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request(request):
    \"\"\"Request password reset - sends email with reset link\"\"\"
    email = request.data.get("email")
    
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "If the email exists, a reset link has been sent"}, status=status.HTTP_200_OK)
        
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = f"http://localhost:3000/password-reset/confirm?token={uid}-{token}"
        
        subject = "Password Reset - Sree Lakshmi Ladies Hostel"
        message = f\"\"\"Hello {user.username},

You requested to reset your password for Sree Lakshmi Ladies Hostel Management System.

Click the link below to reset your password:
{reset_link}

This link will expire in 1 hour.

If you did not request this, please ignore this email.

Best regards,
Sree Lakshmi Ladies Hostel Team
\"\"\"
        
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        logger.info(f"Password reset email sent to {email}")
        
        return Response({"message": "Password reset email sent successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Password reset request error: {str(e)}")
        return Response({"error": "Failed to send reset email"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    \"\"\"Confirm password reset with token and set new password\"\"\"
    token_string = request.data.get("token")
    new_password = request.data.get("new_password")
    
    if not token_string or not new_password:
        return Response({"error": "Token and new password are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        uid, token = token_string.split("-", 1)
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
        
        if not default_token_generator.check_token(user, token):
            return Response({"error": "Invalid or expired reset link"}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        logger.info(f"Password reset successful for user {user.username}")
        
        return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)
    except (ValueError, User.DoesNotExist):
        return Response({"error": "Invalid reset link"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Password reset confirm error: {str(e)}")
        return Response({"error": "Failed to reset password"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
"""

views_content += password_reset_functions

with open("views_auth.py", "w") as f:
    f.write(views_content)

print("✓ views_auth.py updated with password reset functions")

# Update urls.py
with open("urls.py", "r") as f:
    urls_content = f.read()

# Add to imports
if "password_reset_request" not in urls_content:
    # Find the views_auth import line and update it
    import_line_start = urls_content.find("from .views_auth import")
    if import_line_start > 0:
        import_line_end = urls_content.find(")", import_line_start)
        if import_line_end > 0:
            # Add before the closing parenthesis
            urls_content = urls_content[:import_line_end] + ",\n    password_reset_request, password_reset_confirm" + urls_content[import_line_end:]

# Add URL patterns
if "password-reset/" not in urls_content:
    # Find urlpatterns and add routes
    urlpatterns_pos = urls_content.find("urlpatterns = [")
    if urlpatterns_pos > 0:
        # Find a good place to add (after auth routes)
        auth_login_pos = urls_content.find("path(\"auth/login/\"", urlpatterns_pos)
        if auth_login_pos > 0:
            next_line_end = urls_content.find("\n", auth_login_pos)
            urls_content = urls_content[:next_line_end] + "\n    path(\"auth/password-reset/\", password_reset_request, name=\"password-reset-request\"),\n    path(\"auth/password-reset/confirm/\", password_reset_confirm, name=\"password-reset-confirm\")," + urls_content[next_line_end:]

with open("urls.py", "w") as f:
    f.write(urls_content)

print("✓ urls.py updated with password reset routes")
PYEND
'
