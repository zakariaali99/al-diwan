from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse

from messaging.models import Message, Thread
from posts.models import Post


class PublicPagesTests(TestCase):
    """The public site must render for every seeded language."""

    @classmethod
    def setUpTestData(cls):
        call_command("seed_content", verbosity=0)

    def test_all_public_pages_render_in_both_languages(self):
        paths = ["/ar/", "/en/", "/ar/services/", "/en/services/",
                 "/ar/about-us/", "/ar/contact-us/", "/ar/posts/"]
        for path in paths:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)

    def test_home_shows_seeded_service_categories(self):
        response = self.client.get("/ar/")
        self.assertContains(response, "خدمات الفحص الطبي")
        self.assertContains(response, "ISO 9001:2015")

    def test_home_separates_commodity_and_process_categories(self):
        """Lifecycle stages render as the timeline, not as bento cards."""
        response = self.client.get("/ar/")
        commodity = response.context["commodity_categories"]
        process = response.context["process_categories"]

        self.assertEqual(len(process), 4)
        process_names = [c.safe_translation_getter("name", any_language=True) for c in process]
        self.assertEqual(process_names[0], "فحص ما قبل التصنيع")   # ordering matters
        self.assertEqual(process_names[-1], "التفتيش عند الوصول")
        self.assertNotIn("فحص ما قبل الشحن",
                         [c.safe_translation_getter("name", any_language=True) for c in commodity])

    def test_arabic_slug_post_detail_resolves(self):
        """Django's built-in <slug:> converter is ASCII-only; the site relies on
        a Unicode converter so Arabic post URLs work."""
        post = Post.objects.get(translations__slug="اهلا-وسهلا")
        url = reverse("posts:detail", args=[post.safe_translation_getter("slug", any_language=True)])
        self.assertEqual(self.client.get(url).status_code, 200)

    def test_unpublished_posts_are_not_public(self):
        post = Post.objects.first()
        post.status = Post.Status.DRAFT
        post.save()

        slug = post.safe_translation_getter("slug", any_language=True)
        self.assertEqual(self.client.get(f"/ar/posts/{slug}/").status_code, 404)
        self.assertNotContains(self.client.get("/ar/posts/"), slug)

    def test_sitemap_and_robots(self):
        sitemap = self.client.get("/sitemap.xml")
        self.assertEqual(sitemap.status_code, 200)
        self.assertContains(sitemap, "/ar/")

        robots = self.client.get("/robots.txt")
        self.assertEqual(robots.status_code, 200)
        self.assertContains(robots, "Disallow: /dashboard/")

    def test_dashboard_is_not_linked_from_public_pages(self):
        self.assertNotContains(self.client.get("/ar/"), "/dashboard/")

    def test_language_switch_keeps_the_visitor_on_the_same_page(self):
        response = self.client.post(
            "/i18n/setlang/", {"language": "en", "next": "/en/about-us/"}, follow=True
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.redirect_chain[-1][0], "/en/about-us/")

    def test_pages_expose_alternate_language_links_for_seo(self):
        response = self.client.get("/ar/about-us/")
        self.assertContains(response, 'hreflang="en"')
        self.assertContains(response, "/en/about-us/")


class ContactFormTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_content", verbosity=0)

    def test_valid_submission_creates_thread_and_redirects(self):
        response = self.client.post("/ar/contact-us/", {
            "name": "عميل",
            "email": "customer@example.com",
            "subject": "طلب عرض سعر",
            "message": "أريد فحص شحنة مواد غذائية.",
            "website": "",
        })
        self.assertRedirects(response, "/ar/contact-us/")

        thread = Thread.objects.get(correspondent__email="customer@example.com")
        self.assertEqual(thread.subject, "طلب عرض سعر")
        self.assertTrue(thread.is_unread)
        self.assertEqual(thread.messages.get().direction, Message.Direction.INBOUND)

    def test_honeypot_submission_is_rejected(self):
        response = self.client.post("/ar/contact-us/", {
            "name": "spam bot",
            "email": "bot@example.com",
            "subject": "buy now",
            "message": "spam",
            "website": "http://spam.example",  # humans never see this field
        })
        self.assertEqual(response.status_code, 200)  # redisplayed, not redirected
        self.assertFalse(Thread.objects.filter(correspondent__email="bot@example.com").exists())

    def test_invalid_submission_does_not_create_thread(self):
        response = self.client.post("/ar/contact-us/", {
            "name": "", "email": "not-an-email", "subject": "", "message": "", "website": "",
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Thread.objects.count(), 0)
