"""Seed DRAFT English translations for database-stored content.

These are working translations of the Arabic source so the /en/ site is usable
end to end. They are editable in Django Admin and should be reviewed by the
company before launch — particularly the quality policy, which restates ISO
commitments in the company's own official wording.
"""

from django.core.management.base import BaseCommand

from pages.models import ContentBlock, QualityPrinciple
from posts.models import Category
from services.models import ServiceCategory
from siteconfig.models import SiteSettings

CONTENT_BLOCKS = {
    "home_hero": ("", "We provide inspection and conformity services in line with the recognised "
                      "international rules governing this field."),
    "home_intro": (
        "A commitment to getting the work right",
        "At Al-Diwan Inspection & Conformity we believe in the power of precision, dedication and "
        "thoroughness. Our team works with real commitment to deliver results that meet the highest "
        "standards of accuracy and reliability. We understand how much it matters that every "
        "inspection and conformity check is carried out with full attention to detail. Our "
        "commitment to excellence pushes us past expectations — making sure the job is not only "
        "finished, but done right the first time.\n\n"
        "Trust Al-Diwan to get the job done efficiently and accurately, every time.",
    ),
    "vision": ("Our vision",
               "We aim to achieve customer satisfaction through high-quality service, accuracy in "
               "our work and delivery on time. We are committed to maintaining a distinguished "
               "level of service that fully meets our clients' needs and expectations."),
    "mission": ("Our mission",
                "Our goal is to deliver high-calibre services that redefine the concept and role of "
                "inspection companies, while contributing actively to the growth of the economic "
                "sector."),
    "goal": ("Our objective",
             "To deliver inspection, supervision and conformity services professionally across all "
             "industries, committed to internationally recognised standards in Libya. As a neutral "
             "entity, we serve our valued clients in line with the state's regulations and "
             "legislation on inspection and quality-control services."),
    "team_intro": (
        "A fully trained team",
        "Our comprehensive range of professional services meets the needs of a diverse client base, "
        "delivered by our excellent team of dedicated people.\n\n"
        "As a company we carry out inspections at production sites for all types of goods, cargo "
        "and products, whether inside Libya or abroad, during and after manufacturing. The company "
        "takes pride in providing exceptional services that let us handle a wide range of "
        "assignments quickly and with the utmost accuracy. Our team is made up of highly qualified "
        "inspectors and specialists with broad experience across many fields.",
    ),
    "quality_policy": (
        "Quality policy",
        "As an expert in inspection and conformity services, Al-Diwan Inspection & Conformity is "
        "committed to delivering high-quality services that meet its clients' needs and "
        "expectations, through a comprehensive management system compliant with the international "
        "standards ISO 9001:2015 and ISO/IEC 17020:2012.\n\n"
        "To achieve the company's service-quality objectives and ensure maximum client "
        "satisfaction, senior management has established the following core values and principles "
        "as a guiding framework for all activities, plans and development goals within the "
        "organisation:",
    ),
    "about_intro": (
        "About us",
        "Al-Diwan Inspection & Conformity is an independent company based in Misrata, Libya, "
        "specialising in inspection and conformity services under international regulations. We "
        "operate as a neutral third party, focused on quality-control and industrial-inspection "
        "services. Our primary goal is to deliver the highest-quality inspection services, drawing "
        "on the latest techniques and our extensive experience.",
    ),
    "about_services_intro": (
        "Our services",
        "We provide comprehensive inspection services at every level, locally and globally, "
        "covering most countries in the world. Our inspections span a wide range of products, "
        "ensuring compliance with quality-management standards (ISO 9001) and inspection-body "
        "standards (ISO 17020).",
    ),
    "about_closing": (
        "",
        "Al-Diwan Inspection & Conformity works continuously to grow its distinguished network of "
        "relationships, surrounding itself with an increasing number of effective teams.\n\n"
        "Our work rests on a staff of skilled engineers and technical specialists, all of whom "
        "share the same qualities: experience, lasting enthusiasm and self-motivation — making "
        "excellence and leadership in the market their first objective.",
    ),
}

QUALITY_PRINCIPLES = [
    "A goal-focused approach across all company operations.",
    "A commitment to excellence with complete integrity and independence.",
    "Compliance with professional, legal and regulatory requirements.",
    "Compliance with quality-management system requirements based on the international standard ISO 9001:2015.",
    "Compliance with inspection-body requirements based on the international standard ISO/IEC 17020:2012.",
]

