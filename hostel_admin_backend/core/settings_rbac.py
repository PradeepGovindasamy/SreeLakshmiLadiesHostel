# Settings configuration for role-based access control
# Add this to your Django settings.py file

# Middleware configuration with role-based access control
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    
    # Custom role-based access control middleware
    'core.middleware.RoleBasedAccessMiddleware',
    'core.middleware.PropertyOwnershipMiddleware',
    'core.middleware.APIRateLimitMiddleware',
    
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# REST Framework configuration with authentication and permissions
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    
    'JTI_CLAIM': 'jti',
    
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(hours=1),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=7),
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React development server
    "http://127.0.0.1:3000",
    # Add your production frontend URLs here
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-user-role',  # Custom header for role information
    'x-user-permissions',  # Custom header for permissions
]

# Caching Configuration for role-based data
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'hostel_rbac',
        'TIMEOUT': 300,  # 5 minutes default
    }
}

# Cache timeouts for different types of data
CACHE_TIMEOUTS = {
    'user_permissions': 60 * 15,  # 15 minutes
    'branch_statistics': 60 * 5,  # 5 minutes
    'dashboard_data': 60 * 2,     # 2 minutes
    'user_accessible_branches': 60 * 10,  # 10 minutes
}

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'hostel_rbac.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': 'security.log',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'core.middleware': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'core.decorators': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'security': {
            'handlers': ['security_file', 'console'],
            'level': 'WARNING',
            'propagate': True,
        },
    },
}

# Security Settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Session Security
SESSION_COOKIE_SECURE = True  # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'

# CSRF Protection
CSRF_COOKIE_SECURE = True  # Set to True in production with HTTPS
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'

# Role-based Access Control Settings
RBAC_SETTINGS = {
    'CACHE_USER_PERMISSIONS': True,
    'CACHE_TIMEOUT': 60 * 15,  # 15 minutes
    'LOG_ACCESS_ATTEMPTS': True,
    'RATE_LIMITING_ENABLED': True,
    'DEFAULT_RATE_LIMITS': {
        'admin': 1000,
        'owner': 500,
        'warden': 300,
        'tenant': 100,
        'anonymous': 20,
    },
    'PERMISSION_INHERITANCE': {
        'admin': ['owner', 'warden', 'tenant'],  # Admin inherits all permissions
        'owner': ['warden'],  # Owner inherits warden permissions for their properties
    }
}

# Email Configuration for notifications
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-gmail@gmail.com'  # REPLACE WITH YOUR GMAIL ADDRESS
EMAIL_HOST_PASSWORD = 'rhombvwqywsaynha'  # Gmail App Password provided
DEFAULT_FROM_EMAIL = 'your-gmail@gmail.com'  # REPLACE WITH YOUR GMAIL ADDRESS

# Frontend URL for password reset links
FRONTEND_URL = 'http://localhost:3000'

# Notification Settings
NOTIFICATION_SETTINGS = {
    'SEND_EMAIL_ON_TENANT_REQUEST': True,
    'SEND_EMAIL_ON_PAYMENT_RECEIVED': True,
    'SEND_EMAIL_ON_WARDEN_ASSIGNMENT': True,
    'EMAIL_TEMPLATES': {
        'tenant_request': 'emails/tenant_request.html',
        'payment_received': 'emails/payment_received.html',
        'warden_assignment': 'emails/warden_assignment.html',
    }
}

# API Documentation Settings
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header'
        }
    },
    'USE_SESSION_AUTH': False,
    'JSON_EDITOR': True,
    'SUPPORTED_SUBMIT_METHODS': [
        'get',
        'post',
        'put',
        'delete',
        'patch'
    ],
    'OPERATIONS_SORTER': 'alpha',
    'TAGS_SORTER': 'alpha',
    'DOC_EXPANSION': 'none',
    'DEEP_LINKING': True,
    'SHOW_EXTENSIONS': True,
    'DEFAULT_MODEL_RENDERING': 'example'
}

# File Upload Settings
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'  # Indian timezone
USE_I18N = True
USE_TZ = True

# Role-based File Access
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'

# Role-based media access patterns
ROLE_BASED_MEDIA_ACCESS = {
    'tenant_documents': {
        'allowed_roles': ['admin', 'owner', 'warden'],
        'owner_access': 'branch_ownership',
        'warden_access': 'branch_assignment',
    },
    'payment_receipts': {
        'allowed_roles': ['admin', 'owner', 'warden', 'tenant'],
        'tenant_access': 'own_payments_only',
    },
    'reports': {
        'allowed_roles': ['admin', 'owner'],
        'owner_access': 'own_properties_only',
    }
}
