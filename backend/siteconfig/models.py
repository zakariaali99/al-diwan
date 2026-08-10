from django.db import models
from parler.models import TranslatableModel, TranslatedFields


class SiteSettings(TranslatableModel):
    """Singleton: global site info editable from Django Admin instead of
    living in template code. Access via SiteSettings.load()."""

    translations = TranslatedFields(
        tagline=models.CharField(max_length=255, blank=True),
    )

    phone = models.CharField(max_length=50, blank=True)
    whatsapp_url = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    map_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    x_url = models.URLField(blank=True)

    class Meta:
        verbose_name = "إعدادات الموقع"
        verbose_name_plural = "إعدادات الموقع"

    def __str__(self):
        return "إعدادات الموقع"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
