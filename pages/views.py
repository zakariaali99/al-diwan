from django.contrib import messages as flash
from django.shortcuts import redirect, render
from django.utils.translation import gettext as _

from messaging.services import create_inbound_from_contact_form
from posts.models import Post
from services.models import ServiceCategory

from .forms import ContactForm
from .models import ContentBlock, QualityPrinciple


def get_blocks(*slugs):
    """Fetch content blocks by slug into a dict for template use. Missing
    slugs simply resolve to None so a page never 500s on unseeded content."""
    blocks = {b.slug: b for b in ContentBlock.objects.filter(slug__in=slugs)}
    return {slug: blocks.get(slug) for slug in slugs}


# Categories that describe the shipment lifecycle rather than a commodity —
# these render as the process timeline instead of bento cards.
PROCESS_ORDER = [
    "فحص ما قبل التصنيع",
    "فحص ما قبل الشحن",
    "أثناء فحص الشحنة",
    "التفتيش عند الوصول",
]


def _split_categories():
    categories = list(ServiceCategory.objects.prefetch_related("items"))
    process, commodity = [], []
    for category in categories:
        name = category.safe_translation_getter("name", any_language=True) or ""
        (process if name in PROCESS_ORDER else commodity).append(category)
    process.sort(key=lambda c: PROCESS_ORDER.index(
        c.safe_translation_getter("name", any_language=True)
    ))
    return commodity, process


def home(request):
    commodity, process = _split_categories()
    return render(request, "pages/home.html", {
        "blocks": get_blocks(
            "home_hero", "home_intro", "vision", "mission", "goal",
            "team_intro", "quality_policy",
        ),
        "principles": QualityPrinciple.objects.all(),
        "commodity_categories": commodity,
        "process_categories": process,
        "latest_posts": Post.objects.filter(status=Post.Status.PUBLISHED)[:3],
    })


def about(request):
    return render(request, "pages/about.html", {
        "blocks": get_blocks(
            "about_intro", "about_closing", "vision", "mission", "goal",
            "team_intro", "quality_policy",
        ),
        "principles": QualityPrinciple.objects.all(),
    })


def services(request):
    commodity, process = _split_categories()
    return render(request, "pages/services.html", {
        "blocks": get_blocks("about_services_intro"),
        "commodity_categories": commodity,
        "process_categories": process,
    })


def contact(request):
    if request.method == "POST":
        form = ContactForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            create_inbound_from_contact_form(
                name=data["name"],
                email=data["email"],
                subject=data["subject"],
                body=data["message"],
            )
            flash.success(request, _("تم استلام رسالتك. سنتواصل معك قريبًا."))
            # Redirect after POST so a refresh doesn't resubmit the message.
            return redirect("pages:contact")
    else:
        form = ContactForm()

    return render(request, "pages/contact.html", {"form": form})
