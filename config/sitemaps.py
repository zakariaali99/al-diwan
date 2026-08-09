from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from posts.models import Post


class StaticViewSitemap(Sitemap):
    changefreq = "monthly"

    def items(self):
        return ["pages:home", "pages:services", "pages:about", "pages:contact", "posts:list"]

    def location(self, item):
        return reverse(item)

    def priority(self, item):
        return 1.0 if item == "pages:home" else 0.8


class PostSitemap(Sitemap):
    priority = 0.6
    changefreq = "weekly"

    def items(self):
        return Post.objects.filter(status=Post.Status.PUBLISHED)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("posts:detail", args=[obj.safe_translation_getter("slug", any_language=True)])
