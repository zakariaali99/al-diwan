from ckeditor.fields import RichTextField
from django.conf import settings
from django.db import models
from django.utils import timezone
from parler.models import TranslatableModel, TranslatedFields


class Category(TranslatableModel):
    translations = TranslatedFields(
        name=models.CharField(max_length=100),
        slug=models.SlugField(max_length=100, blank=True),
    )

    class Meta:
        verbose_name = "تصنيف"
        verbose_name_plural = "التصنيفات"

    def __str__(self):
        return self.safe_translation_getter("name", any_language=True) or f"Category {self.pk}"


class Post(TranslatableModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "مسودة"
        SCHEDULED = "scheduled", "مجدول"
        PUBLISHED = "published", "منشور"

    translations = TranslatedFields(
        title=models.CharField(max_length=255),
        slug=models.SlugField(max_length=255, blank=True),
        excerpt=models.CharField(max_length=500, blank=True),
        body=RichTextField(blank=True),
        seo_title=models.CharField(max_length=255, blank=True),
        seo_description=models.CharField(max_length=300, blank=True),
    )

    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="posts"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="posts"
    )
    featured_image = models.ImageField(upload_to="posts/", blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "منشور"
        verbose_name_plural = "المنشورات"
        ordering = ["-published_at", "-created_at"]

    def __str__(self):
        return self.safe_translation_getter("title", any_language=True) or f"Post {self.pk}"

    def save(self, *args, **kwargs):
        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def publish(self):
        self.status = self.Status.PUBLISHED
        self.save()

    @property
    def is_published(self):
        return self.status == self.Status.PUBLISHED and (
            self.published_at is None or self.published_at <= timezone.now()
        )
