from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import dashboard_views, views

app_name = "api"

router = DefaultRouter()
router.register("posts", views.PublicPostViewSet, basename="post")

dashboard_router = DefaultRouter()
dashboard_router.register("posts", dashboard_views.DashboardPostViewSet, basename="dashboard-post")
dashboard_router.register("post-categories", dashboard_views.DashboardCategoryViewSet, basename="dashboard-post-category")
dashboard_router.register("comments", dashboard_views.DashboardCommentViewSet, basename="dashboard-comment")
dashboard_router.register("threads", views.DashboardThreadViewSet, basename="dashboard-thread")
dashboard_router.register("contacts", dashboard_views.DashboardContactViewSet, basename="dashboard-contact")
dashboard_router.register("service-categories", dashboard_views.DashboardServiceCategoryViewSet, basename="dashboard-service-category")
dashboard_router.register("service-items", dashboard_views.DashboardServiceItemViewSet, basename="dashboard-service-item")
dashboard_router.register("content-blocks", dashboard_views.DashboardContentBlockViewSet, basename="dashboard-content-block")
dashboard_router.register("quality-principles", dashboard_views.DashboardQualityPrincipleViewSet, basename="dashboard-quality-principle")
dashboard_router.register("staff", dashboard_views.StaffViewSet, basename="dashboard-staff")

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

    # Dashboard
    path("dashboard/overview/", dashboard_views.OverviewView.as_view(), name="dashboard-overview"),
    path("dashboard/site-settings/", dashboard_views.DashboardSiteSettingsView.as_view(), name="dashboard-site-settings"),
    path(
        "dashboard/attachments/<int:pk>/download/",
        dashboard_views.AttachmentDownloadView.as_view(),
        name="dashboard-attachment",
    ),
    path("dashboard/", include(dashboard_router.urls)),
    path("", include(router.urls)),
]
