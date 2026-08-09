from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path


def healthcheck(request):
    return HttpResponse("ok")


urlpatterns = [
    path("healthz/", healthcheck),
    path("api/", include("api.urls")),
]

urlpatterns += i18n_patterns(
    path("admin/", admin.site.urls),
    path("dashboard/", include("dashboard.urls")),
    # path("", include("pages.urls")),                 # added in Phase 5
    prefix_default_language=True,
)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
