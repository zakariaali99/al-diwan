from functools import wraps

from django.contrib.auth.views import redirect_to_login
from django.core.exceptions import PermissionDenied


def dashboard_permission_required(perm):
    """Send anonymous visitors to the login page, but show 403 to a signed-in
    staff member who simply lacks the permission.

    Django's own permission_required() forces one behaviour for both:
    raise_exception=True 403s anonymous users (confusing — they just need to
    log in), while raise_exception=False bounces an already-authenticated
    user back to a login form they've already completed.
    """

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect_to_login(request.get_full_path())
            if not request.user.has_perm(perm):
                raise PermissionDenied
            return view_func(request, *args, **kwargs)

        return _wrapped

    return decorator
