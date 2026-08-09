from django.contrib import admin
from django.db import models
from parler.admin import TranslatableAdmin
from unfold.admin import ModelAdmin

from .models import Category, Post
from .widgets import RichTextWidget


@admin.register(Category)
class CategoryAdmin(TranslatableAdmin, ModelAdmin):
    list_display = ("name",)


@admin.register(Post)
class PostAdmin(TranslatableAdmin, ModelAdmin):
    formfield_overrides = {models.TextField: {"widget": RichTextWidget}}
    list_display = ("title", "category", "author", "status", "published_at")
    list_filter = ("status", "category")
    search_fields = ("translations__title",)
    autocomplete_fields = ("author",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("title", "slug", "category", "author", "featured_image")}),
        ("المحتوى", {"fields": ("excerpt", "body")}),
        ("SEO", {"fields": ("seo_title", "seo_description")}),
        ("النشر", {"fields": ("status", "published_at", "created_at", "updated_at")}),
    )
