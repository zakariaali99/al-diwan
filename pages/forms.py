from django import forms
from django.utils.translation import gettext_lazy as _


class ContactForm(forms.Form):
    """Public contact form. Submissions become Threads in the unified inbox
    (see messaging.services.create_inbound_from_contact_form)."""

    name = forms.CharField(
        label=_("الاسم"),
        max_length=255,
        widget=forms.TextInput(attrs={"autocomplete": "name", "placeholder": _("اسمك الكامل")}),
    )
    email = forms.EmailField(
        label=_("البريد الإلكتروني"),
        widget=forms.EmailInput(attrs={"autocomplete": "email", "placeholder": "name@company.com", "dir": "ltr"}),
    )
    subject = forms.CharField(
        label=_("الموضوع"),
        max_length=255,
        required=False,
        widget=forms.TextInput(attrs={"placeholder": _("مثال: طلب عرض سعر لفحص شحنة")}),
    )
    message = forms.CharField(
        label=_("رسالتك"),
        widget=forms.Textarea(attrs={"rows": 6, "placeholder": _("اشرح لنا احتياجك بإيجاز…")}),
    )
    # Bots fill every field they find; humans never see this one.
    website = forms.CharField(required=False, widget=forms.TextInput(attrs={"tabindex": "-1", "autocomplete": "off"}))

    def clean_website(self):
        if self.cleaned_data.get("website"):
            raise forms.ValidationError("spam detected")
        return ""
