from django.contrib import admin
from parler.admin import TranslatableAdmin, TranslatableStackedInline
from unfold.admin import ModelAdmin, StackedInline

from .models import ServiceCategory, ServiceItem


class ServiceItemInline(TranslatableStackedInline, StackedInline):
    model = ServiceItem
    extra = 1
    fields = ("text", "order")


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(TranslatableAdmin, ModelAdmin):
    list_display = ("name", "order", "item_count")
    ordering = ("order",)
    inlines = [ServiceItemInline]

    def item_count(self, obj):
        return obj.items.count()

    item_count.short_description = "عدد العناصر"
