"""Staff dashboard API. Every endpoint is gated by a capability (see
accounts.models.CAPABILITIES); reads are gated too, so an editor cannot even
list the inbox."""

from datetime import timedelta

from django.contrib.auth.models import User
from django.db.models import Count, Prefetch, Q
from django.http import FileResponse
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.capabilities import capabilities_of, has_capability
from accounts.models import CAPABILITY_CODES, IMPLIES, ROLES
from messaging.models import Attachment, Correspondent, Thread
from pages.models import ContentBlock, QualityPrinciple
from posts.models import Category, Comment, Post
from services.models import ServiceCategory, ServiceItem
from siteconfig.models import SiteSettings

from .dashboard_serializers import (
    DashboardCategorySerializer,
    DashboardCommentSerializer,
    DashboardContactSerializer,
    DashboardContentBlockSerializer,
    DashboardPostListSerializer,
    DashboardPostSerializer,
    DashboardQualityPrincipleSerializer,
    DashboardServiceCategorySerializer,
    DashboardServiceItemSerializer,
    DashboardSiteSettingsSerializer,
    StaffSerializer,
)
from .permissions import IsStaffMember, capability


# --- Overview --------------------------------------------------------------

class OverviewView(APIView):
    permission_classes = [IsStaffMember]

    def get(self, request):
        user = request.user
        data = {}
        if has_capability(user, "view_posts"):
            data["posts"] = {
                "published": Post.visible().count(),
                "drafts": Post.objects.filter(status=Post.Status.DRAFT).count(),
                "scheduled": Post.objects.filter(
                    status=Post.Status.SCHEDULED, published_at__gt=timezone.now()
                ).count(),
            }
        if has_capability(user, "view_comments"):
            week_ago = timezone.now() - timedelta(days=7)
            data["comments"] = {
                "total": Comment.objects.count(),
                "this_week": Comment.objects.filter(created_at__gte=week_ago).count(),
                "hidden": Comment.objects.filter(is_visible=False).count(),
            }
        if has_capability(user, "view_messages"):
            data["messages"] = {
                "unread": Thread.objects.filter(is_unread=True).count(),
                "open": Thread.objects.filter(status=Thread.Status.OPEN).count(),
                "mine": Thread.objects.filter(assigned_to=user).exclude(status=Thread.Status.CLOSED).count(),
            }
        if has_capability(user, "manage_services"):
            data["services"] = {"categories": ServiceCategory.objects.count(), "items": ServiceItem.objects.count()}
        if has_capability(user, "manage_staff"):
            data["staff"] = {"active": User.objects.filter(is_staff=True, is_active=True).count()}
        return Response(data)


# --- Posts -----------------------------------------------------------------

class DashboardPostViewSet(viewsets.ModelViewSet):
    permission_classes = [capability("view_posts", "manage_posts", "delete_posts")]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = (
            Post.objects.select_related("category", "author")
            .prefetch_related("translations", "category__translations")
            .annotate(comment_count=Count("comments"))
        )
        params = self.request.query_params
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("category"):
            queryset = queryset.filter(category_id=params["category"])
        if params.get("q"):
            queryset = queryset.filter(translations__title__icontains=params["q"]).distinct()
        return queryset.order_by("-updated_at")

    def get_serializer_class(self):
        return DashboardPostListSerializer if self.action == "list" else DashboardPostSerializer

    def _guard_publishing(self, serializer, instance=None):
        """Writers without `publish_posts` can only work on drafts."""
        if has_capability(self.request.user, "publish_posts"):
            return {}
        data = serializer.validated_data
        if instance is None:
            data.pop("published_at", None)
            return {"status": Post.Status.DRAFT}
        if instance.status != Post.Status.DRAFT:
            raise PermissionDenied("لا تملك صلاحية تعديل منشور منشور أو مجدول.")
        data.pop("published_at", None)
        data.pop("status", None)
        return {}

    def perform_create(self, serializer):
        extra = self._guard_publishing(serializer)
        serializer.save(author=self.request.user, **extra)

    def perform_update(self, serializer):
        extra = self._guard_publishing(serializer, serializer.instance)
        serializer.save(**extra)


class DashboardCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = DashboardCategorySerializer
    permission_classes = [capability("view_posts", "manage_posts")]

    def get_queryset(self):
        return Category.objects.prefetch_related("translations").annotate(post_count=Count("posts")).order_by("id")


