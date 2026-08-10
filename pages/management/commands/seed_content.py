from django.core.management.base import BaseCommand
from django.utils import timezone

from messaging.models import Correspondent
from pages.models import ContentBlock, QualityPrinciple
from posts.models import Category, Post
from services.models import ServiceCategory, ServiceItem
from siteconfig.models import SiteSettings

# Arabic copy verbatim from al-diwan-site-content.md (the current live site).
# English fields are intentionally left blank — real translation should come
# from the client, not be invented here; staff fill it in via /admin/.

CONTENT_BLOCKS = [
    ("home_hero", "", "نحن نقدم خدمات التفتيش والمطابقة وفقًا للقواعد الدولية المعتمدة في هذا الشأن."),
    (
        "home_intro",
        "الشغف بإنجاز العمل على أكمل وجه",
        "في شركة الديوان للتفتيش والمطابقة، نؤمن بقوة الدقة والتفاني والشمول. يعمل فريقنا بشغف لتقديم "
        "نتائج تلبي أعلى معايير الدقة والموثوقية. نحن ندرك أهمية ضمان تنفيذ كل عملية تفتيش ومطابقة بأقصى "
        "قدر من الاهتمام بالتفاصيل. يدفعنا التزامنا بالتميز إلى تجاوز التوقعات، وضمان عدم اكتمال المهمة "
        "فحسب، بل القيام بها بشكل صحيح في المرة الأولى.\n\n"
        "ثق في شركة الديوان لإنجاز المهمة بكفاءة ودقة في كل مرة.",
    ),
    (
        "vision",
        "رؤيتنا:",
        "نهدف إلى تحقيق رضا العملاء من خلال الخدمة عالية الجودة والدقة في العمل والتسليم في الوقت المحدد. "
        "نحن ملتزمون بالحفاظ على مستوى متميز من الخدمة يلبي احتياجات وتوقعات عملائنا بشكل كامل.",
    ),
    (
        "mission",
        "مهمتنا:",
        "هدفنا هو تقديم خدمات رفيعة المستوى تعمل على إعادة تعريف مفهوم ودور شركات التفتيش، مع المساهمة "
        "بشكل فعال في نمو القطاع الاقتصادي.",
    ),
    (
        "goal",
        "هدفنا:",
        "تقديم خدمات التفتيش والرقابة والمطابقة باحترافية في كافة الصناعات، مع الالتزام بالمعايير المعترف "
        "بها دوليًا في ليبيا. وباعتبارنا كيانًا محايدًا، فإننا ملتزمون بخدمة عملائنا الكرام بما يتماشى مع "
        "لوائح وتشريعات الدولة بشأن خدمات التفتيش ومراقبة الجودة.",
    ),
    (
        "team_intro",
        "فريق مدرب بالكامل",
        "تلبي مجموعتنا الشاملة من الخدمات المهنية احتياجات مجموعة متنوعة من العملاء، من خلال فريقنا الرائع "
        "من العمال الجادين\n\n"
        "بصفتنا شركة، نقوم بعمليات التفتيش في مواقع الإنتاج المختلفة لجميع أنواع السلع والبضائع والمنتجات، "
        "سواء داخل ليبيا أو خارجها، أثناء التصنيع وبعده. تفتخر الشركة بتقديم خدمات استثنائية تسمح لنا "
        "بالتعامل مع مجموعة واسعة من المهام بسرعة وبأقصى قدر من الدقة. يتكون فريقنا من مفتشين مؤهلين "
        "تأهيلاً عالياً ومتخصصين يتمتعون بخبرة واسعة في مجالات متنوعة.",
    ),
    (
        "quality_policy",
        "سياسة الجودة:",
        "تلتزم شركة الديوان للتفتيش والمطابقة، باعتبارها خبيرة في خدمات التفتيش والمطابقة، بتقديم خدمات "
        "عالية الجودة تلبي احتياجات وتوقعات عملائها، وذلك من خلال نظام إداري شامل يلتزم بالمعايير الدولية "
        "ISO9001:2015 و ISO/IEC17020:2012.\n\n"
        "لتحقيق أهداف جودة خدمة الشركة وضمان أقصى قدر من رضا العملاء، وضعت الإدارة العليا القيم والمبادئ "
        "الأساسية التالية كإطار توجيهي لجميع الأنشطة والخطط وأهداف التطوير داخل المنظمة:",
    ),
    (
        "about_intro",
        "من نحن",
        "شركة الديوان للتفتيش والمطابقة هي شركة مستقلة مقرها مصراتة، ليبيا، متخصصة في تقديم خدمات التفتيش "
        "والمطابقة وفقًا للأنظمة الدولية. نعمل كطرف ثالث محايد، ونركز على خدمات مراقبة الجودة والتفتيش "
        "الصناعي. هدفنا الرئيسي هو تقديم خدمات تفتيش بأعلى جودة، مستفيدين من أحدث التقنيات وخبرتنا الواسعة.",
    ),
    (
        "about_services_intro",
        "خدماتنا",
        "نقدم خدمات تفتيش شاملة على جميع المستويات، محليًا وعالميًا، ونغطي معظم دول العالم. تشمل عمليات "
        "التفتيش لدينا مجموعة واسعة من المنتجات، مما يضمن الالتزام بمعايير إدارة الجودة وفقًا للمعايير "
        "الدولية (ISO 9001) ومعايير هيئات التفتيش (ISO 17020).",
    ),
    (
        "about_closing",
        "",
        "تحرص شركة الديوان للتفتيش والمطابقة على تنمية شبكة علاقاتها المتميزة، وتحيط نفسها بعدد متزايد من "
        "فرق العمل الفعالة.\n\n"
        "نعتمد في عملنا على طاقم عمل مكون من مجموعة من المهندسين المهرة والمتخصصين الفنيين، يتمتع جميعهم "
        "بالصفات التالية: الخبرة، والحماس الدائم، والدافع الذاتي، ويجعلون هدفهم الأول هو تحقيق التميز "
        "والريادة في سوق العمل.",
    ),
]

