from rest_framework.permissions import SAFE_METHODS, BasePermission

from accounts.capabilities import has_capability


class IsStaffMember(BasePermission):
    """Only active staff accounts reach the dashboard API at all."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and user.is_staff)


def capability(read: str, write: str | None = None, delete: str | None = None):
    """Permission class requiring `read` for safe methods, `write` for writes
    and `delete` (defaulting to `write`) for DELETE."""

    write = write or read
    delete = delete or write

    class HasCapability(IsStaffMember):
        def has_permission(self, request, view):
            if not super().has_permission(request, view):
                return False
            if request.method in SAFE_METHODS:
                needed = read
            elif request.method == "DELETE":
                needed = delete
            else:
                needed = write
            return has_capability(request.user, needed)

    HasCapability.__name__ = f"HasCapability_{read}_{write}_{delete}"
    return HasCapability
