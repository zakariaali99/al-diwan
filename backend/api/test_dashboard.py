import tempfile

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

from messaging.models import Attachment
from messaging.services import create_inbound_from_contact_form
from pages.models import ContentBlock
from posts.models import Comment, Post
from services.models import ServiceCategory

from .tests import ApiTestBase

# 1×1 transparent GIF
GIF = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"


class RoleIsolationTests(ApiTestBase):
    """Each role reaches its own sections and nothing else — reads included."""

    MATRIX = {
        "editor": {"posts": 200, "comments": 200, "threads": 403, "service-categories": 403, "staff": 403},
        "writer": {"posts": 200, "comments": 403, "threads": 403, "service-categories": 403, "staff": 403},
        "moderator": {"posts": 200, "comments": 200, "threads": 403, "service-categories": 403, "staff": 403},
        "support": {"posts": 403, "comments": 403, "threads": 200, "contacts": 200, "staff": 403},
        "content_manager": {"posts": 403, "service-categories": 200, "content-blocks": 200, "threads": 403},
        "admin": {"posts": 200, "comments": 200, "threads": 200, "service-categories": 200, "staff": 200},
    }

    def test_matrix(self):
        for role, expectations in self.MATRIX.items():
            self.make_user(role, role)
            self.client.login(username=role, password="pw-12345")
            for endpoint, expected in expectations.items():
                with self.subTest(role=role, endpoint=endpoint):
                    response = self.client.get(f"/api/dashboard/{endpoint}/")
                    self.assertEqual(response.status_code, expected)
            self.client.logout()

    def test_custom_capabilities_mix_sections(self):
        """An editor who may also read messages — the reason roles are editable."""
        from accounts.capabilities import set_capabilities
        from accounts.models import ROLES

        user = self.make_user("mixed")
        set_capabilities(user, [*ROLES["editor"], "view_messages"])
        self.client.login(username="mixed", password="pw-12345")
        self.assertEqual(self.client.get("/api/dashboard/threads/").status_code, 200)
        thread = create_inbound_from_contact_form(name="ع", email="a@example.com", subject="س", body="ج")
        # Reading yes, replying no.
        reply = self.client.post(f"/api/dashboard/threads/{thread.pk}/reply/", {"body": "x"}, content_type="application/json")
        self.assertEqual(reply.status_code, 403)

    def test_inactive_staff_is_locked_out(self):
        user = self.make_user("gone", "admin")
        self.client.login(username="gone", password="pw-12345")
        user.is_active = False
        user.save()
        self.assertIn(self.client.get("/api/dashboard/posts/").status_code, (401, 403))


class WriterPublishingTests(ApiTestBase):
    def setUp(self):
        super().setUp()
        self.make_user("writer", "writer")
        self.client.login(username="writer", password="pw-12345")

    def test_writer_posts_are_forced_to_draft(self):
        response = self.client.post("/api/dashboard/posts/", {
            "title": "مسودة", "status": "published", "language": "ar",
        }, content_type="application/json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Post.objects.get(pk=response.json()["id"]).status, Post.Status.DRAFT)

    def test_writer_cannot_edit_published_post_or_delete(self):
        post = Post.visible().first()
        response = self.client.patch(f"/api/dashboard/posts/{post.pk}/", {"title": "x", "language": "ar"},
                                     content_type="application/json")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.client.delete(f"/api/dashboard/posts/{post.pk}/").status_code, 403)


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class PostEditingTests(ApiTestBase):
    def setUp(self):
        super().setUp()
        self.make_user("editor", "editor")
        self.client.login(username="editor", password="pw-12345")

    def test_reading_a_language_without_translation_is_empty_not_arabic(self):
        created = self.client.post("/api/dashboard/posts/", {
            "title": "عربي فقط", "body": "<p>نص</p>", "status": "draft", "language": "ar",
        }, content_type="application/json").json()
        english = self.client.get(f"/api/dashboard/posts/{created['id']}/?language=en").json()
        self.assertEqual(english["title"], "")
        self.assertEqual(english["translated_languages"], ["ar"])
        arabic = self.client.get(f"/api/dashboard/posts/{created['id']}/?language=ar").json()
        self.assertEqual(arabic["title"], "عربي فقط")

    def test_upload_and_remove_featured_image(self):
        created = self.client.post("/api/dashboard/posts/", {
            "title": "بصورة", "status": "draft", "language": "ar",
            "featured_image": SimpleUploadedFile("cover.gif", GIF, content_type="image/gif"),
        })
        self.assertEqual(created.status_code, 201, created.content)
        self.assertTrue(created.json()["featured_image"])
        post_id = created.json()["id"]

        removed = self.client.patch(f"/api/dashboard/posts/{post_id}/", {"remove_image": True, "language": "ar"},
                                    content_type="application/json")
        self.assertEqual(removed.status_code, 200)
        self.assertIsNone(removed.json()["featured_image"])

    def test_scheduled_post_needs_a_date_and_goes_live_when_due(self):
        bad = self.client.post("/api/dashboard/posts/", {
            "title": "لاحقًا", "status": "scheduled", "language": "ar",
        }, content_type="application/json")
        self.assertEqual(bad.status_code, 400)

        due = self.client.post("/api/dashboard/posts/", {
            "title": "حان وقته", "status": "scheduled", "published_at": "2020-01-01T10:00:00Z", "language": "ar",
        }, content_type="application/json").json()
        self.assertEqual(self.client.get(f"/api/posts/{due['id']}/").status_code, 200)

        future = self.client.post("/api/dashboard/posts/", {
            "title": "مستقبلي", "status": "scheduled", "published_at": "2999-01-01T10:00:00Z", "language": "ar",
        }, content_type="application/json").json()
        self.assertEqual(self.client.get(f"/api/posts/{future['id']}/").status_code, 404)

    def test_categories_crud_by_id(self):
        created = self.client.post("/api/dashboard/post-categories/", {"name": "أخبار", "language": "ar"},
                                   content_type="application/json")
        self.assertEqual(created.status_code, 201)
        category_id = created.json()["id"]
        self.client.patch(f"/api/dashboard/post-categories/{category_id}/", {"name": "News", "language": "en"},
                          content_type="application/json")
        public_en = self.client.get("/api/post-categories/", HTTP_ACCEPT_LANGUAGE="en").json()
        self.assertIn("News", [c["name"] for c in public_en])
        self.assertEqual(self.client.delete(f"/api/dashboard/post-categories/{category_id}/").status_code, 204)


