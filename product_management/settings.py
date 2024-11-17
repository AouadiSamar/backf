
from pathlib import Path

#  Author Aouadi samar
BASE_DIR = Path(__file__).resolve().parent.parent


#  Author Aouadi samar

import os

STATIC_URL = '/static/'

#  Author Aouadi samar
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

SECRET_KEY = 'django-insecure-s!8^dgc8dj*=9sha#h#=smoo=(8*z&l=dlirv2$@fnz_n!xlnm'

DEBUG = True

ALLOWED_HOSTS = []


INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'graphene_django',
    'products',

    'graphene_file_upload',

    'channels',
]

# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'



EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587  
EMAIL_USE_TLS = True  
EMAIL_HOST_USER = 'samaraouadi7@gmail.com'
EMAIL_HOST_PASSWORD = 'zrmo hkqx sroi tffk'  

# settings.py
CORS_ALLOW_ALL_ORIGINS = True  
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
CORS_ALLOW_HEADERS = [
    "content-type",
    "authorization",
]
# settings.py
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
CORS_ALLOW_CREDENTIALS = True
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [],
    'DEFAULT_AUTHENTICATION_CLASSES': [],
}
# settings.py
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
]
# settings.py
APPEND_SLASH = False

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

ROOT_URLCONF = 'product_management.urls'

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
GRAPHQL_JWT = {
    'JWT_VERIFY_EXPIRATION': False,  
}
WSGI_APPLICATION = 'product_management.wsgi.application'
ASGI_APPLICATION = 'product_management.asgi.application'
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)], 
        },
    },
}
PUSHER_APP_ID = "1" 
PUSHER_KEY = "public-key-1234"  
PUSHER_SECRET = "private-key-5678"  
PUSHER_CLUSTER = "mt1"  
PUSHER_SSL = False  



DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}



AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]



LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True




STATIC_URL = 'static/'



DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# settings.py

import os

MEDIA_URL = '/media/'

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