class DashboardCommentViewSet(
    mixins.ListModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    serializer_class = DashboardCommentSerializer
    permission_classes = [capability("view_comments", "moderate_comments")]
    http_method_names = ["get", "patch", "delete"]

    def get_queryset(self):
        queryset = Comment.objects.select_related("post").prefetch_related("post__translations")
        params = self.request.query_params
        if params.get("post"):
            queryset = queryset.filter(post_id=params["post"])
        if params.get("visible") in ("0", "1"):
            queryset = queryset.filter(is_visible=params["visible"] == "1")
        if params.get("q"):
            q = params["q"]
            queryset = queryset.filter(Q(name__icontains=q) | Q(email__icontains=q) | Q(body__icontains=q))
        return queryset


# --- Services --------------------------------------------------------------

class DashboardServiceCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = DashboardServiceCategorySerializer
    permission_classes = [capability("manage_services")]

    def get_queryset(self):
        items = ServiceItem.objects.prefetch_related("translations").order_by("order", "id")
        return ServiceCategory.objects.prefetch_related(
            "translations", Prefetch("items", queryset=items)
        ).order_by("order", "id")


class DashboardServiceItemViewSet(
    mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    serializer_class = DashboardServiceItemSerializer
    permission_classes = [capability("manage_services")]
    queryset = ServiceItem.objects.prefetch_related("translations")


# --- Site content ----------------------------------------------------------

class DashboardSiteSettingsView(APIView):
    permission_classes = [capability("manage_content")]

    def _serializer(self, request, **kwargs):
        instance = SiteSettings.load()
        return DashboardSiteSettingsSerializer(instance, context={"request": request}, **kwargs)

    def get(self, request):
        return Response(self._serializer(request).data)

    def patch(self, request):
        serializer = self._serializer(request, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DashboardContentBlockViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    serializer_class = DashboardContentBlockSerializer
    permission_classes = [capability("manage_content")]
    queryset = ContentBlock.objects.prefetch_related("translations")
    http_method_names = ["get", "patch"]


class DashboardQualityPrincipleViewSet(viewsets.ModelViewSet):
    serializer_class = DashboardQualityPrincipleSerializer
    permission_classes = [capability("manage_content")]
    queryset = QualityPrinciple.objects.prefetch_related("translations").order_by("order", "id")


# --- Contacts & attachments ------------------------------------------------

class DashboardContactViewSet(
    mixins.ListModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    serializer_class = DashboardContactSerializer
    permission_classes = [capability("view_messages", "reply_messages")]
    http_method_names = ["get", "patch", "delete"]

    def get_queryset(self):
        queryset = Correspondent.objects.annotate(thread_count=Count("threads"))
        q = self.request.query_params.get("q")
        if q:
            queryset = queryset.filter(Q(name__icontains=q) | Q(email__icontains=q) | Q(phone__icontains=q))
        return queryset


class AttachmentDownloadView(APIView):
    """Message attachments are private, so they are streamed through here
    rather than served from /media/."""

    permission_classes = [capability("view_messages")]

    def get(self, request, pk):
        attachment = Attachment.objects.filter(pk=pk).first()
        if attachment is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return FileResponse(
            attachment.file.open("rb"),
            as_attachment=True,
            filename=attachment.filename,
            content_type=attachment.content_type or None,
        )


# --- Staff -----------------------------------------------------------------

class StaffViewSet(viewsets.ModelViewSet):
    serializer_class = StaffSerializer
    permission_classes = [capability("manage_staff")]

    def get_queryset(self):
        return (
            User.objects.filter(is_staff=True)
            .select_related("staff_profile")
            .prefetch_related("user_permissions__content_type")
            .order_by("-is_superuser", "username")
        )

    def _check_target(self, user):
        actor = self.request.user
        if user.is_superuser and not actor.is_superuser:
            raise PermissionDenied("لا يمكن تعديل حساب المدير العام.")

    def perform_update(self, serializer):
        user = serializer.instance
        self._check_target(user)
        if user == self.request.user:
            data = serializer.validated_data
            if data.get("is_active") is False:
                raise PermissionDenied("لا يمكنك تعطيل حسابك.")
            capabilities = data.get("capabilities")
            if capabilities is not None and "manage_staff" not in capabilities and not user.is_superuser:
                raise PermissionDenied("لا يمكنك إزالة صلاحية إدارة الموظفين من حسابك.")
        serializer.save()

    def perform_destroy(self, instance):
        self._check_target(instance)
        if instance == self.request.user:
            raise PermissionDenied("لا يمكنك حذف حسابك.")
        instance.delete()

    @action(detail=False, methods=["get"])
    def roles(self, request):
        return Response({"roles": ROLES, "capabilities": CAPABILITY_CODES, "implies": IMPLIES})


def me_payload(user):
    return {
        "isAuthenticated": True,
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "is_superuser": user.is_superuser,
        "capabilities": capabilities_of(user) if user.is_staff else [],
    }
