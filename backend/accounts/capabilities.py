"""Reading and writing a staff member's capabilities."""

from django.contrib.auth.models import Permission

from .models import CAPABILITY_CODES, CUSTOM_ROLE, StaffProfile, normalize_capabilities, role_for

APP_LABEL = "accounts"

# Groups created by the old `setup_roles` command, mapped onto today's roles.
LEGACY_GROUP_ROLES = {"Admins": "admin", "Editors": "editor", "Support": "support"}


def has_capability(user, code: str) -> bool:
    return bool(user and user.is_authenticated and user.is_active and user.has_perm(f"{APP_LABEL}.{code}"))


def capabilities_of(user) -> list[str]:
    if user.is_superuser:
        return list(CAPABILITY_CODES)
    granted = set(
        user.user_permissions.filter(content_type__app_label=APP_LABEL).values_list("codename", flat=True)
    )
    return [code for code in CAPABILITY_CODES if code in granted]


def role_of(user) -> str:
    if user.is_superuser:
        return "admin"
    return role_for(capabilities_of(user))


def set_capabilities(user, codes, role: str = "") -> list[str]:
    """Replaces the user's capabilities; returns the normalized set."""
    codes = normalize_capabilities(codes)
    keep = user.user_permissions.exclude(content_type__app_label=APP_LABEL)
    granted = Permission.objects.filter(content_type__app_label=APP_LABEL, codename__in=codes)
    user.user_permissions.set([*keep, *granted])
    # The stored role is only a label; trust it only while it still matches.
    resolved = role_for(codes)
    StaffProfile.objects.update_or_create(
        user=user, defaults={"role": role if role == resolved else (resolved or CUSTOM_ROLE)}
    )
    # Django caches permissions on the instance for the request.
    for cache in ("_perm_cache", "_user_perm_cache", "_group_perm_cache"):
        user.__dict__.pop(cache, None)
    return codes
