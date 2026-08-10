from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.http import HttpResponse
from django.urls import include, path, re_path
from django.views.generic import TemplateView

from config.sitemaps import PostSitemap, StaticViewSitemap

sitemaps = {"static": StaticViewSitemap, "posts": PostSitemap}


def healthcheck(request):
    return HttpResponse("ok")


urlpatterns = [
    path("healthz/", healthcheck),
    path("api/", include("api.urls")),
    path("admin/", admin.site.urls),
    path("i18n/", include("django.conf.urls.i18n")),
    path("sitemap.xml", sitemap, {"sitemaps": sitemaps}, name="django.contrib.sitemaps.views.sitemap"),
    path("robots.txt", TemplateView.as_view(template_name="robots.txt", content_type="text/plain")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all: hand every remaining path to the React shell, which owns routing
# (including the /ar/ and /en/ language prefixes). Must stay last, and must not
# swallow the API, admin, or static/media prefixes above.
urlpatterns += [
    re_path(r"^(?!api/|admin/|static/|media/|healthz).*$",
            TemplateView.as_view(template_name="index.html"),
            name="spa"),
]