QUALITY_PRINCIPLES = [
    "نهج يركز على الهدف في جميع عمليات الشركة.",
    "الالتزام بالتميز مع النزاهة والاستقلال التام.",
    "الالتزام بالمتطلبات المهنية والقانونية والتنظيمية.",
    "الالتزام بمتطلبات نظام إدارة الجودة بناء على المعايير الدولية (ISO 9001:2015).",
    "الالتزام بمتطلبات هيئة التفتيش بناء على المعايير الدولية (ISO/IEC 17020:2012).",
]

SERVICE_CATEGORIES = [
    ("خدمات الفحص الطبي", [
        "الأدوية والمستحضرات الصيدلانية",
        "المستحضرات الصيدلانية",
        "الأمصال واللقاحات",
        "المواد الطبية",
    ]),
    ("خدمات التفتيش الصناعي", [
        "المواد بأنواعها (المعادن، الخامات والمعادن الثمينة)، مكونات المصانع ومعدات محطات تحلية وتنقية "
        "المياه، محطات توليد ونقل وتوزيع الطاقة",
        "جميع أنواع الآلات وقطع الغيار، المعدات الصناعية الثقيلة والخفيفة، والرافعات",
        "المعدات الكهربائية والإلكترونية، وأنظمة الاتصالات والملاحة",
        "الأجهزة والمعدات الطبية المتعلقة بتجهيز المستشفيات والعيادات",
        "سفن الشحن، حفارات الصيد، وقطع الغيار البحرية",
        "وغيرها الكثير",
    ]),
    ("خدمات فحص الأغذية", [
        "الحبوب والبذور",
        "الدقيق والأعلاف الحيوانية",
        "الأرز، الفواكه، الخضراوات، البقوليات",
        "بذور البطاطس وشتلات الأشجار",
        "زيوت الطعام، معجون الطماطم، المركزات، والعصائر",
        "السكر، القهوة، الكاكاو، والشاي",
        "المكسرات ومنتجات الألبان",
        "أغذية الأطفال، اللحوم، الأسماك",
        "الأطعمة المعلبة والمجمدة والمجففة",
        "الخميرة",
    ]),
    ("فحص ما قبل التصنيع", [
        "الفحص البصري للمواد الخام",
        "أخذ عينات عشوائية واختبارات أولية",
        "مراجعة الشهادات والوثائق المرفقة لضمان مطابقتها للمواصفات المطلوبة",
        "إصدار تقارير الموافقة على المواد الخام للإنتاج",
    ]),
    ("فحص ما قبل الشحن", [
        "فحص مرافق التخزين للتأكد من ملاءمتها",
        "فحص مباني وآلات المصانع",
        "تقييم أنظمة مراقبة الجودة",
        "فحوصات النظافة الصحية",
        "فحص عمليات التصنيع",
    ]),
    ("خدمات فحص الزيوت", [
        "النفط الخام ومشتقاته",
        "منتجات بترولية غازية، سائلة، وصلبة",
    ]),
    ("خدمات أخذ العينات والاختبار", [
        "أخذ العينات من المصانع والمستودعات ومرافق النقل",
        "إجراء الاختبارات والتحقق من الصحة",
    ]),
    ("أثناء فحص الشحنة", [
        "الفحص الأولي لوسائل النقل",
        "التأكد من عدم وجود تسريبات أو عيوب",
        "التحقق من علامات وأرقام النقل",
        "الكشف البصري على الشحنة",
        "الإشراف على عمليات التحميل والتفريغ – فحص ظروف النقل",
    ]),
    ("التفتيش عند الوصول", [
        "أخذ العينات والاختبار عند الوصول",
        "مراقبة سير الشحنة حتى التسليم النهائي",
        "ضمان الجودة وتقييم تأثير العوامل البيئية كالحرارة",
        "التقييم الفوتوغرافي للشحنة",
    ]),
]

