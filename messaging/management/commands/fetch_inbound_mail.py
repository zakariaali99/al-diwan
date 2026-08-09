"""Poll an IMAP mailbox for new mail and fold it into the unified inbox.

Run on a schedule (cPanel Cron Job, every few minutes — see the Phase 6
deployment runbook). Deliberately IMAP-polling rather than an inbound
webhook: needs no MX/DNS changes, so it can't disrupt whatever mail flow
already exists on the domain.
"""

import email
import imaplib
from email.header import decode_header
from email.utils import getaddresses

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils.html import strip_tags

from messaging.models import Attachment, Correspondent, Message, Thread

REPLY_PREFIXES = ("re:", "rd:", "رد:", "رد :")


def _decode(value: str) -> str:
    if not value:
        return ""
    parts = decode_header(value)
    decoded = ""
    for text, charset in parts:
        if isinstance(text, bytes):
            decoded += text.decode(charset or "utf-8", errors="replace")
        else:
            decoded += text
    return decoded


def _normalize_subject(subject: str) -> str:
    s = subject.strip()
    lowered = s.lower()
    changed = True
    while changed:
        changed = False
        for prefix in REPLY_PREFIXES:
            if lowered.startswith(prefix):
                s = s[len(prefix):].strip()
                lowered = s.lower()
                changed = True
    return s


def _extract_body(msg: email.message.Message) -> str:
    if msg.is_multipart():
        plain, html = "", ""
        for part in msg.walk():
            disposition = str(part.get("Content-Disposition", ""))
            if "attachment" in disposition:
                continue
            content_type = part.get_content_type()
            if content_type == "text/plain" and not plain:
                plain = part.get_payload(decode=True).decode(
                    part.get_content_charset() or "utf-8", errors="replace"
                )
            elif content_type == "text/html" and not html:
                html = part.get_payload(decode=True).decode(
                    part.get_content_charset() or "utf-8", errors="replace"
                )
        return plain or strip_tags(html)

    payload = msg.get_payload(decode=True) or b""
    text = payload.decode(msg.get_content_charset() or "utf-8", errors="replace")
    if msg.get_content_type() == "text/html":
        return strip_tags(text)
    return text


def _extract_attachments(msg: email.message.Message):
    if not msg.is_multipart():
        return []
    found = []
    for part in msg.walk():
        disposition = str(part.get("Content-Disposition", ""))
        if "attachment" not in disposition:
            continue
        filename = part.get_filename()
        payload = part.get_payload(decode=True)
        if filename and payload:
            found.append((_decode(filename), part.get_content_type(), payload))
    return found


class Command(BaseCommand):
    help = "Fetch unseen IMAP mail and import it into the unified inbox as Thread/Message rows."

    def handle(self, *args, **options):
        if not settings.IMAP_HOST:
            self.stdout.write(self.style.WARNING("IMAP_HOST not configured — skipping."))
            return

        conn = imaplib.IMAP4_SSL(settings.IMAP_HOST, settings.IMAP_PORT)
        try:
            conn.login(settings.IMAP_USER, settings.IMAP_PASSWORD)
            conn.select(settings.IMAP_MAILBOX)

            status, data = conn.search(None, "UNSEEN")
            if status != "OK":
                self.stdout.write(self.style.ERROR(f"IMAP search failed: {status}"))
                return

            uids = data[0].split()
            imported = 0
            for uid in uids:
                status, msg_data = conn.fetch(uid, "(RFC822)")
                if status != "OK" or not msg_data or not msg_data[0]:
                    continue
                raw = msg_data[0][1]
                msg = email.message_from_bytes(raw)
                if self._import_message(msg):
                    imported += 1

            self.stdout.write(self.style.SUCCESS(f"Imported {imported}/{len(uids)} message(s)."))
        finally:
            try:
                conn.logout()
            except Exception:
                pass

    def _import_message(self, msg: email.message.Message) -> bool:
        addresses = getaddresses([msg.get("From", "")])
        if not addresses:
            return False
        from_name, from_email = addresses[0]
        from_email = from_email.lower().strip()

        if not from_email or from_email == settings.DEFAULT_FROM_EMAIL.lower():
            return False  # our own sent copy landing back in the mailbox

        message_id = (msg.get("Message-ID") or "").strip()
        if message_id and Message.objects.filter(message_id=message_id).exists():
            return False  # already imported

        subject = _decode(msg.get("Subject", ""))
        references = (msg.get("References", "") + " " + msg.get("In-Reply-To", "")).split()

        thread = self._find_thread(from_email, subject, references)
        if thread is None:
            correspondent, created = Correspondent.objects.get_or_create(
                email=from_email, defaults={"name": _decode(from_name)}
            )
            if not created and from_name and not correspondent.name:
                correspondent.name = _decode(from_name)
                correspondent.save(update_fields=["name"])
            thread = Thread.objects.create(
                subject=_normalize_subject(subject) or "(بلا عنوان)",
                correspondent=correspondent,
                status=Thread.Status.OPEN,
                is_unread=True,
            )
        else:
            thread.is_unread = True
            thread.status = Thread.Status.OPEN
            thread.save(update_fields=["is_unread", "status", "updated_at"])

        message = Message.objects.create(
            thread=thread,
            direction=Message.Direction.INBOUND,
            from_email=from_email,
            to_email=settings.DEFAULT_FROM_EMAIL,
            body=_extract_body(msg),
            message_id=message_id,
            in_reply_to=(msg.get("In-Reply-To") or "").strip(),
            is_read=False,
        )

        for filename, content_type, payload in _extract_attachments(msg):
            attachment = Attachment(message=message, filename=filename, content_type=content_type)
            attachment.file.save(filename, ContentFile(payload), save=False)
            attachment.save()

        return True

    def _find_thread(self, from_email: str, subject: str, references: list[str]):
        if references:
            match = (
                Message.objects.filter(message_id__in=references)
                .select_related("thread")
                .order_by("-created_at")
                .first()
            )
            if match:
                return match.thread

        normalized = _normalize_subject(subject)
        if normalized:
            return (
                Thread.objects.filter(correspondent__email=from_email, subject=normalized)
                .order_by("-updated_at")
                .first()
            )
        return None
