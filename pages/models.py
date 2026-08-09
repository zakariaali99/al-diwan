from django.db import models
from parler.models import TranslatableModel, TranslatedFields


class ContentBlock(TranslatableModel):
    """A single editable piece of copy identified by a fixed slug the
    templates reference (e.g. "home_hero", "vision", "quality_policy").
    Lets staff edit site copy from Django Admin without a deploy."""

    slug = models.SlugField(
        max_length=64,
        unique=True,
        help_text="مفتاح ثابت يستخدمه القالب، مثال: home_hero",
    )
    translations = TranslatedFields(
        title=models.CharField(max_length=255, blank=True),
        body=models.TextField(blank=True),
    )

    class Meta:
        verbose_name = "قسم محتوى"
        verbose_name_plural = "أقسام المحتوى"
        ordering = ["slug"]

    def __str__(self):
        return self.slug


class QualityPrinciple(TranslatableModel):
    """One bullet in the Quality Policy principles list (home page)."""

    translations = TranslatedFields(
        text=models.CharField(max_length=500),
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "مبدأ من مبادئ الجودة"
        verbose_name_plural = "مبادئ الجودة"
        ordering = ["order"]

    def __str__(self):
        return self.safe_translation_getter("text", any_language=True) or f"Principle {self.pk}"
