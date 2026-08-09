"""Serializers for the public and dashboard APIs.

Translated models use django-parler, which resolves fields against the active
language. /api/ sits outside i18n_patterns, so LocaleMiddleware falls back to
the Accept-Language header — the frontend sends it on every request.
"""

from django.contrib.auth.models import User
from rest_framework import serializers

from messaging.models import Attachment, Correspondent, Message, Thread
from pages.models import ContentBlock, QualityPrinciple
from posts.models import Category, Post
from services.models import ServiceCategory, ServiceItem
from siteconfig.models import SiteSettings


# --- Site chrome -----------------------------------------------------------

class SiteSettingsSerializer(serializers.ModelSerializer):
    tagline = serializers.CharField(read_only=True)

    class Meta:
        model = SiteSettings
        fields = [
            "tagline", "phone", "whatsapp_url", "email", "address",
            "map_url", "facebook_url", "instagram_url", "x_url",
        ]


class ContentBlockSerializer(serializers.ModelSerializer):
    title = serializers.CharField(read_only=True)
    body = serializers.CharField(read_only=True)

    class Meta:
        model = ContentBlock
        fields = ["slug", "title", "body"]


class QualityPrincipleSerializer(serializers.ModelSerializer):
    text = serializers.CharField(read_only=True)

    class Meta:
        model = QualityPrinciple
        fields = ["id", "text", "order"]


# --- Services --------------------------------------------------------------

class ServiceItemSerializer(serializers.ModelSerializer):
    text = serializers.CharField(read_only=True)

    class Meta:
        model = ServiceItem
        fields = ["id", "text", "order"]


class ServiceCategorySerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    items = ServiceItemSerializer(many=True, read_only=True)

    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "icon", "order", "items"]


# --- Posts -----------------------------------------------------------------

class CategorySerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    slug = serializers.CharField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class PostListSerializer(serializers.ModelSerializer):
    """Trimmed shape for index/listing views — no body."""

    title = serializers.CharField(read_only=True)
    slug = serializers.CharField(read_only=True)
    excerpt = serializers.CharField(read_only=True)
    category = CategorySerializer(read_only=True)
    author_name = serializers.CharField(source="author.get_username", read_only=True, default="")
    featured_image = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "title", "slug", "excerpt", "category",
            "author_name", "featured_image", "published_at",
        ]

    def get_featured_image(self, obj):
        if not obj.featured_image:
            return None
        request = self.context.get("request")
        url = obj.featured_image.url
        return request.build_absolute_uri(url) if request else url


class PostDetailSerializer(PostListSerializer):
    body = serializers.CharField(read_only=True)
    seo_title = serializers.CharField(read_only=True)
    seo_description = serializers.CharField(read_only=True)

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + [
            "body", "seo_title", "seo_description", "updated_at",
        ]


class DashboardPostSerializer(serializers.ModelSerializer):
    """Writable, per-language. The `language` field selects which translation
    is read and written — mirroring the ?lang= tab in the old dashboard, where
    parler silently overwrote the wrong translation if the language wasn't set
    explicitly on the instance."""

    title = serializers.CharField()
    slug = serializers.CharField(required=False, allow_blank=True)
    excerpt = serializers.CharField(required=False, allow_blank=True)
    body = serializers.CharField(required=False, allow_blank=True)
    seo_title = serializers.CharField(required=False, allow_blank=True)
    seo_description = serializers.CharField(required=False, allow_blank=True)
    language = serializers.CharField(write_only=True, required=False)
    author_name = serializers.CharField(source="author.get_username", read_only=True, default="")
    available_languages = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "title", "slug", "excerpt", "body",
            "seo_title", "seo_description",
            "category", "featured_image", "status", "published_at",
            "author_name", "available_languages", "language",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_available_languages(self, obj):
        return list(obj.get_available_languages())

    def _apply_language(self, instance, language):
        if language:
            instance.set_current_language(language)

    def create(self, validated_data):
        language = validated_data.pop("language", None)
        translated = {
            f: validated_data.pop(f)
            for f in ("title", "slug", "excerpt", "body", "seo_title", "seo_description")
            if f in validated_data
        }
        post = Post(**validated_data)
        self._apply_language(post, language)
        for field, value in translated.items():
            setattr(post, field, value)
        post.save()
        return post

    def update(self, instance, validated_data):
        language = validated_data.pop("language", None)
        self._apply_language(instance, language)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


# --- Messaging -------------------------------------------------------------

class CorrespondentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Correspondent
        fields = ["id", "name", "email", "phone"]


class AttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ["id", "filename", "content_type", "url"]

    def get_url(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url


class MessageSerializer(serializers.ModelSerializer):
    sent_by_name = serializers.CharField(source="sent_by.get_username", read_only=True, default="")
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = [
            "id", "direction", "from_email", "to_email", "body",
            "sent_by_name", "is_read", "created_at", "attachments",
        ]


class ThreadListSerializer(serializers.ModelSerializer):
    correspondent = CorrespondentSerializer(read_only=True)
    assigned_to_name = serializers.CharField(
        source="assigned_to.get_username", read_only=True, default=""
    )
    message_count = serializers.IntegerField(source="messages.count", read_only=True)

    class Meta:
        model = Thread
        fields = [
            "id", "subject", "correspondent", "assigned_to_name",
            "status", "is_unread", "message_count", "created_at", "updated_at",
        ]


class ThreadDetailSerializer(ThreadListSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta(ThreadListSerializer.Meta):
        fields = ThreadListSerializer.Meta.fields + ["messages"]


class ReplySerializer(serializers.Serializer):
    body = serializers.CharField()


class ComposeSerializer(serializers.Serializer):
    to_name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    to_email = serializers.EmailField()
    subject = serializers.CharField(max_length=255)
    body = serializers.CharField()


# --- Auth ------------------------------------------------------------------

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"})


class CurrentUserSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email",
                  "is_superuser", "is_staff", "permissions"]

    def get_permissions(self, obj):
        """Flags the React nav reads, replacing the old {% if perms.x %} checks."""
        return {
            "canViewPosts": obj.has_perm("posts.view_post"),
            "canAddPosts": obj.has_perm("posts.add_post"),
            "canChangePosts": obj.has_perm("posts.change_post"),
            "canDeletePosts": obj.has_perm("posts.delete_post"),
            "canViewThreads": obj.has_perm("messaging.view_thread"),
            "canChangeThreads": obj.has_perm("messaging.change_thread"),
            "canAddThreads": obj.has_perm("messaging.add_thread"),
        }


# --- Contact (public) ------------------------------------------------------

class ContactMessageSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True)
    message = serializers.CharField()
    # Bots fill every field they find; the real form hides this one.
    website = serializers.CharField(required=False, allow_blank=True)

    def validate_website(self, value):
        if value:
            raise serializers.ValidationError("spam detected")
        return ""
