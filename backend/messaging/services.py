"""Outbound sending + thread-management logic for the unified inbox.

Kept as plain functions (not model methods) so both the dashboard views
(Phase 4) and the contact-form API endpoint can share the same paths.
"""

import uuid

from django.conf import settings
from django.core.mail import EmailMessage

from .models import Correspondent, Message, Thread


def _mail_domain() -> str:
    return settings.DEFAULT_FROM_EMAIL.split("@")[-1]


def _generate_message_id() -> str:
    return f"<{uuid.uuid4().hex}@{_mail_domain()}>"


def _last_inbound_message_id(thread: Thread) -> str:
    last_in = thread.messages.filter(direction=Message.Direction.INBOUND).order_by("-created_at").first()
    return last_in.message_id if last_in and last_in.message_id else ""


def send_reply(thread: Thread, body: str, sent_by) -> Message:
    """Staff reply to an existing thread: send real email, record it, and
    thread the headers so the correspondent's mail client (and our own
    inbound fetcher) can link the conversation."""
    message_id = _generate_message_id()
    in_reply_to = _last_inbound_message_id(thread)

    headers = {"Message-ID": message_id}
    if in_reply_to:
        headers["In-Reply-To"] = in_reply_to
        headers["References"] = in_reply_to

    email = EmailMessage(
        subject=thread.subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[thread.correspondent.email],
        headers=headers,
    )
    email.send(fail_silently=False)

    message = Message.objects.create(
        thread=thread,
        direction=Message.Direction.OUTBOUND,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to_email=thread.correspondent.email,
        body=body,
        message_id=message_id,
        in_reply_to=in_reply_to,
        sent_by=sent_by,
        is_read=True,
    )
    thread.status = Thread.Status.PENDING
    thread.is_unread = False
    thread.save(update_fields=["status", "is_unread", "updated_at"])
    return message


def start_thread(*, subject: str, body: str, to_email: str, sent_by, correspondent_name: str = "") -> Thread:
    """Staff-initiated outbound correspondence — the 'compose' side of the
    Gmail replacement, for reaching someone who hasn't written in yet."""
    correspondent, created = Correspondent.objects.get_or_create(
        email=to_email, defaults={"name": correspondent_name}
    )
    if not created and correspondent_name and not correspondent.name:
        correspondent.name = correspondent_name
        correspondent.save(update_fields=["name"])

    thread = Thread.objects.create(
        subject=subject, correspondent=correspondent, status=Thread.Status.PENDING, is_unread=False
    )
    send_reply(thread, body, sent_by)
    return thread


def create_inbound_from_contact_form(*, name: str, email: str, subject: str, body: str) -> Thread:
    """A public contact-form submission becomes a Thread directly — no
    round-trip through real email needed for the first message."""
    correspondent, created = Correspondent.objects.get_or_create(
        email=email, defaults={"name": name}
    )
    if not created and name and not correspondent.name:
        correspondent.name = name
        correspondent.save(update_fields=["name"])

    thread = Thread.objects.create(
        subject=subject or "رسالة من نموذج التواصل",
        correspondent=correspondent,
        status=Thread.Status.OPEN,
        is_unread=True,
    )
    Message.objects.create(
        thread=thread,
        direction=Message.Direction.INBOUND,
        from_email=email,
        to_email=settings.DEFAULT_FROM_EMAIL,
        body=body,
        is_read=False,
    )
    _notify_staff_of_new_thread(thread)
    return thread


def _notify_staff_of_new_thread(thread: Thread) -> None:
    notify_to = getattr(settings, "INBOX_NOTIFY_EMAILS", [])
    if not notify_to:
        return
    EmailMessage(
        subject=f"[الديوان] رسالة جديدة: {thread.subject}",
        body=f"وصلت رسالة جديدة من {thread.correspondent.email}.\n\nراجعها في لوحة التحكم.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=notify_to,
    ).send(fail_silently=True)
