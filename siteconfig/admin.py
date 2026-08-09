from django.contrib import admin
from parler.admin import TranslatableAdmin
from unfold.admin import ModelAdmin

from .models import SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(TranslatableAdmin, ModelAdmin):
    fields = (
        "tagline",
        "phone",
        "whatsapp_url",
        "email",
        "address",
        "map_url",
        "facebook_url",
        "instagram_url",
        "x_url",
    )

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