# A stable, language-independent key per category, stored in ServiceCategory.icon.
# The frontend uses it to pick an icon and to tell commodity sectors apart from
# shipment-lifecycle stages. It has to be language-independent: the category
# *name* arrives translated, so matching on it only ever worked in Arabic and
# English. Keyed here by the Arabic name, which is the canonical source record.
CATEGORY_KEYS = {
    "خدمات الفحص الطبي": "medical",
    "خدمات التفتيش الصناعي": "industrial",
    "خدمات فحص الأغذية": "food",
    "فحص ما قبل التصنيع": "pre-manufacturing",
    "فحص ما قبل الشحن": "pre-shipment",
    "خدمات فحص الزيوت": "oil",
    "خدمات أخذ العينات والاختبار": "sampling",
    "أثناء فحص الشحنة": "during-shipment",
    "التفتيش عند الوصول": "on-arrival",
}


class Command(BaseCommand):
    help = "Seed the database with the current al-diwan.ly site content (Arabic)."

    def handle(self, *args, **options):
        settings_obj = SiteSettings.load()
        settings_obj.set_current_language("ar")
        settings_obj.tagline = "شركة الديوان للتفتيش والمطابقة"
        settings_obj.phone = "+218917006622"
        settings_obj.whatsapp_url = "https://wa.me/218917006622"
        settings_obj.email = "info@al-diwan.ly"
        settings_obj.address = "Igzir, alabya st"
        settings_obj.map_url = "https://maps.app.goo.gl/njtp6AEzZwBCD93d7"
        settings_obj.facebook_url = (
            "https://www.facebook.com/profile.php?id=61570602983588&mibextid=ZbWKwL"
        )
        settings_obj.save()
        self.stdout.write(self.style.SUCCESS("Seeded SiteSettings"))

        for slug, title, body in CONTENT_BLOCKS:
            block, _ = ContentBlock.objects.get_or_create(slug=slug)
            block.set_current_language("ar")
            block.title = title
            block.body = body
            block.save()
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(CONTENT_BLOCKS)} content blocks"))

        QualityPrinciple.objects.all().delete()
        for i, text in enumerate(QUALITY_PRINCIPLES):
            p = QualityPrinciple(order=i)
            p.set_current_language("ar")
            p.text = text
            p.save()
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(QUALITY_PRINCIPLES)} quality principles"))

        ServiceItem.objects.all().delete()
        ServiceCategory.objects.all().delete()
        for cat_order, (cat_name, items) in enumerate(SERVICE_CATEGORIES):
            category = ServiceCategory(order=cat_order, icon=CATEGORY_KEYS.get(cat_name, ""))
            category.set_current_language("ar")
            category.name = cat_name
            category.save()
            for item_order, item_text in enumerate(items):
                item = ServiceItem(category=category, order=item_order)
                item.set_current_language("ar")
                item.text = item_text
                item.save()
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(SERVICE_CATEGORIES)} service categories"))

        category, _ = Category.objects.get_or_create(id=1)
        category.set_current_language("ar")
        category.name = "عام"
        category.slug = "uncategorized"
        category.save()
        self.stdout.write(self.style.SUCCESS("Seeded default post category"))

        Correspondent.objects.get_or_create(
            email="info@al-diwan.ly", defaults={"name": "شركة الديوان (البريد العام)"}
        )

        if not Post.objects.filter(translations__slug="اهلا-وسهلا").exists():
            post = Post(category=category, status=Post.Status.PUBLISHED, published_at=timezone.now())
            post.set_current_language("ar")
            post.title = "اهلا وسهلا"
            post.slug = "اهلا-وسهلا"
            post.save()
        self.stdout.write(self.style.SUCCESS("Seeded intro blog post"))

        self.stdout.write(self.style.SUCCESS("Seed complete."))
