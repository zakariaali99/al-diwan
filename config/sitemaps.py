"""Sitemaps for the React frontend's routes.

Routing lives in React now, so these are literal paths rather than reverse()
lookups — Django has no URL patterns for the public pages any more.

Arabic is the site's main language, so it is listed first and carries the
highest priority; the other locales are secondary translations of it.
"""

from django.contrib.sitemaps import Sitemap

from posts.models import Post

# Short URL codes, matching the frontend's /:lang/ segment. Arabic first.
LANGUAGES = ["ar", "en", "es", "it", "zh", "tr"]
MAIN_LANGUAGE = "ar"

STATIC_PATHS = ["", "services/", "about-us/", "contact-us/", "posts/"]


class StaticViewSitemap(Sitemap):
    changefreq = "monthly"

    def items(self):
        return [f"/{lang}/{path}" for lang in LANGUAGES for path in STATIC_PATHS]

    def location(self, item):
        return item

    def priority(self, item):
        main = item.startswith(f"/{MAIN_LANGUAGE}/")
        if item == f"/{MAIN_LANGUAGE}/":
            return 1.0
        if main:
            return 0.9
        # Translations rank below the Arabic original.
        return 0.7 if item.endswith("/") and item.count("/") == 2 else 0.6


class PostSitemap(Sitemap):
    changefreq = "weekly"

    def items(self):
        posts = Post.objects.filter(status=Post.Status.PUBLISHED)
        return [(lang, post) for lang in LANGUAGES for post in posts]

    def location(self, item):
        lang, post = item
        slug = post.safe_translation_getter("slug", any_language=True)
        return f"/{lang}/posts/{slug}/"

    def priority(self, item):
        return 0.7 if item[0] == MAIN_LANGUAGE else 0.5

    def lastmod(self, item):
        return item[1].updated_at
