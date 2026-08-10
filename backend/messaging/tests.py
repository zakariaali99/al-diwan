import email
from email.message import EmailMessage as PyEmailMessage

from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase

from .management.commands.fetch_inbound_mail import Command as FetchInboundCommand
from .models import Message, Thread
from .services import create_inbound_from_contact_form, send_reply, start_thread


class UnifiedInboxTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user("agent", password="x")

    def test_contact_form_creates_thread_and_message(self):
        thread = create_inbound_from_contact_form(
            name="Customer", email="c@example.com", subject="Question", body="Hi there"
        )
        self.assertEqual(thread.messages.count(), 1)
        self.assertTrue(thread.is_unread)
        self.assertEqual(thread.messages.first().direction, Message.Direction.INBOUND)

    def test_staff_reply_sends_email_and_updates_thread(self):
        thread = create_inbound_from_contact_form(
            name="Customer", email="c@example.com", subject="Question", body="Hi"
        )
        reply = send_reply(thread, "We'll get back to you", self.staff)

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["c@example.com"])
        self.assertTrue(reply.message_id)

        thread.refresh_from_db()
        self.assertEqual(thread.status, Thread.Status.PENDING)
        self.assertFalse(thread.is_unread)

    def test_start_thread_creates_correspondent_and_sends(self):
        thread = start_thread(
            subject="New business", body="Hello", to_email="new@example.com", sent_by=self.staff
        )
        self.assertEqual(thread.correspondent.email, "new@example.com")
        self.assertEqual(len(mail.outbox), 1)

    def test_inbound_reply_threads_via_in_reply_to_header(self):
        thread = create_inbound_from_contact_form(
            name="Customer", email="c@example.com", subject="Question", body="Hi"
        )
        outbound = send_reply(thread, "Reply body", self.staff)

        raw = PyEmailMessage()
        raw["From"] = "Customer <c@example.com>"
        raw["To"] = "info@al-diwan.ly"
        raw["Subject"] = "Re: Question"
        raw["Message-ID"] = "<followup@example.com>"
        raw["In-Reply-To"] = outbound.message_id
        raw.set_content("Thanks, following up.")
        msg = email.message_from_bytes(bytes(raw))

        imported = FetchInboundCommand()._import_message(msg)

        self.assertTrue(imported)
        self.assertEqual(thread.messages.count(), 3)
        thread.refresh_from_db()
        self.assertTrue(thread.is_unread)

    def test_inbound_own_sent_copy_is_ignored(self):
        thread = create_inbound_from_contact_form(
            name="Customer", email="c@example.com", subject="Question", body="Hi"
        )
        send_reply(thread, "Reply body", self.staff)

        raw = PyEmailMessage()
        raw["From"] = "info@al-diwan.ly"
        raw["To"] = "c@example.com"
        raw["Subject"] = "Question"
        raw["Message-ID"] = "<loopback@al-diwan.ly>"
        raw.set_content("copy of our own reply")
        msg = email.message_from_bytes(bytes(raw))

        imported = FetchInboundCommand()._import_message(msg)

        self.assertFalse(imported)
        self.assertEqual(thread.messages.count(), 2)

    def test_duplicate_message_id_is_not_reimported(self):
        thread = create_inbound_from_contact_form(
            name="Customer", email="c@example.com", subject="Question", body="Hi"
        )
        send_reply(thread, "Reply body", self.staff)

        raw = PyEmailMessage()
        raw["From"] = "Customer <c@example.com>"
        raw["To"] = "info@al-diwan.ly"
        raw["Subject"] = "Re: Question"
        raw["Message-ID"] = "<dup@example.com>"
        raw.set_content("First arrival")
        msg = email.message_from_bytes(bytes(raw))
        cmd = FetchInboundCommand()

        self.assertTrue(cmd._import_message(msg))
        self.assertFalse(cmd._import_message(msg))
        self.assertEqual(thread.messages.count(), 3)
