from django.contrib.auth.models import Group, User
from django.core import mail
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse

from messaging.models import Message, Thread
from messaging.services import create_inbound_from_contact_form
from posts.models import Post


class DashboardTestBase(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("setup_roles", verbosity=0)

    def make_user(self, username, group=None):
        user = User.objects.create_user(username, password="pw-12345")
        if group:
            user.groups.set([Group.objects.get(name=group)])
        return user


class RoleAccessTests(DashboardTestBase):
    """Editors see posts only; Support sees the inbox only."""

    def test_editor_can_access_posts_but_not_inbox(self):
        self.make_user("editor", "Editors")
        self.client.login(username="editor", password="pw-12345")

        self.assertEqual(self.client.get(reverse("dashboard:post_list")).status_code, 200)
        self.assertEqual(self.client.get(reverse("dashboard:inbox_list")).status_code, 403)

    def test_support_can_access_inbox_but_not_posts(self):
        self.make_user("support", "Support")
        self.client.login(username="support", password="pw-12345")

        self.assertEqual(self.client.get(reverse("dashboard:inbox_list")).status_code, 200)
        self.assertEqual(self.client.get(reverse("dashboard:post_list")).status_code, 403)

    def test_anonymous_is_redirected_to_login(self):
        response = self.client.get(reverse("dashboard:inbox_list"))
        self.assertEqual(response.status_code, 302)
        self.assertIn("/dashboard/login/", response["Location"])

    def test_home_routes_each_role_to_its_own_section(self):
        self.make_user("editor", "Editors")
        self.client.login(username="editor", password="pw-12345")
        self.assertRedirects(self.client.get(reverse("dashboard:home")), reverse("dashboard:post_list"))


class PostDashboardTests(DashboardTestBase):
    def setUp(self):
        self.editor = self.make_user("editor", "Editors")
        self.client.login(username="editor", password="pw-12345")

    def _create_post(self, **overrides):
        data = {
            "title": "مقال تجريبي",
            "slug": "test-post",
            "excerpt": "",
            "body": "<p>محتوى</p>",
            "seo_title": "",
            "seo_description": "",
            "status": Post.Status.PUBLISHED,
            "published_at": "",
        }
        data.update(overrides)
        return self.client.post(reverse("dashboard:post_create"), data)

    def test_create_post_sets_author_and_publish_date(self):
        response = self._create_post()
        self.assertEqual(response.status_code, 302)

        post = Post.objects.get(translations__slug="test-post")
        self.assertEqual(post.author, self.editor)
        # published_at is stamped by Post.save(), so every entry point agrees.
        self.assertIsNotNone(post.published_at)

    def test_draft_does_not_get_publish_date(self):
        self._create_post(status=Post.Status.DRAFT, slug="draft-post")
        post = Post.objects.get(translations__slug="draft-post")
        self.assertIsNone(post.published_at)

    def test_editing_english_does_not_overwrite_arabic(self):
        """Regression: parler ignores _current_language when an instance is
        passed, so the view must call set_current_language() explicitly or
        the EN edit silently overwrites the AR translation."""
        self._create_post()
        post = Post.objects.get(translations__slug="test-post")

        url = reverse("dashboard:post_edit", args=[post.pk])
        self.client.post(f"{url}?lang=en", {
            "title": "Test Article",
            "slug": "test-post-en",
            "excerpt": "",
            "body": "<p>English body</p>",
            "seo_title": "",
            "seo_description": "",
            "status": Post.Status.PUBLISHED,
            "published_at": "",
        })

        post.refresh_from_db()
        post.set_current_language("ar")
        self.assertEqual(post.title, "مقال تجريبي")
        post.set_current_language("en")
        self.assertEqual(post.title, "Test Article")
        self.assertCountEqual(post.get_available_languages(), ["ar", "en"])

    def test_delete_post(self):
        self._create_post()
        post = Post.objects.get(translations__slug="test-post")
        self.client.post(reverse("dashboard:post_delete", args=[post.pk]))
        self.assertFalse(Post.objects.filter(pk=post.pk).exists())


class InboxDashboardTests(DashboardTestBase):
    def setUp(self):
        self.agent = self.make_user("support", "Support")
        self.client.login(username="support", password="pw-12345")
        self.thread = create_inbound_from_contact_form(
            name="عميل", email="c@example.com", subject="استفسار", body="سؤال"
        )
        mail.outbox.clear()

    def test_opening_thread_marks_it_read(self):
        self.assertTrue(self.thread.is_unread)
        self.client.get(reverse("dashboard:thread_detail", args=[self.thread.pk]))

        self.thread.refresh_from_db()
        self.assertFalse(self.thread.is_unread)
        self.assertFalse(self.thread.messages.filter(is_read=False).exists())

    def test_reply_sends_email_and_records_outbound_message(self):
        self.client.post(
            reverse("dashboard:thread_detail", args=[self.thread.pk]),
            {"body": "شكرًا لتواصلكم"},
        )

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["c@example.com"])

        outbound = self.thread.messages.get(direction=Message.Direction.OUTBOUND)
        self.assertEqual(outbound.sent_by, self.agent)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.status, Thread.Status.PENDING)

    def test_compose_starts_new_thread(self):
        self.client.post(reverse("dashboard:thread_compose"), {
            "to_name": "شركة جديدة",
            "to_email": "new@example.com",
            "subject": "عرض خدماتنا",
            "body": "مرحبا",
        })

        thread = Thread.objects.get(correspondent__email="new@example.com")
        self.assertEqual(thread.subject, "عرض خدماتنا")
        self.assertEqual(len(mail.outbox), 1)

    def test_assign_to_me_and_close(self):
        self.client.post(reverse("dashboard:thread_assign_to_me", args=[self.thread.pk]))
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.assigned_to, self.agent)

        self.client.post(reverse("dashboard:thread_close", args=[self.thread.pk]))
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.status, Thread.Status.CLOSED)

    def test_inbox_filters(self):
        response = self.client.get(reverse("dashboard:inbox_list"), {"status": "open"})
        self.assertContains(response, "استفسار")

        response = self.client.get(reverse("dashboard:inbox_list"), {"status": "closed"})
        self.assertNotContains(response, "استفسار")
