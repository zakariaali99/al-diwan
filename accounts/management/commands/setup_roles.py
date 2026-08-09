from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand

from messaging.models import Correspondent, Message, Thread
from pages.models import ContentBlock, QualityPrinciple
from posts.models import Category, Post
from services.models import ServiceCategory, ServiceItem
from siteconfig.models import SiteSettings

# Role -> models the group gets add/change/delete/view on.
ROLE_MODELS = {
    "Admins": [
        SiteSettings, ContentBlock, QualityPrinciple,
        ServiceCategory, ServiceItem,
        Category, Post,
        Correspondent, Thread, Message,
    ],
    "Editors": [Category, Post],
    "Support": [Correspondent, Thread, Message],
}


class Command(BaseCommand):
    help = "Create the Admins/Editors/Support staff groups with their dashboard permissions."

    def handle(self, *args, **options):
        for role, models in ROLE_MODELS.items():
            group, created = Group.objects.get_or_create(name=role)
            perms = Permission.objects.filter(
                content_type__app_label__in={m._meta.app_label for m in models},
                content_type__model__in={m._meta.model_name for m in models},
            )
            group.permissions.set(perms)
            verb = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{verb} group '{role}' with {perms.count()} permissions"))
