from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "api"

router = DefaultRouter()
router.register("posts", views.PublicPostViewSet, basename="post")

dashboard_router = DefaultRouter()
dashboard_router.register("posts", views.DashboardPostViewSet, basename="dashboard-post")
dashboard_router.register("threads", views.DashboardThreadViewSet, basename="dashboard-thread")

urlpatterns = [
    # Public
    path("site-settings/", views.SiteSettingsView.as_view(), name="site-settings"),
    path("content-blocks/", views.ContentBlockListView.as_view(), name="content-blocks"),
    path("quality-principles/", views.QualityPrincipleListView.as_view(), name="quality-principles"),
    path("service-categories/", views.ServiceCategoryListView.as_view(), name="service-categories"),
    path("post-categories/", views.PostCategoryListView.as_view(), name="post-categories"),
    path("contact/", views.ContactMessageView.as_view(), name="contact"),

    # Auth
    path("auth/csrf/", views.CsrfView.as_view(), name="csrf"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("auth/me/", views.CurrentUserView.as_view(), name="me"),

    path("dashboard/", include(dashboard_router.urls)),
    path("", include(router.urls)),
]
