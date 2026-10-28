"""Public + dashboard API.

Auth is session + CSRF (DRF SessionAuthentication). The frontend is served
same-origin, so cookies work without CORS and there's no token handling.
"""

from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth import authenticate
from django.db.models import Count, Q
from django.middleware.csrf import get_token
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle
from rest_framework.views import APIView

from messaging.models import Thread
from messaging.services import (
    create_inbound_from_contact_form,
    send_reply,
    start_thread,
)
from pages.models import ContentBlock, QualityPrinciple
from posts.models import Category, Comment, Post
from services.models import ServiceCategory
from siteconfig.models import SiteSettings

from .dashboard_views import me_payload
from .permissions import capability
from .serializers import (
    CategorySerializer,
    CommentCreateSerializer,
    ComposeSerializer,
    ContactMessageSerializer,
    ContentBlockSerializer,
    LoginSerializer,
    PostDetailSerializer,
    PostListSerializer,
    PublicCommentSerializer,
    QualityPrincipleSerializer,
    ReplySerializer,
    ServiceCategorySerializer,
    SiteSettingsSerializer,
    ThreadDetailSerializer,
    ThreadListSerializer,
    ThreadUpdateSerializer,
)


# --- Public read endpoints -------------------------------------------------

class SiteSettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(SiteSettingsSerializer(SiteSettings.load()).data)


class ContentBlockListView(APIView):
    """Returns blocks keyed by slug — the shape the frontend actually wants,
    since every consumer looks blocks up by their fixed slug."""

    permission_classes = [AllowAny]

    def get(self, request):
        blocks = ContentBlockSerializer(ContentBlock.objects.all(), many=True).data
        return Response({block["slug"]: block for block in blocks})


class QualityPrincipleListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        principles = QualityPrinciple.objects.all()
        return Response(QualityPrincipleSerializer(principles, many=True).data)


class ServiceCategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = ServiceCategory.objects.prefetch_related("items")
        return Response(ServiceCategorySerializer(categories, many=True).data)


class CommentThrottle(AnonRateThrottle):
    scope = "comment"
    rate = "10/hour"

    def allow_request(self, request, view):
        # Only posting is limited; reading comments is free.
        if request.method != "POST":
            return True
        return super().allow_request(request, view)


class PublicPostViewSet(viewsets.ReadOnlyModelViewSet):
    """Published posts, addressed by id (posts have no slugs)."""

    permission_classes = [AllowAny]
    throttle_classes = [CommentThrottle]

    def get_queryset(self):
        queryset = (
            Post.visible()
            .select_related("category", "author")
            .annotate(visible_comments=Count("comments", filter=Q(comments__is_visible=True)))
        )
        category = self.request.query_params.get("category")
        if category and category.isdigit():
            queryset = queryset.filter(category_id=int(category))
        return queryset

    def get_serializer_class(self):
        return PostDetailSerializer if self.action == "retrieve" else PostListSerializer

    @action(detail=True, methods=["get", "post"])
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method == "GET":
            visible = post.comments.filter(is_visible=True).order_by("created_at")
            return Response(PublicCommentSerializer(visible, many=True).data)

        serializer = CommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        comment = Comment.objects.create(
            post=post,
            name=data["name"],
            email=data["email"],
            body=data["body"],
            ip_address=request.META.get("REMOTE_ADDR") or None,
        )
        return Response(PublicCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class PostCategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(CategorySerializer(Category.objects.all(), many=True).data)


class ContactThrottle(AnonRateThrottle):
    scope = "contact"
    rate = "5/hour"


class ContactMessageView(APIView):
    """Public contact form — creates a Thread directly in the unified inbox."""

    permission_classes = [AllowAny]
    throttle_classes = [ContactThrottle]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        thread = create_inbound_from_contact_form(
            name=data["name"],
            email=data["email"],
            subject=data.get("subject", ""),
            body=data["message"],
        )
        return Response({"thread_id": thread.id}, status=status.HTTP_201_CREATED)


# --- Auth ------------------------------------------------------------------

class CsrfView(APIView):
    """Primes the csrftoken cookie before the frontend issues its first POST."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        # Only staff accounts may use the dashboard.
        if user is None or not user.is_staff:
            return Response(
                {"detail": "بيانات الدخول غير صحيحة."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        auth_login(request, user)
        return Response(me_payload(user))


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auth_logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"isAuthenticated": False})
        return Response(me_payload(request.user))


# --- Dashboard (authenticated) ---------------------------------------------

class DashboardThreadViewSet(
    viewsets.ReadOnlyModelViewSet, mixins.UpdateModelMixin, mixins.DestroyModelMixin
):
    """Reading needs `view_messages`; replying, composing, assigning, closing
    and deleting need `reply_messages`."""

    permission_classes = [capability("view_messages", "reply_messages")]
    queryset = Thread.objects.select_related("correspondent", "assigned_to").all()
    http_method_names = ["get", "post", "patch", "delete"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ThreadDetailSerializer
        if self.action == "partial_update":
            return ThreadUpdateSerializer
        return ThreadListSerializer

    def partial_update(self, request, *args, **kwargs):
        thread = self.get_object()
        serializer = ThreadUpdateSerializer(thread, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ThreadListSerializer(thread).data)

    def get_queryset(self):
        queryset = super().get_queryset().prefetch_related("messages")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if self.request.query_params.get("mine") == "1":
            queryset = queryset.filter(assigned_to=self.request.user)
        return queryset

    def retrieve(self, request, *args, **kwargs):
        thread = self.get_object()
        response = Response(self.get_serializer(thread).data)
        # Opening a thread clears its unread state, as the old dashboard did.
        thread.messages.filter(is_read=False).update(is_read=True)
        if thread.is_unread:
            thread.is_unread = False
            thread.save(update_fields=["is_unread"])
        return response

    @action(detail=True, methods=["post"])
    def reply(self, request, pk=None):
        thread = self.get_object()
        serializer = ReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        send_reply(thread, serializer.validated_data["body"], request.user)
        thread.refresh_from_db()
        return Response(ThreadDetailSerializer(thread, context={"request": request}).data)

    @action(detail=False, methods=["post"])
    def compose(self, request):
        serializer = ComposeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        thread = start_thread(
            subject=data["subject"],
            body=data["body"],
            to_email=data["to_email"],
            sent_by=request.user,
            correspondent_name=data.get("to_name", ""),
        )
        return Response(
            ThreadDetailSerializer(thread, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="assign-to-me")
    def assign_to_me(self, request, pk=None):
        thread = self.get_object()
        thread.assigned_to = request.user
        thread.save(update_fields=["assigned_to"])
        return Response(ThreadListSerializer(thread).data)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        thread = self.get_object()
        thread.status = Thread.Status.CLOSED
        thread.save(update_fields=["status"])
        return Response(ThreadListSerializer(thread).data)
