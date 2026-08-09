from rest_framework.permissions import DjangoModelPermissions


class DjangoModelPermissionsStrict(DjangoModelPermissions):
    """DjangoModelPermissions leaves GET wide open — its default perms_map has
    an empty list for read methods, so any authenticated user can read any
    endpoint. The dashboard's whole point is that Editors can't see the inbox
    and Support can't see posts, so read has to require `view_*` too.
    """

    perms_map = {
        "GET": ["%(app_label)s.view_%(model_name)s"],
        "OPTIONS": [],
        "HEAD": ["%(app_label)s.view_%(model_name)s"],
        "POST": ["%(app_label)s.add_%(model_name)s"],
        "PUT": ["%(app_label)s.change_%(model_name)s"],
        "PATCH": ["%(app_label)s.change_%(model_name)s"],
        "DELETE": ["%(app_label)s.delete_%(model_name)s"],
    }
