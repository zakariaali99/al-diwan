from decouple import Csv, config

from .base import *  # noqa: F401,F403

DEBUG = False

# Hashed + compressed filenames so static assets can be cached indefinitely.
# Requires `collectstatic` on every deploy (wired into .cpanel.yml).
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# cPanel/Passenger sits behind Apache doing TLS termination.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = config("DJANGO_SECURE_SSL_REDIRECT", default=True, cast=bool)
CSRF_TRUSTED_ORIGINS = config("DJANGO_CSRF_TRUSTED_ORIGINS", default="", cast=Csv())

# HSTS is deliberately OFF by default. Once a browser has seen the header it
# refuses plain HTTP for the whole max-age, so enabling it before HTTPS is
# confirmed working on every subdomain can take the site down in a way you
# cannot quickly undo. Turn it on after go-live: start at 3600, then raise.
SECURE_HSTS_SECONDS = config("DJANGO_HSTS_SECONDS", default=0, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = config("DJANGO_HSTS_SUBDOMAINS", default=False, cast=bool)
SECURE_HSTS_PRELOAD = config("DJANGO_HSTS_PRELOAD", default=False, cast=bool)
