"""Public + dashboard API.

Auth is session + CSRF (DRF SessionAuthentication). The frontend is served
same-origin, so cookies work without CORS and there's no token handling.
"""

from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth import authenticate
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from messaging.models import Thread
from messaging.services import (
    create_inbound_from_contact_form,
    send_reply,
    start_thread,
)
from pages.models import ContentBlock, QualityPrinciple
from posts.models import Category, Post
from services.models import ServiceCategory
from siteconfig.models import SiteSettings

from .permissions import DjangoModelPermissionsStrict
from .serializers import (
    CategorySerializer,
    ComposeSerializer,
    ContactMessageSerializer,
    ContentBlockSerializer,
    CurrentUserSerializer,
    DashboardPostSerializer,
    LoginSerializer,
    PostDetailSerializer,
    PostListSerializer,
    QualityPrincipleSerializer,
    ReplySerializer,
    ServiceCategorySerializer,
    SiteSettingsSerializer,
    ThreadDetailSerializer,
    ThreadListSerializer,
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


class PublicPostViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    lookup_value_regex = "[^/]+"  # Arabic slugs are not ASCII-safe

    def get_queryset(self):
        queryset = (
            Post.objects.filter(status=Post.Status.PUBLISHED)
            .select_related("category", "author")
        )
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(translations__slug=category).distinct()
        return queryset

    def get_serializer_class(self):
        return PostDetailSerializer if self.action == "retrieve" else PostListSerializer

    def get_object(self):
        return get_object_or_404(self.get_queryset(), translations__slug=self.kwargs["slug"])


class PostCategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(CategorySerializer(Category.objects.all(), many=True).data)


class ContactThrottle(AnonRateThrottle):
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

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "بيانات الدخول غير صحيحة."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        auth_login(request, user)
        return Response(CurrentUserSerializer(user).data)


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
        data = CurrentUserSerializer(request.user).data
        data["isAuthenticated"] = True
        return Response(data)


# --- Dashboard (authenticated) ---------------------------------------------

class DashboardPostViewSet(viewsets.ModelViewSet):
    """Editors manage posts here. Model permissions gate every method, so a
    Support-only account gets 403 rather than a usable endpoint."""

    serializer_class = DashboardPostSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissionsStrict]
    queryset = Post.objects.select_related("category", "author").all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class DashboardThreadViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, DjangoModelPermissionsStrict]
    queryset = Thread.objects.select_related("correspondent", "assigned_to").all()

    def get_serializer_class(self):
        return ThreadDetailSerializer if self.action == "retrieve" else ThreadListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
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
