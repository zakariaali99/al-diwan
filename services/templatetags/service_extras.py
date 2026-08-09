from django import template

register = template.Library()

# Maps a service category to an icon in the SVG sprite (templates/partials/icons.html).
# Keyed on the ServiceCategory.icon field when set, otherwise inferred from the
# Arabic name so seeded data renders correctly without manual admin work.
ICON_BY_KEY = {
    "medical": "medical",
    "industrial": "industrial",
    "food": "food",
    "pre-manufacturing": "clipboard",
    "pre-shipment": "warehouse",
    "oil": "oil",
    "sampling": "flask",
    "during-shipment": "ship",
    "arrival": "arrival",
}

NAME_HINTS = [
    ("الطبي", "medical"),
    ("الصناعي", "industrial"),
    ("الأغذية", "food"),
    ("ما قبل التصنيع", "clipboard"),
    ("ما قبل الشحن", "warehouse"),
    ("الزيوت", "oil"),
    ("العينات", "flask"),
    ("أثناء", "ship"),
    ("الوصول", "arrival"),
]

DEFAULT_ICON = "clipboard"


@register.filter
def service_icon(category):
    """Resolve the sprite icon id for a ServiceCategory."""
    key = (getattr(category, "icon", "") or "").strip()
    if key in ICON_BY_KEY:
        return ICON_BY_KEY[key]
    if key in ICON_BY_KEY.values():
        return key

    name = category.safe_translation_getter("name", any_language=True) or ""
    for hint, icon in NAME_HINTS:
        if hint in name:
            return icon
    return DEFAULT_ICON


@register.filter
def get_item(mapping, key):
    """Dict lookup by variable key — Django templates can't do mapping[key]."""
    if hasattr(mapping, "get"):
        return mapping.get(key)
    return None


@register.filter
def split(value, separator=","):
    return [part for part in str(value).split(separator) if part]
