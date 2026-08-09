from django import forms
from parler.forms import TranslatableModelForm

from posts.models import Post


class PostForm(TranslatableModelForm):
    class Meta:
        model = Post
        fields = [
            "title", "slug", "category", "featured_image",
            "excerpt", "body",
            "seo_title", "seo_description",
            "status", "published_at",
        ]
        widgets = {
            "published_at": forms.DateTimeInput(attrs={"type": "datetime-local"}),
        }


class ReplyForm(forms.Form):
    body = forms.CharField(label="الرد", widget=forms.Textarea(attrs={"rows": 6}))


class ComposeForm(forms.Form):
    to_name = forms.CharField(label="الاسم", required=False)
    to_email = forms.EmailField(label="البريد الإلكتروني")
    subject = forms.CharField(label="الموضوع")
    body = forms.CharField(label="الرسالة", widget=forms.Textarea(attrs={"rows": 6}))
