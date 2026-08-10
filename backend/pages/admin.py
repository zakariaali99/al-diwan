from django.contrib import admin
from parler.admin import TranslatableAdmin
from unfold.admin import ModelAdmin

from .models import ContentBlock, QualityPrinciple


@admin.register(ContentBlock)
class ContentBlockAdmin(TranslatableAdmin, ModelAdmin):
    list_display = ("slug", "title")
    search_fields = ("slug", "translations__title")


@admin.register(QualityPrinciple)
class QualityPrincipleAdmin(TranslatableAdmin, ModelAdmin):
    list_display = ("text", "order")
    ordering = ("order",)