SERVICE_CATEGORIES = {
    "خدمات الفحص الطبي": ("Medical inspection services", [
        "Medicines and pharmaceutical preparations",
        "Pharmaceutical preparations",
        "Sera and vaccines",
        "Medical materials",
    ]),
    "خدمات التفتيش الصناعي": ("Industrial inspection services", [
        "Materials of all kinds (metals, ores and precious metals), factory components and equipment "
        "for water desalination and purification plants, and power generation, transmission and "
        "distribution stations",
        "All types of machinery and spare parts, heavy and light industrial equipment, and cranes",
        "Electrical and electronic equipment, and communication and navigation systems",
        "Medical devices and equipment for outfitting hospitals and clinics",
        "Cargo ships, fishing rigs and marine spare parts",
        "And much more",
    ]),
    "خدمات فحص الأغذية": ("Food inspection services", [
        "Grains and seeds",
        "Flour and animal feed",
        "Rice, fruit, vegetables and legumes",
        "Seed potatoes and tree seedlings",
        "Edible oils, tomato paste, concentrates and juices",
        "Sugar, coffee, cocoa and tea",
        "Nuts and dairy products",
        "Baby food, meat and fish",
        "Canned, frozen and dried foods",
        "Yeast",
    ]),
    "فحص ما قبل التصنيع": ("Pre-manufacturing inspection", [
        "Visual inspection of raw materials",
        "Random sampling and preliminary testing",
        "Review of certificates and accompanying documents to confirm they match the required specifications",
        "Issuing approval reports for raw materials entering production",
    ]),
    "فحص ما قبل الشحن": ("Pre-shipment inspection", [
        "Inspecting storage facilities to confirm they are suitable",
        "Inspecting factory buildings and machinery",
        "Assessing quality-control systems",
        "Hygiene and sanitation checks",
        "Inspecting manufacturing processes",
    ]),
    "خدمات فحص الزيوت": ("Oil inspection services", [
        "Crude oil and its derivatives",
        "Gaseous, liquid and solid petroleum products",
    ]),
    "خدمات أخذ العينات والاختبار": ("Sampling and testing services", [
        "Sampling at factories, warehouses and transport facilities",
        "Carrying out tests and validation",
    ]),
    "أثناء فحص الشحنة": ("Inspection during shipment", [
        "Initial inspection of the means of transport",
        "Confirming there are no leaks or defects",
        "Verifying transport markings and numbers",
        "Visual inspection of the consignment",
        "Supervising loading and unloading — checking transport conditions",
    ]),
    "التفتيش عند الوصول": ("Inspection on arrival", [
        "Sampling and testing on arrival",
        "Monitoring the consignment through to final delivery",
        "Quality assurance and assessment of environmental factors such as heat",
        "Photographic assessment of the consignment",
    ]),
}


class Command(BaseCommand):
    help = "Seed draft English translations for site content (review before launch)."

    def handle(self, *args, **options):
        settings_obj = SiteSettings.load()
        settings_obj.set_current_language("en")
        settings_obj.tagline = "Al-Diwan Inspection & Conformity"
        settings_obj.save()

        for slug, (title, body) in CONTENT_BLOCKS.items():
            block = ContentBlock.objects.filter(slug=slug).first()
            if not block:
                continue
            block.set_current_language("en")
            block.title = title
            block.body = body
            block.save()
        self.stdout.write(self.style.SUCCESS(f"Translated {len(CONTENT_BLOCKS)} content blocks"))

        for principle, text in zip(QualityPrinciple.objects.order_by("order"), QUALITY_PRINCIPLES):
            principle.set_current_language("en")
            principle.text = text
            principle.save()
        self.stdout.write(self.style.SUCCESS("Translated quality principles"))

        translated = 0
        for category in ServiceCategory.objects.all():
            arabic_name = category.safe_translation_getter("name", language_code="ar", any_language=True)
            entry = SERVICE_CATEGORIES.get(arabic_name)
            if not entry:
                continue
            english_name, item_texts = entry
            category.set_current_language("en")
            category.name = english_name
            category.save()

            for item, text in zip(category.items.order_by("order"), item_texts):
                item.set_current_language("en")
                item.text = text
                item.save()
            translated += 1
        self.stdout.write(self.style.SUCCESS(f"Translated {translated} service categories"))

        default_category = Category.objects.first()
        if default_category:
            default_category.set_current_language("en")
            default_category.name = "General"
            default_category.slug = "general"
            default_category.save()

        self.stdout.write(self.style.WARNING(
            "Draft translations — have the company review them in /admin/ before launch."
        ))
