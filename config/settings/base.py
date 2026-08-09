"""
Base settings shared by every environment. Environment-specific values are
read from the process environment (via python-decouple), so the same code
runs unmodified in local dev, Docker, and cPanel production.
"""

from pathlib import Path

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY", default="dev-insecure-secret-key-change-me")
DEBUG = config("DJANGO_DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("DJANGO_ALLOWED_HOSTS", default="", cast=Csv())

INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sitemaps",
    # third-party
    "rest_framework",
    "parler",
    "ckeditor",
    # local apps
    "accounts",
    "siteconfig",
    "pages",
    "services",
    "posts",
    "messaging",
    "api",
    "dashboard",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.i18n",
                "siteconfig.context_processors.site_settings",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# --- Database ---------------------------------------------------------
# Defaults to SQLite for a zero-config local start. Set DATABASE_ENGINE=mysql
# (Docker dev and cPanel production both do this) to use MySQL via PyMySQL,
# chosen over mysqlclient because it needs no C-extension compilation --
# critical on shared cPanel hosting where we don't control system packages.
if config("DATABASE_ENGINE", default="sqlite") == "mysql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": config("DATABASE_NAME"),
            "USER": config("DATABASE_USER"),
            "PASSWORD": config("DATABASE_PASSWORD"),
            "HOST": config("DATABASE_HOST", default="localhost"),
            "PORT": config("DATABASE_PORT", default="3306"),
            "OPTIONS": {"charset": "utf8mb4"},
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- Internationalization ---------------------------------------------
# Arabic-first (site's primary audience), English second. Designed to grow:
# adding a language is a PARLER_LANGUAGES entry, not a schema migration.
LANGUAGE_CODE = "ar"
LANGUAGES = [
    ("ar", "العربية"),
    ("en", "English"),
]
TIME_ZONE = "Africa/Tripoli"
USE_I18N = True
USE_TZ = True
LOCALE_PATHS = [BASE_DIR / "locale"]

PARLER_DEFAULT_LANGUAGE_CODE = "ar"
PARLER_LANGUAGES = {
    None: (
        {"code": "ar"},
        {"code": "en"},
    ),
    "default": {
        "fallbacks": ["ar"],
        "hide_untranslated": False,
    },
}

# --- Static & media -----------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
# Plain storage by default: the hashed-manifest backend requires collectstatic
# to have run and every referenced file to be present, which breaks dev and
# tests. production.py swaps in the compressed, hashed variant.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Auth / dashboard ---------------------------------------------------
LOGIN_URL = "dashboard:login"
LOGIN_REDIRECT_URL = "dashboard:home"
LOGOUT_REDIRECT_URL = "dashboard:login"

# --- Outbound email (unified inbox: SMTP relay via transactional provider) --
EMAIL_BACKEND = config(
    "EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = config("EMAIL_HOST", default="")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="info@al-diwan.ly")

# --- Inbound email (unified inbox: IMAP polling, see messaging/management) --
IMAP_HOST = config("IMAP_HOST", default="")
IMAP_PORT = config("IMAP_PORT", default=993, cast=int)
IMAP_USER = config("IMAP_USER", default="")
IMAP_PASSWORD = config("IMAP_PASSWORD", default="")
IMAP_MAILBOX = config("IMAP_MAILBOX", default="INBOX")

# Staff addresses pinged when a new contact-form thread arrives.
INBOX_NOTIFY_EMAILS = config("INBOX_NOTIFY_EMAILS", default="", cast=Csv())

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
}

CKEDITOR_CONFIGS = {
    "default": {
        "toolbar": [
            ["Format", "Bold", "Italic", "Underline"],
            ["NumberedList", "BulletedList", "Blockquote"],
            ["Link", "Unlink"],
            ["Undo", "Redo", "Source"],
        ],
        "height": 300,
        "width": "100%",
    },
}

UNFOLD = {
    "SITE_TITLE": "شركة الديوان — الإدارة",
    "SITE_HEADER": "شركة الديوان",
}
