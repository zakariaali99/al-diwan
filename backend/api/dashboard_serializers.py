"""Serializers for the staff dashboard.

Translated models are edited one language at a time. The language comes from
`?language=` (reads) or the `language` field (writes) and is set explicitly on
the instance — parler otherwise reads and writes whichever language happens to
be active, which is how an English edit used to overwrite the Arabic text.
"""

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from accounts.capabilities import capabilities_of, role_of, set_capabilities
from accounts.models import CAPABILITY_CODES, CUSTOM_ROLE, ROLES
from messaging.models import Correspondent
from pages.models import ContentBlock, QualityPrinciple
from posts.models import Category, Comment, Post
from services.models import ServiceCategory, ServiceItem
from siteconfig.models import SiteSettings

LANGUAGE_CODES = [code for code, _ in settings.LANGUAGES]
DEFAULT_LANGUAGE = settings.PARLER_DEFAULT_LANGUAGE_CODE


def resolve_language(value) -> str:
    return value if value in LANGUAGE_CODES else DEFAULT_LANGUAGE


def translation_of(obj, language):
    """The stored translation row for exactly `language`, without fallback."""
    return next((tr for tr in obj.translations.all() if tr.language_code == language), None)


class TranslatedSerializer(serializers.ModelSerializer):
    """Reads and writes `translated_fields` in one explicit language.

    Subclasses declare the translated fields as write-only serializer fields;
    their values are added on the way out from the stored translation, so a
    missing translation shows up as empty instead of silently falling back.
    """

    translated_fields: tuple[str, ...] = ()
    language = serializers.CharField(write_only=True, required=False)

    def _language(self, data=None) -> str:
        if data and data.get("language"):
            return resolve_language(data["language"])
        request = self.context.get("request")
        return resolve_language(request.query_params.get("language") if request else None)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self.context.get("language") or self._language()
        translation = translation_of(instance, language)
        for field in self.translated_fields:
            data[field] = getattr(translation, field, "") if translation else ""
        data["translated_languages"] = sorted(tr.language_code for tr in instance.translations.all())
        return data

    def _split(self, validated_data):
        language = resolve_language(validated_data.pop("language", None) or self._language())
        translated = {f: validated_data.pop(f) for f in self.translated_fields if f in validated_data}
        self.context["language"] = language
        return language, translated

    def _write(self, instance, language, translated, plain):
        instance.set_current_language(language)
        for field, value in {**plain, **translated}.items():
            setattr(instance, field, value)
        instance.save()
        # Drop the prefetched rows so the response reflects what was saved.
        if hasattr(instance, "_prefetched_objects_cache"):
            instance._prefetched_objects_cache.pop("translations", None)
        return instance

    def create(self, validated_data):
        language, translated = self._split(validated_data)
        return self._write(self.Meta.model(), language, translated, validated_data)

    def update(self, instance, validated_data):
        language, translated = self._split(validated_data)
        return self._write(instance, language, translated, validated_data)


def label_of(obj, field):
    return obj.safe_translation_getter(field, any_language=True) or ""


# --- Posts -----------------------------------------------------------------

class DashboardPostListSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    author_name = serializers.CharField(source="author.get_username", read_only=True, default="")
    comment_count = serializers.IntegerField(read_only=True)
    translated_languages = serializers.SerializerMethodField()
    featured_image = serializers.ImageField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id", "title", "status", "category", "category_name", "author_name",
            "featured_image", "comment_count", "published_at", "created_at", "updated_at",
            "translated_languages",
        ]

    def get_title(self, obj):
        return label_of(obj, "title")

    def get_category_name(self, obj):
        return label_of(obj.category, "name") if obj.category else ""

    def get_translated_languages(self, obj):
        return sorted(tr.language_code for tr in obj.translations.all())


class DashboardPostSerializer(TranslatedSerializer):
    translated_fields = ("title", "excerpt", "body", "seo_title", "seo_description")

    title = serializers.CharField(write_only=True, max_length=255)
    excerpt = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=500)
    body = serializers.CharField(write_only=True, required=False, allow_blank=True)
    seo_title = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=255)
    seo_description = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=300)
    featured_image = serializers.ImageField(required=False, allow_null=True)
    remove_image = serializers.BooleanField(write_only=True, required=False)
    author_name = serializers.CharField(source="author.get_username", read_only=True, default="")
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "title", "excerpt", "body", "seo_title", "seo_description",
            "category", "featured_image", "remove_image", "status", "published_at",
            "author_name", "comment_count", "language", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_comment_count(self, obj):
        return obj.comments.count()

    def validate(self, attrs):
        if attrs.get("status") == Post.Status.SCHEDULED and not attrs.get("published_at") and not (
            self.instance and self.instance.published_at
        ):
            raise serializers.ValidationError({"published_at": "حدّد موعد النشر للمنشور المجدول."})
        return attrs

    def _write(self, instance, language, translated, plain):
        if plain.pop("remove_image", False) and "featured_image" not in plain:
            if instance.featured_image:
                instance.featured_image.delete(save=False)
            plain["featured_image"] = None
        return super()._write(instance, language, translated, plain)


