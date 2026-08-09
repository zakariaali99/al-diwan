"""Sitemaps for the React frontend's routes.

Routing lives in React now, so these are literal paths rather than reverse()
lookups — Django has no URL patterns for the public pages any more.
"""

from django.contrib.sitemaps import Sitemap

from posts.models import Post

LANGUAGES = ["ar", "en"]
STATIC_PATHS = ["", "services/", "about-us/", "contact-us/", "posts/"]


class StaticViewSitemap(Sitemap):
    changefreq = "monthly"

    def items(self):
        return [f"/{lang}/{path}" for lang in LANGUAGES for path in STATIC_PATHS]

    def location(self, item):
        return item

    def priority(self, item):
        return 1.0 if item in ("/ar/", "/en/") else 0.8


class PostSitemap(Sitemap):
    priority = 0.6
    changefreq = "weekly"

    def items(self):
        posts = Post.objects.filter(status=Post.Status.PUBLISHED)
        return [(lang, post) for lang in LANGUAGES for post in posts]

    def location(self, item):
        lang, post = item
        slug = post.safe_translation_getter("slug", any_language=True)
        return f"/{lang}/posts/{slug}/"

    def lastmod(self, item):
        return item[1].updated_at
