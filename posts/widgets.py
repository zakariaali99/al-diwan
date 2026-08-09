from django import forms


class RichTextWidget(forms.Textarea):
    """A Quill-backed editor over a plain textarea.

    The model field stays a plain TextField holding HTML — the editor is only a
    widget. That decoupling is the point: swapping editors later is a widget
    change, not a data migration. (The project previously used django-ckeditor,
    whose bundled CKEditor 4 is end-of-life with unfixed security issues.)

    Progressive enhancement: with JavaScript off, the textarea still works and
    still submits, so a post is never uneditable.
    """

    class Media:
        css = {"all": ("vendor/quill/quill.snow.css", "css/richtext.css")}
        js = ("vendor/quill/quill.js", "js/richtext.js")

    def __init__(self, attrs=None):
        defaults = {"rows": 16, "data-richtext": "true"}
        if attrs:
            defaults.update(attrs)
        super().__init__(defaults)
