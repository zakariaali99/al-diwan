from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand

from accounts.capabilities import LEGACY_GROUP_ROLES, capabilities_of, set_capabilities
from accounts.models import ROLES


class Command(BaseCommand):
    help = (
        "Dashboard roles are built in (see accounts.models.ROLES). This moves members "
        "of the old Admins/Editors/Support groups onto them and makes them staff."
    )

    def handle(self, *args, **options):
        moved = 0
        for group_name, role in LEGACY_GROUP_ROLES.items():
            group = Group.objects.filter(name=group_name).first()
            if not group:
                continue
            for user in User.objects.filter(groups=group):
                codes = sorted(set(capabilities_of(user)) | set(ROLES[role]))
                set_capabilities(user, codes, role)
                if not user.is_staff:
                    user.is_staff = True
                    user.save(update_fields=["is_staff"])
                moved += 1
        self.stdout.write(self.style.SUCCESS(f"Roles ready: {', '.join(ROLES)}. Moved {moved} legacy account(s)."))
