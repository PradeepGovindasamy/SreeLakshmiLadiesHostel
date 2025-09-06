import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'your-secret-key'

DEBUG = True

ALLOWED_HOSTS = []

# Enhanced Password Security - temporarily reverted to defaults
# PASSWORD_HASHERS = [
#     'django.contrib.auth.hashers.Argon2PasswordHasher',  # Most secure
#     'django.contrib.auth.hashers.PBKDF2PasswordHasher',  # Default fallback
#     'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
#     'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
# ]

# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Session Security
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 3600  # 1 hour
CSRF_COOKIE_SECURE = False  # Set to True in production with HTTPS
CSRF_COOKIE_HTTPONLY = True

INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',
    'core',
]

# Firebase Configuration
FIREBASE_PROJECT_ID = 'srilakshmiladieshostel-daca8'
FIREBASE_API_KEY = 'AIzaSyARytYNTnnzBsBXfHygeNVaKsb8S9Si0YI'
FIREBASE_AUTH_DOMAIN = 'srilakshmiladieshostel-daca8.firebaseapp.com'
FIREBASE_STORAGE_BUCKET = 'srilakshmiladieshostel-daca8.firebasestorage.app'
FIREBASE_MESSAGING_SENDER_ID = '681210557169'
FIREBASE_APP_ID = '1:681210557169:web:5c20d69891ef895cefef50'
FIREBASE_MEASUREMENT_ID = 'G-F72CPFRGFS'

# Service Account Configuration (to be updated with your service account details)
FIREBASE_CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@srilakshmiladieshostel-daca8.iam.gserviceaccount.com'
FIREBASE_CLIENT_ID = '101563978609495690943'
FIREBASE_PRIVATE_KEY_ID = 'b3ad3da1ba4cb4a5dce41639ddfbdf3eade9b085'
FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDLXp0GewyCv8dM\\nMgVL0gQIFumjweOzWS//NDnqfuphmut4l+UoVi24RT+xDSRUaHsySw80Gpob9QD8\\nSDNSflJOD1flBJ5pf8lceoeY8eS4FAVYTpZHl7EzN2mHgegC4INTV2QcKc7aq8Jf\\nuOakhsmOSpw/9vI5sGQIeNZ3D67RUi71niJCkaYgYO8Kgx/Mj+lMt2WDvof4rL6d\\n+OhUbSCHuA4IwMSfe4ZC4SzMh2gD6WpSs3bpHH04mO0B1IQuYmctc5DuwM7BAu0I\\nJTwqkPNNSY4Vt+nTnGZ6eMrhy7ie6vH9QWp4k2Vnw/N3fdQF6jnO9hvpBK2G4YfP\\nsarvrfAlAgMBAAECgf8l/7JXWPvSx61Kug3t8iUkCHlJ9RsWkmjlcQdhSVWB50XC\\nwp7kFTYgYtADxPDaKgDa5NYdENtlXeH77CxVaET4pjqbZWwz9Ncq8GS7BHeNQtsS\\nJPJEw5Mt1AIOemIKJ5O3fsdge8SqwcJlIFH4FoySibOoP/wCdh2QIllFkH3u85aP\\nUGAkvAzbr/bYnOdENKQ1Ik7XSktkTuPslGW6BCEmIghMjz/xD7Mcwi04kqzV8E/H\\ncZAEeeu5YdjPS682VJ7ttkZ9Rf6vkrsLQelbMUSgW53waWhtbFWsKNahyadyFTnu\\n2v9uoqqYna1q5Pnv/AdyWJGXyQplidwthR/I1y8CgYEA+Rv10p3oScY+NR5dnLmw\\nSW1vckgTzgcUf3mPS2Hi725BXomYI661NRxLVUheSktenegUfF+ycsiM/RISEtgh\\npyTaUyAU9UV5KqQCD1H3ezrL+6ys95V1fgZoQwS5PZPt/AD0S/3Pl0YQJz326R1R\\nS8yDOaqae+9Sq66MkgUgD/cCgYEA0P7AvZXM5TjAqpRRqveHz5yxHxMAhiBSDbtR\\nl717zFBBFnBlBbp7hqHnP/0G4nJboG9/tvQ+qewx6Y6pf5ELO4ZfECFdcHJBEEJO\\nOoJph1BBZgFrNRxEuY7a9ASJXiR6s+SsCjVee7i4k9mzMWIeA8kjaiccxLAcNCuZ\\nOS6IscMCgYBS381xa107JfvOGjMUj+YpF4JLJ9WG5m4YVq2oa4FfHHQc6nO180qP\\nx8D8N14/I0HwEKS4F/I7I6NcEiX3JPZVL/p+Sx8N1jYQTI3u4NsPoSj5qqHEoHF9\\nIs6O9URXSx6ShxK/MUpdzk5Tb9b0CO/h4sEJb0uDzcPYH/LeJVxcUwKBgQC3sNGz\\nUHDwn7snsok9Xabu4WgESe1R9iJok1WZqx+eaoNqt4rzR/6+TJs2cKyWZ7EFCDsW\\nkQJq04DjKVLtHozi2q2/PbQk2yc4pS6g2nLqTa3NfD3ARoJZHahwhXQ/XIzEhJ55\\nsoLC946z1MpdA0IiTa1k5c+xSKDhcdiQm8flhQKBgQCMragWplMKZN21ng6kxSJN\\nEW/OzMdLLOwUuIg6Ici3jGMFwmlt3hWoFmBjO8qhKzZItunjZskNFV+wMUatq+p9\\nFzqXw9dfp3WWOTrMp41i56S/QqRMbkqid80RFBwQahuOJ20yNMLhPEHEQOnk33hF\\nIJ8E8gfNYPkM5Pmu86Pj7Q==\\n-----END PRIVATE KEY-----\\n'
FIREBASE_CLIENT_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40srilakshmiladieshostel-daca8.iam.gserviceaccount.com'

# Authentication Backends
AUTHENTICATION_BACKENDS = [
    'core.firebase_auth.FirebaseAuthentication',  # Custom Firebase backend
    'django.contrib.auth.backends.ModelBackend',  # Default Django backend
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'hostel_admin.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'hostel_admin.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}

# JWT Configuration for Hostel Management System
SIMPLE_JWT = {
    # Token Lifetimes
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),  # 30 minutes for API requests
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),    # 30 days for tenants (convenient)
    
    # Security Settings
    'ROTATE_REFRESH_TOKENS': True,          # Generate new refresh token on use
    'BLACKLIST_AFTER_ROTATION': True,      # Blacklist old refresh tokens
    'UPDATE_LAST_LOGIN': True,             # Update user's last login time
    
    # Token Types
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    
    # Additional Security
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    # Token Refresh
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

CORS_ALLOW_ALL_ORIGINS = True
