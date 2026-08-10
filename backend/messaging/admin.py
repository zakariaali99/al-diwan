from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import Attachment, Correspondent, Message, Thread


class MessageInline(TabularInline):
    model = Message
    extra = 0
    fields = ("direction", "from_email", "to_email", "is_read", "created_at")
    readonly_fields = ("created_at",)
    show_change_link = True


@admin.register(Correspondent)
class CorrespondentAdmin(ModelAdmin):
    list_display = ("name", "email", "phone")
    search_fields = ("name", "email")


@admin.register(Thread)
class ThreadAdmin(ModelAdmin):
    list_display = ("subject", "correspondent", "assigned_to", "status", "is_unread", "updated_at")
    list_filter = ("status", "is_unread", "assigned_to")
    search_fields = ("subject", "correspondent__name", "correspondent__email")
    autocomplete_fields = ("assigned_to",)
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(ModelAdmin):
    list_display = ("thread", "direction", "from_email", "to_email", "is_read", "created_at")
    list_filter = ("direction", "is_read")
    search_fields = ("from_email", "to_email", "body")


@admin.register(Attachment)
class AttachmentAdmin(ModelAdmin):
    list_display = ("filename", "message", "content_type")
