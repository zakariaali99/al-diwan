"""Serializers for the public and dashboard APIs.

Translated models use django-parler, which resolves fields against the active
language. /api/ sits outside i18n_patterns, so LocaleMiddleware falls back to
the Accept-Language header — the frontend sends it on every request.
"""

from django.urls import reverse
from rest_framework import serializers

from messaging.models import Attachment, Correspondent, Message, Thread
from pages.models import ContentBlock, QualityPrinciple
from posts.models import Category, Comment, Post
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

    class Meta:
        model = Category
        fields = ["id", "name"]


class PostListSerializer(serializers.ModelSerializer):
    """Trimmed shape for index/listing views — no body."""

    title = serializers.CharField(read_only=True)
    excerpt = serializers.CharField(read_only=True)
    category = CategorySerializer(read_only=True)
    author_name = serializers.CharField(source="author.get_username", read_only=True, default="")
    featured_image = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "title", "excerpt", "category",
            "author_name", "featured_image", "published_at", "comment_count",
        ]

    def get_featured_image(self, obj):
        if not obj.featured_image:
            return None
        request = self.context.get("request")
        url = obj.featured_image.url
        return request.build_absolute_uri(url) if request else url

    def get_comment_count(self, obj):
        annotated = getattr(obj, "visible_comments", None)
        return annotated if annotated is not None else obj.comments.filter(is_visible=True).count()


class PublicCommentSerializer(serializers.ModelSerializer):
    """What visitors see — never the commenter's email."""

    class Meta:
        model = Comment
        fields = ["id", "name", "body", "created_at"]


class CommentCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    body = serializers.CharField(max_length=3000)
    # Bots fill every field they find; the real form hides this one.
    website = serializers.CharField(required=False, allow_blank=True)

    def validate_website(self, value):
        if value:
            raise serializers.ValidationError("spam detected")
        return ""


class PostDetailSerializer(PostListSerializer):
    body = serializers.CharField(read_only=True)
    seo_title = serializers.CharField(read_only=True)
    seo_description = serializers.CharField(read_only=True)

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + [
            "body", "seo_title", "seo_description", "updated_at",
        ]


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
        # Attachments are private: served through an authenticated endpoint.
        return reverse("api:dashboard-attachment", args=[obj.pk])


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
            "id", "subject", "correspondent", "assigned_to", "assigned_to_name",
            "status", "is_unread", "message_count", "created_at", "updated_at",
        ]


class ThreadUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Thread
        fields = ["status", "assigned_to"]


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
