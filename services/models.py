from django.db import models
from parler.models import TranslatableModel, TranslatedFields


class ServiceCategory(TranslatableModel):
    """A service grouping, e.g. "خدمات الفحص الطبي" — one card in the
    public services bento grid."""

    translations = TranslatedFields(
        name=models.CharField(max_length=255),
        slug=models.SlugField(max_length=255, blank=True, allow_unicode=True),
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="اسم الأيقونة المستخدمة في الواجهة (يُحدد لاحقًا مع التصميم)",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "فئة خدمة"
        verbose_name_plural = "فئات الخدمات"
        ordering = ["order"]

    def __str__(self):
        return self.safe_translation_getter("name", any_language=True) or f"Category {self.pk}"


class ServiceItem(TranslatableModel):
    """One bullet under a ServiceCategory."""

    category = models.ForeignKey(
        ServiceCategory, on_delete=models.CASCADE, related_name="items"
    )
    translations = TranslatedFields(
        text=models.CharField(max_length=500),
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "عنصر خدمة"
        verbose_name_plural = "عناصر الخدمات"
        ordering = ["category__order", "order"]

    def __str__(self):
        return self.safe_translation_getter("text", any_language=True) or f"Item {self.pk}"
