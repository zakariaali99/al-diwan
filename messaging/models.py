from django.conf import settings
from django.db import models


class Correspondent(models.Model):
    """An external person/organization the company corresponds with."""

    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "جهة تواصل"
        verbose_name_plural = "جهات التواصل"
        ordering = ["name", "email"]

    def __str__(self):
        return self.name or self.email


class Thread(models.Model):
    """A conversation with one correspondent — the inbox's unit of work."""

    class Status(models.TextChoices):
        OPEN = "open", "مفتوحة"
        PENDING = "pending", "بانتظار الرد"
        CLOSED = "closed", "مغلقة"

    subject = models.CharField(max_length=255)
    correspondent = models.ForeignKey(
        Correspondent, on_delete=models.CASCADE, related_name="threads"
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_threads",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    is_unread = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "محادثة"
        verbose_name_plural = "المحادثات"
        ordering = ["-updated_at"]

    def __str__(self):
        return self.subject


class Message(models.Model):
    """A single email in/out of a Thread."""

    class Direction(models.TextChoices):
        INBOUND = "in", "وارد"
        OUTBOUND = "out", "صادر"

    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name="messages")
    direction = models.CharField(max_length=3, choices=Direction.choices)
    from_email = models.EmailField()
    to_email = models.EmailField()
    body = models.TextField()
    message_id = models.CharField(max_length=255, blank=True, unique=False, db_index=True)
    in_reply_to = models.CharField(max_length=255, blank=True, db_index=True)
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_messages",
        help_text="Staff member who sent this (blank for inbound mail)",
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "رسالة"
        verbose_name_plural = "الرسائل"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.get_direction_display()}: {self.thread.subject}"


class Attachment(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="message_attachments/")
    filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = "مرفق"
        verbose_name_plural = "المرفقات"

    def __str__(self):
        return self.filename
