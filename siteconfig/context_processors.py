from .models import SiteSettings


def site_settings(request):
    """Expose global site settings to every template."""
    return {"site_settings": SiteSettings.load()}
