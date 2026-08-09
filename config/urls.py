from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.http import HttpResponse
from django.urls import include, path
from django.views.generic import TemplateView

from config.sitemaps import PostSitemap, StaticViewSitemap

sitemaps = {"static": StaticViewSitemap, "posts": PostSitemap}


def healthcheck(request):
    return HttpResponse("ok")


urlpatterns = [
    path("healthz/", healthcheck),
    path("api/", include("api.urls")),
    path("i18n/", include("django.conf.urls.i18n")),
    path("sitemap.xml", sitemap, {"sitemaps": sitemaps}, name="django.contrib.sitemaps.views.sitemap"),
    path("robots.txt", TemplateView.as_view(template_name="robots.txt", content_type="text/plain")),
]

urlpatterns += i18n_patterns(
    path("admin/", admin.site.urls),
    path("dashboard/", include("dashboard.urls")),
    path("posts/", include("posts.urls")),
    path("", include("pages.urls")),
    prefix_default_language=True,
)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