class CommentTests(ApiTestBase):
    def setUp(self):
        super().setUp()
        self.post = Post.visible().first()

    def comment(self, **overrides):
        payload = {"name": "زائر", "email": "v@example.com", "body": "مقال مفيد", "website": "", **overrides}
        return self.client.post(f"/api/posts/{self.post.pk}/comments/", payload, content_type="application/json")

    def test_visitor_comments_and_email_stays_private(self):
        response = self.comment()
        self.assertEqual(response.status_code, 201)
        public = self.client.get(f"/api/posts/{self.post.pk}/comments/").json()
        self.assertEqual(len(public), 1)
        self.assertNotIn("email", public[0])
        self.assertEqual(self.client.get(f"/api/posts/{self.post.pk}/").json()["comment_count"], 1)

    def test_validation_and_honeypot(self):
        self.assertEqual(self.comment(email="not-an-email").status_code, 400)
        self.assertEqual(self.comment(website="http://spam").status_code, 400)
        self.assertFalse(Comment.objects.exists())

    def test_cannot_comment_on_draft(self):
        self.post.status = Post.Status.DRAFT
        self.post.save()
        self.assertEqual(self.comment().status_code, 404)

    def test_moderator_sees_email_hides_and_deletes(self):
        comment_id = self.comment().json()["id"]
        self.make_user("mod", "moderator")
        self.client.login(username="mod", password="pw-12345")

        listing = self.client.get("/api/dashboard/comments/").json()
        self.assertEqual(listing[0]["email"], "v@example.com")

        self.client.patch(f"/api/dashboard/comments/{comment_id}/", {"is_visible": False},
                          content_type="application/json")
        self.client.logout()
        self.assertEqual(self.client.get(f"/api/posts/{self.post.pk}/comments/").json(), [])

        self.client.login(username="mod", password="pw-12345")
        self.assertEqual(self.client.delete(f"/api/dashboard/comments/{comment_id}/").status_code, 204)
        self.assertFalse(Comment.objects.exists())

    def test_editor_body_cannot_be_changed_by_moderation(self):
        comment_id = self.comment().json()["id"]
        self.make_user("mod", "moderator")
        self.client.login(username="mod", password="pw-12345")
        self.client.patch(f"/api/dashboard/comments/{comment_id}/", {"body": "تغيير"},
                          content_type="application/json")
        self.assertEqual(Comment.objects.get(pk=comment_id).body, "مقال مفيد")


