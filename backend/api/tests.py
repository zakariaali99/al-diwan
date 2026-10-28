from django.contrib.auth.models import User
from django.core import mail
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase

from messaging.models import Message, Thread
from messaging.services import create_inbound_from_contact_form
from accounts.capabilities import set_capabilities
from accounts.models import ROLES
from posts.models import Post


class ApiTestBase(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("setup_roles", verbosity=0)
        call_command("seed_content", verbosity=0)
        # English translations too, or parler falls back to Arabic and the
        # language tests pass vacuously.
        call_command("seed_english", verbosity=0)

    def setUp(self):
        # Throttle counters live in the cache and would leak between tests.
        cache.clear()
        super().setUp()

    def make_user(self, username, role=None, *, staff=True):
        user = User.objects.create_user(username, password="pw-12345", is_staff=staff)
        if role:
            set_capabilities(user, ROLES[role], role)
        return user


class PublicApiTests(ApiTestBase):
    def test_site_settings(self):
        response = self.client.get("/api/site-settings/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "info@al-diwan.ly")

    def test_content_blocks_keyed_by_slug(self):
        data = self.client.get("/api/content-blocks/").json()
        self.assertIn("home_hero", data)
        self.assertIn("quality_policy", data)

    def test_service_categories_include_nested_items(self):
        data = self.client.get("/api/service-categories/").json()
        self.assertEqual(len(data), 9)
        self.assertTrue(all("items" in c for c in data))
        self.assertTrue(any(len(c["items"]) > 0 for c in data))

    def test_language_follows_accept_language_header(self):
        arabic = self.client.get("/api/service-categories/", HTTP_ACCEPT_LANGUAGE="ar").json()
        english = self.client.get("/api/service-categories/", HTTP_ACCEPT_LANGUAGE="en").json()
        self.assertEqual(arabic[0]["name"], "خدمات الفحص الطبي")
        self.assertEqual(english[0]["name"], "Medical inspection services")

    def test_accept_language_beats_a_stale_language_cookie(self):
        """Regression: Django resolves language from the django_language cookie
        before the Accept-Language header. A visitor who had browsed /ar/ kept
        getting Arabic content on the English site, because the cookie won."""
        self.client.cookies["django_language"] = "ar"

        response = self.client.get("/api/content-blocks/", HTTP_ACCEPT_LANGUAGE="en")

        self.assertIn("We provide", response.json()["home_hero"]["body"])

    def test_posts_list_and_detail_by_id(self):
        listing = self.client.get("/api/posts/").json()
        self.assertGreaterEqual(len(listing), 1)
        self.assertNotIn("slug", listing[0])

        detail = self.client.get(f"/api/posts/{listing[0]['id']}/")
        self.assertEqual(detail.status_code, 200)
        self.assertIn("body", detail.json())

    def test_unpublished_posts_are_hidden(self):
        post = Post.objects.first()
        post.status = Post.Status.DRAFT
        post.save()
        self.assertEqual(self.client.get(f"/api/posts/{post.pk}/").status_code, 404)

    def test_contact_creates_thread(self):
        response = self.client.post("/api/contact/", {
            "name": "عميل", "email": "c@example.com",
            "subject": "استفسار", "message": "سؤال", "website": "",
        }, content_type="application/json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Thread.objects.filter(correspondent__email="c@example.com").exists())

    def test_contact_honeypot_rejected(self):
        response = self.client.post("/api/contact/", {
            "name": "bot", "email": "bot@example.com",
            "subject": "spam", "message": "spam", "website": "http://spam.example",
        }, content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Thread.objects.filter(correspondent__email="bot@example.com").exists())


class AuthApiTests(ApiTestBase):
    def test_me_is_anonymous_before_login(self):
        self.assertFalse(self.client.get("/api/auth/me/").json()["isAuthenticated"])

    def test_login_returns_capabilities(self):
        self.make_user("editor", "editor")
        response = self.client.post("/api/auth/login/", {
            "username": "editor", "password": "pw-12345",
        }, content_type="application/json")

        self.assertEqual(response.status_code, 200)
        capabilities = response.json()["capabilities"]
        self.assertIn("view_posts", capabilities)
        self.assertNotIn("view_messages", capabilities)

    def test_non_staff_cannot_log_in(self):
        self.make_user("visitor", staff=False)
        response = self.client.post("/api/auth/login/", {
            "username": "visitor", "password": "pw-12345",
        }, content_type="application/json")
        self.assertEqual(response.status_code, 401)

    def test_bad_credentials_rejected(self):
        response = self.client.post("/api/auth/login/", {
            "username": "nobody", "password": "wrong",
        }, content_type="application/json")
        self.assertEqual(response.status_code, 401)

    def test_logout(self):
        self.make_user("editor", "editor")
        self.client.login(username="editor", password="pw-12345")
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)
        self.assertFalse(self.client.get("/api/auth/me/").json()["isAuthenticated"])


class DashboardApiPermissionTests(ApiTestBase):
    """The whole point of the roles: Editors can't reach the inbox and
    Support can't reach posts — read included."""

    def test_anonymous_is_denied(self):
        self.assertIn(self.client.get("/api/dashboard/posts/").status_code, (401, 403))
        self.assertIn(self.client.get("/api/dashboard/threads/").status_code, (401, 403))

    def test_editor_can_read_posts_but_not_threads(self):
        self.make_user("editor", "editor")
        self.client.login(username="editor", password="pw-12345")
        self.assertEqual(self.client.get("/api/dashboard/posts/").status_code, 200)
        self.assertEqual(self.client.get("/api/dashboard/threads/").status_code, 403)

    def test_support_can_read_threads_but_not_posts(self):
        self.make_user("support", "support")
        self.client.login(username="support", password="pw-12345")
        self.assertEqual(self.client.get("/api/dashboard/threads/").status_code, 200)
        self.assertEqual(self.client.get("/api/dashboard/posts/").status_code, 403)


class DashboardPostApiTests(ApiTestBase):
    def setUp(self):
        super().setUp()
        self.editor = self.make_user("editor", "editor")
        self.client.login(username="editor", password="pw-12345")

    def test_create_sets_author_and_publish_date(self):
        response = self.client.post("/api/dashboard/posts/", {
            "title": "مقال تجريبي",
            "body": "<p>محتوى</p>", "status": "published", "language": "ar",
        }, content_type="application/json")

        self.assertEqual(response.status_code, 201, response.content)
        post = Post.objects.get(pk=response.json()["id"])
        self.assertEqual(post.author, self.editor)
        self.assertIsNotNone(post.published_at)

    def test_editing_english_does_not_overwrite_arabic(self):
        """Regression: parler resolves translated fields against the instance's
        current language, so the language must be set explicitly or an English
        edit silently overwrites the Arabic translation."""
        created = self.client.post("/api/dashboard/posts/", {
            "title": "مقال تجريبي",
            "body": "<p>محتوى</p>", "status": "published", "language": "ar",
        }, content_type="application/json").json()

        self.client.patch(f"/api/dashboard/posts/{created['id']}/", {
            "title": "Test Article",
            "body": "<p>English</p>", "language": "en",
        }, content_type="application/json")

        post = Post.objects.get(pk=created["id"])
        post.set_current_language("ar")
        self.assertEqual(post.title, "مقال تجريبي")
        post.set_current_language("en")
        self.assertEqual(post.title, "Test Article")

    def test_delete(self):
        created = self.client.post("/api/dashboard/posts/", {
            "title": "للحذف", "status": "draft", "language": "ar",
        }, content_type="application/json").json()
        self.assertEqual(
            self.client.delete(f"/api/dashboard/posts/{created['id']}/").status_code, 204
        )
        self.assertFalse(Post.objects.filter(pk=created["id"]).exists())


class DashboardThreadApiTests(ApiTestBase):
    def setUp(self):
        super().setUp()
        self.agent = self.make_user("support", "support")
        self.client.login(username="support", password="pw-12345")
        self.thread = create_inbound_from_contact_form(
            name="عميل", email="c@example.com", subject="استفسار", body="سؤال"
        )
        mail.outbox.clear()

    def test_retrieve_marks_thread_read(self):
        self.assertTrue(self.thread.is_unread)
        response = self.client.get(f"/api/dashboard/threads/{self.thread.pk}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["messages"]), 1)
        self.thread.refresh_from_db()
        self.assertFalse(self.thread.is_unread)

    def test_reply_sends_email_and_records_message(self):
        response = self.client.post(
            f"/api/dashboard/threads/{self.thread.pk}/reply/",
            {"body": "شكرًا لتواصلكم"}, content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)

        outbound = self.thread.messages.get(direction=Message.Direction.OUTBOUND)
        self.assertEqual(outbound.sent_by, self.agent)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.status, Thread.Status.PENDING)

    def test_compose_starts_new_thread(self):
        response = self.client.post("/api/dashboard/threads/compose/", {
            "to_name": "شركة", "to_email": "new@example.com",
            "subject": "عرض", "body": "مرحبا",
        }, content_type="application/json")

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Thread.objects.filter(correspondent__email="new@example.com").exists())
        self.assertEqual(len(mail.outbox), 1)

    def test_assign_and_close(self):
        self.client.post(f"/api/dashboard/threads/{self.thread.pk}/assign-to-me/")
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.assigned_to, self.agent)

        self.client.post(f"/api/dashboard/threads/{self.thread.pk}/close/")
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.status, Thread.Status.CLOSED)

    def test_status_filter(self):
        open_threads = self.client.get("/api/dashboard/threads/?status=open").json()
        closed_threads = self.client.get("/api/dashboard/threads/?status=closed").json()
        self.assertEqual(len(open_threads), 1)
        self.assertEqual(len(closed_threads), 0)


class RoutingTests(ApiTestBase):
    def test_spa_catchall_serves_react_shell(self):
        for path in ["/ar/", "/en/about-us/", "/ar/posts/12/"]:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)

    def test_api_and_admin_are_not_swallowed_by_catchall(self):
        self.assertEqual(self.client.get("/api/site-settings/").status_code, 200)
        self.assertEqual(self.client.get("/admin/").status_code, 302)  # redirects to login

    def test_sitemap_and_robots(self):
        sitemap = self.client.get("/sitemap.xml")
        self.assertEqual(sitemap.status_code, 200)
        self.assertContains(sitemap, "/ar/")
        self.assertEqual(self.client.get("/robots.txt").status_code, 200)