class DashboardCategorySerializer(TranslatedSerializer):
    translated_fields = ("name",)
    name = serializers.CharField(write_only=True, max_length=100)
    post_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ["id", "name", "post_count", "language"]


class DashboardCommentSerializer(serializers.ModelSerializer):
    post_title = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "post", "post_title", "name", "email", "body", "is_visible", "created_at"]
        read_only_fields = ["post", "name", "email", "body", "created_at"]

    def get_post_title(self, obj):
        return label_of(obj.post, "title")


# --- Services --------------------------------------------------------------

class DashboardServiceItemSerializer(TranslatedSerializer):
    translated_fields = ("text",)
    text = serializers.CharField(write_only=True, max_length=500)

    class Meta:
        model = ServiceItem
        fields = ["id", "category", "text", "order", "language"]


class DashboardServiceCategorySerializer(TranslatedSerializer):
    translated_fields = ("name",)
    name = serializers.CharField(write_only=True, max_length=255)
    items = serializers.SerializerMethodField()

    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "icon", "order", "items", "language"]

    def get_items(self, obj):
        context = {**self.context, "language": self.context.get("language") or self._language()}
        return DashboardServiceItemSerializer(obj.items.all(), many=True, context=context).data


# --- Site content ----------------------------------------------------------

class DashboardSiteSettingsSerializer(TranslatedSerializer):
    translated_fields = ("tagline",)
    tagline = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=255)

    class Meta:
        model = SiteSettings
        fields = [
            "tagline", "phone", "whatsapp_url", "email", "address", "map_url",
            "facebook_url", "instagram_url", "x_url", "language",
        ]


class DashboardContentBlockSerializer(TranslatedSerializer):
    translated_fields = ("title", "body")
    title = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=255)
    body = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = ContentBlock
        # `slug` is the fixed key the frontend renders the block by; staff
        # edit the text, never the key.
        fields = ["id", "slug", "title", "body", "language"]
        read_only_fields = ["slug"]


class DashboardQualityPrincipleSerializer(TranslatedSerializer):
    translated_fields = ("text",)
    text = serializers.CharField(write_only=True, max_length=500)

    class Meta:
        model = QualityPrinciple
        fields = ["id", "text", "order", "language"]


# --- Contacts --------------------------------------------------------------

class DashboardContactSerializer(serializers.ModelSerializer):
    thread_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Correspondent
        fields = ["id", "name", "email", "phone", "thread_count", "created_at"]
        read_only_fields = ["created_at"]


# --- Staff -----------------------------------------------------------------

class StaffSerializer(serializers.ModelSerializer):
    role = serializers.CharField(required=False, allow_blank=True)
    capabilities = serializers.ListField(
        child=serializers.ChoiceField(choices=CAPABILITY_CODES), required=False
    )
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "last_name", "email", "is_active", "is_superuser",
            "role", "capabilities", "password", "last_login", "date_joined",
        ]
        read_only_fields = ["is_superuser", "last_login", "date_joined"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["role"] = role_of(instance)
        data["capabilities"] = capabilities_of(instance)
        return data

    def validate_role(self, value):
        if value and value not in ROLES and value != CUSTOM_ROLE:
            raise serializers.ValidationError("دور غير معروف.")
        return value

    def validate(self, attrs):
        password = attrs.get("password")
        if not self.instance and not password:
            raise serializers.ValidationError({"password": "كلمة المرور مطلوبة للحساب الجديد."})
        if password:
            candidate = self.instance or User(
                username=attrs.get("username", ""),
                email=attrs.get("email", ""),
                first_name=attrs.get("first_name", ""),
                last_name=attrs.get("last_name", ""),
            )
            try:
                validate_password(password, candidate)
            except Exception as error:  # ValidationError from django.core
                raise serializers.ValidationError({"password": list(getattr(error, "messages", [str(error)]))})
        if "role" in attrs and "capabilities" not in attrs and attrs["role"] in ROLES:
            attrs["capabilities"] = ROLES[attrs["role"]]
        return attrs

    def _save_access(self, user, validated_data, role, capabilities):
        if capabilities is not None:
            set_capabilities(user, capabilities, role or "")

    def create(self, validated_data):
        role = validated_data.pop("role", "")
        capabilities = validated_data.pop("capabilities", [])
        password = validated_data.pop("password")
        user = User(**validated_data, is_staff=True)
        user.set_password(password)
        user.save()
        self._save_access(user, validated_data, role, capabilities)
        return user

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        capabilities = validated_data.pop("capabilities", None)
        password = validated_data.pop("password", "")
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.is_staff = True
        instance.save()
        if capabilities is None and role in ROLES:
            capabilities = ROLES[role]
        self._save_access(instance, validated_data, role, capabilities)
        return instance