class StaffManagementTests(ApiTestBase):
    def setUp(self):
        super().setUp()
        self.admin = self.make_user("boss", "admin")
        self.client.login(username="boss", password="pw-12345")

    def create(self, **overrides):
        payload = {
            "username": "newbie", "password": "Strong-pass-2026", "first_name": "سالم",
            "email": "s@example.com", "role": "support", "is_active": True, **overrides,
        }
        return self.client.post("/api/dashboard/staff/", payload, content_type="application/json")

    def test_create_with_role_then_customise(self):
        response = self.create()
        self.assertEqual(response.status_code, 201, response.content)
        data = response.json()
        self.assertEqual(data["role"], "support")
        self.assertIn("reply_messages", data["capabilities"])

        updated = self.client.patch(f"/api/dashboard/staff/{data['id']}/", {
            "capabilities": ["view_messages", "view_comments"],
        }, content_type="application/json").json()
        self.assertEqual(updated["role"], "custom")
        # view_comments pulls in view_posts.
        self.assertEqual(updated["capabilities"], ["view_posts", "view_comments", "view_messages"])

        self.client.logout()
        login = self.client.post("/api/auth/login/", {"username": "newbie", "password": "Strong-pass-2026"},
                                 content_type="application/json")
        self.assertEqual(login.status_code, 200)

    def test_weak_password_rejected(self):
        response = self.create(password="123")
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.json())

    def test_cannot_lock_yourself_out(self):
        own = f"/api/dashboard/staff/{self.admin.pk}/"
        self.assertEqual(self.client.patch(own, {"is_active": False}, content_type="application/json").status_code, 403)
        self.assertEqual(
            self.client.patch(own, {"capabilities": ["view_posts"]}, content_type="application/json").status_code, 403
        )
        self.assertEqual(self.client.delete(own).status_code, 403)

    def test_cannot_touch_superuser_unless_superuser(self):
        root = User.objects.create_superuser("root", "r@example.com", "pw-12345")
        self.assertEqual(self.client.delete(f"/api/dashboard/staff/{root.pk}/").status_code, 403)

    def test_roles_endpoint(self):
        data = self.client.get("/api/dashboard/staff/roles/").json()
        self.assertIn("editor", data["roles"])
        self.assertIn("manage_staff", data["capabilities"])


class SiteContentTests(ApiTestBase):
    def setUp(self):
        super().setUp()
        self.make_user("cm", "content_manager")
        self.client.login(username="cm", password="pw-12345")

    def test_service_category_and_item_per_language(self):
        category = ServiceCategory.objects.first()
        response = self.client.patch(f"/api/dashboard/service-categories/{category.pk}/",
                                     {"name": "Medical (edited)", "language": "en"},
                                     content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Medical (edited)")
        arabic = self.client.get(f"/api/dashboard/service-categories/{category.pk}/?language=ar").json()
        self.assertEqual(arabic["name"], "خدمات الفحص الطبي")

        item = self.client.post("/api/dashboard/service-items/", {
            "category": category.pk, "text": "بند جديد", "order": 99, "language": "ar",
        }, content_type="application/json")
        self.assertEqual(item.status_code, 201, item.content)
        self.assertEqual(self.client.delete(f"/api/dashboard/service-items/{item.json()['id']}/").status_code, 204)

    def test_site_settings_and_content_block(self):
        response = self.client.patch("/api/dashboard/site-settings/", {"phone": "+218 91 000 0000", "language": "ar"},
                                     content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/site-settings/").json()["phone"], "+218 91 000 0000")

        block = ContentBlock.objects.get(slug="home_hero")
        self.client.patch(f"/api/dashboard/content-blocks/{block.pk}/", {"title": "عنوان جديد", "language": "ar"},
                          content_type="application/json")
        self.assertEqual(self.client.get("/api/content-blocks/", HTTP_ACCEPT_LANGUAGE="ar").json()["home_hero"]["title"],
                         "عنوان جديد")

    def test_quality_principles_crud(self):
        created = self.client.post("/api/dashboard/quality-principles/", {"text": "مبدأ", "order": 9, "language": "ar"},
                                   content_type="application/json")
        self.assertEqual(created.status_code, 201)
        self.assertEqual(self.client.delete(f"/api/dashboard/quality-principles/{created.json()['id']}/").status_code, 204)


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class AttachmentPrivacyTests(ApiTestBase):
    def test_attachments_only_through_the_dashboard(self):
        thread = create_inbound_from_contact_form(name="ع", email="a@example.com", subject="س", body="ج")
        attachment = Attachment(message=thread.messages.first(), filename="doc.txt", content_type="text/plain")
        attachment.file.save("doc.txt", ContentFile(b"secret"), save=True)

        self.assertEqual(self.client.get(f"/media/{attachment.file.name}").status_code, 404)
        url = f"/api/dashboard/attachments/{attachment.pk}/download/"
        self.assertIn(self.client.get(url).status_code, (401, 403))

        self.make_user("support", "support")
        self.client.login(username="support", password="pw-12345")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(b"".join(response.streaming_content), b"secret")
        attachment.file.delete()


class OverviewTests(ApiTestBase):
    def test_overview_only_includes_allowed_sections(self):
        self.make_user("support", "support")
        self.client.login(username="support", password="pw-12345")
        data = self.client.get("/api/dashboard/overview/").json()
        self.assertIn("messages", data)
        self.assertNotIn("posts", data)
