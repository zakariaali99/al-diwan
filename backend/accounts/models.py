from django.conf import settings
from django.db import models

# Every dashboard ability is one Django permission on StaffProfile, assigned
# straight to the user. Roles are only presets that tick a set of these boxes,
# so any account can be widened or narrowed one capability at a time.
CAPABILITIES = [
    ("view_posts", "عرض المنشورات"),
    ("manage_posts", "إنشاء وتعديل المنشورات والتصنيفات"),
    ("publish_posts", "نشر المنشورات وجدولتها"),
    ("delete_posts", "حذف المنشورات"),
    ("view_comments", "قراءة التعليقات"),
    ("moderate_comments", "إخفاء التعليقات وحذفها"),
    ("view_messages", "قراءة الرسائل"),
    ("reply_messages", "الرد على الرسائل وإدارتها"),
    ("manage_services", "إدارة الخدمات"),
    ("manage_content", "إدارة محتوى الموقع وإعداداته"),
    ("manage_staff", "إدارة الموظفين وصلاحياتهم"),
]
CAPABILITY_CODES = [code for code, _ in CAPABILITIES]

# A capability that is useless without another one pulls it in.
IMPLIES = {
    "manage_posts": ["view_posts"],
    "publish_posts": ["manage_posts", "view_posts"],
    "delete_posts": ["view_posts"],
    "moderate_comments": ["view_comments"],
    "view_comments": ["view_posts"],
    "reply_messages": ["view_messages"],
}

ROLES = {
    "admin": CAPABILITY_CODES,
    "editor": ["view_posts", "manage_posts", "publish_posts", "delete_posts", "view_comments", "moderate_comments"],
    "writer": ["view_posts", "manage_posts"],
    "moderator": ["view_posts", "view_comments", "moderate_comments"],
    "support": ["view_messages", "reply_messages"],
    "content_manager": ["manage_services", "manage_content"],
}
CUSTOM_ROLE = "custom"


def normalize_capabilities(codes):
    """Drops unknown codes and adds whatever the remaining ones imply."""
    result = {code for code in codes if code in CAPABILITY_CODES}
    pending = list(result)
    while pending:
        for implied in IMPLIES.get(pending.pop(), []):
            if implied not in result:
                result.add(implied)
                pending.append(implied)
    return [code for code in CAPABILITY_CODES if code in result]


def role_for(codes):
    """The preset that matches a capability set exactly, else "custom"."""
    chosen = set(codes)
    for role, preset in ROLES.items():
        if set(preset) == chosen:
            return role
    return CUSTOM_ROLE


class StaffProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_profile"
    )
    role = models.CharField(max_length=32, blank=True)

    class Meta:
        verbose_name = "ملف موظف"
        verbose_name_plural = "ملفات الموظفين"
        default_permissions = ()
        permissions = CAPABILITIES

    def __str__(self):
        return f"{self.user} ({self.role or CUSTOM_ROLE})"
