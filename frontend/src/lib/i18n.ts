/**
 * UI-string translations.
 *
 * Database content (services, posts, content blocks) is translated server-side
 * by parler and arrives already localised; this file only covers strings that
 * live in the frontend.
 *
 * URLs use short codes (/es/, /zh/). `apiLang` maps them to the codes Django
 * knows — notably zh -> zh-hans, since Django distinguishes script variants.
 */

export const LANGS = ["ar", "en", "es", "it", "zh", "tr"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "ar";

/** Right-to-left scripts. Only Arabic here, but kept as a set for clarity. */
const RTL_LANGS = new Set<Lang>(["ar"]);

export const LANG_META: Record<Lang, { name: string; english: string; apiLang: string }> = {
  ar: { name: "العربية", english: "Arabic", apiLang: "ar" },
  en: { name: "English", english: "English", apiLang: "en" },
  es: { name: "Español", english: "Spanish", apiLang: "es" },
  it: { name: "Italiano", english: "Italian", apiLang: "it" },
  zh: { name: "中文", english: "Chinese", apiLang: "zh-hans" },
  tr: { name: "Türkçe", english: "Turkish", apiLang: "tr" },
};

export function isLang(value: string | undefined): value is Lang {
  return LANGS.includes(value as Lang);
}

export function dirFor(lang: Lang): "rtl" | "ltr" {
  return RTL_LANGS.has(lang) ? "rtl" : "ltr";
}

export function apiLangFor(lang: Lang): string {
  return LANG_META[lang].apiLang;
}

type Entry = Record<Lang, string>;

const strings = {
  // --- Navigation & chrome ---
  home: { ar: "الرئيسية", en: "Home", es: "Inicio", it: "Home", zh: "首页", tr: "Ana Sayfa" },
  services: { ar: "خدماتنا", en: "Services", es: "Servicios", it: "Servizi", zh: "服务", tr: "Hizmetler" },
  about: { ar: "من نحن", en: "About", es: "Nosotros", it: "Chi siamo", zh: "关于我们", tr: "Hakkımızda" },
  blog: { ar: "المدونة", en: "Blog", es: "Blog", it: "Blog", zh: "博客", tr: "Blog" },
  contact: { ar: "تواصل معنا", en: "Contact", es: "Contacto", it: "Contatti", zh: "联系我们", tr: "İletişim" },
  mainNav: { ar: "التنقل الرئيسي", en: "Main navigation", es: "Navegación principal", it: "Navigazione principale", zh: "主导航", tr: "Ana gezinme" },
  openMenu: { ar: "فتح القائمة", en: "Open menu", es: "Abrir menú", it: "Apri menu", zh: "打开菜单", tr: "Menüyü aç" },
  closeMenu: { ar: "إغلاق القائمة", en: "Close menu", es: "Cerrar menú", it: "Chiudi menu", zh: "关闭菜单", tr: "Menüyü kapat" },
  switchToDark: { ar: "التبديل إلى المظهر الداكن", en: "Switch to dark mode", es: "Cambiar a modo oscuro", it: "Passa alla modalità scura", zh: "切换到深色模式", tr: "Koyu moda geç" },
  switchToLight: { ar: "التبديل إلى المظهر الفاتح", en: "Switch to light mode", es: "Cambiar a modo claro", it: "Passa alla modalità chiara", zh: "切换到浅色模式", tr: "Açık moda geç" },
  appearance: { ar: "المظهر", en: "Appearance", es: "Apariencia", it: "Aspetto", zh: "外观", tr: "Görünüm" },
  chooseLanguage: { ar: "اختر اللغة", en: "Choose language", es: "Elegir idioma", it: "Scegli la lingua", zh: "选择语言", tr: "Dil seçin" },
  skipToContent: { ar: "تخطى إلى المحتوى", en: "Skip to content", es: "Ir al contenido", it: "Vai al contenuto", zh: "跳到主要内容", tr: "İçeriğe geç" },
  companyName: { ar: "شركة الديوان", en: "Al-Diwan", es: "Al-Diwan", it: "Al-Diwan", zh: "Al-Diwan", tr: "Al-Diwan" },
  companyTagline: { ar: "للتفتيش والمطابقة", en: "Inspection & Conformity", es: "Inspección y Conformidad", it: "Ispezione e Conformità", zh: "检验与合规", tr: "Denetim ve Uygunluk" },
  logoAlt: { ar: "شعار شركة الديوان للتفتيش والمطابقة", en: "Al-Diwan Inspection & Conformity logo", es: "Logotipo de Al-Diwan Inspección y Conformidad", it: "Logo Al-Diwan Ispezione e Conformità", zh: "Al-Diwan 检验与合规标志", tr: "Al-Diwan Denetim ve Uygunluk logosu" },

  // --- Hero ---
  heroEyebrow: { ar: "طرف ثالث محايد", en: "Independent third party", es: "Tercero independiente", it: "Terza parte indipendente", zh: "独立第三方", tr: "Bağımsız üçüncü taraf" },
  heroTitle: {
    ar: "التفتيش والمطابقة، بدقة تُبنى عليها القرارات.",
    en: "Inspection and conformity, precise enough to decide on.",
    es: "Inspección y conformidad, con la precisión que exige una decisión.",
    it: "Ispezione e conformità, precise quanto basta per decidere.",
    zh: "精准的检验与合规，值得据以决策。",
    tr: "Karar vermeye yetecek kadar kesin denetim ve uygunluk.",
  },
  exploreServices: { ar: "استعرض خدماتنا", en: "Explore our services", es: "Ver nuestros servicios", it: "Scopri i servizi", zh: "浏览我们的服务", tr: "Hizmetlerimizi inceleyin" },
  qualityManagement: { ar: "نظام إدارة الجودة", en: "Quality management system", es: "Sistema de gestión de calidad", it: "Sistema di gestione qualità", zh: "质量管理体系", tr: "Kalite yönetim sistemi" },
  inspectionBodies: { ar: "متطلبات هيئات التفتيش", en: "Requirements for inspection bodies", es: "Requisitos para organismos de inspección", it: "Requisiti per organismi di ispezione", zh: "检验机构要求", tr: "Denetim kuruluşları şartları" },
  shipAlt: {
    ar: "سفينة حاويات أثناء التفريغ في الميناء",
    en: "Container ship being unloaded at port",
    es: "Buque portacontenedores descargando en el puerto",
    it: "Nave portacontainer in fase di scarico al porto",
    zh: "港口卸货中的集装箱船",
    tr: "Limanda boşaltılan konteyner gemisi",
  },
  scrollHint: { ar: "مرّر للأسفل", en: "Scroll", es: "Desplázate", it: "Scorri", zh: "向下滚动", tr: "Aşağı kaydır" },

  // --- Trust bar ---
  trustIndependent: { ar: "مستقلة", en: "Independent", es: "Independiente", it: "Indipendente", zh: "独立", tr: "Bağımsız" },
  trustIndependentSub: { ar: "طرف ثالث محايد", en: "Neutral third party", es: "Tercero neutral", it: "Terza parte neutrale", zh: "中立第三方", tr: "Tarafsız üçüncü taraf" },
  trustAccredited: { ar: "معتمدة", en: "Accredited", es: "Acreditada", it: "Accreditata", zh: "已认证", tr: "Akredite" },
  trustAccreditedSub: { ar: "وفق المعايير الدولية", en: "To international standards", es: "Según normas internacionales", it: "Secondo standard internazionali", zh: "符合国际标准", tr: "Uluslararası standartlara göre" },
  trustMisrata: { ar: "مصراتة", en: "Misrata", es: "Misrata", it: "Misurata", zh: "米苏拉塔", tr: "Misrata" },
  trustMisrataSub: { ar: "المقر الرئيسي، ليبيا", en: "Head office, Libya", es: "Sede central, Libia", it: "Sede principale, Libia", zh: "利比亚总部", tr: "Merkez ofis, Libya" },
  trustTeam: { ar: "فريق مؤهل", en: "Qualified team", es: "Equipo cualificado", it: "Team qualificato", zh: "专业团队", tr: "Nitelikli ekip" },
  trustTeamSub: { ar: "مهندسون ومتخصصون فنيون", en: "Engineers and technical specialists", es: "Ingenieros y especialistas técnicos", it: "Ingegneri e specialisti tecnici", zh: "工程师与技术专家", tr: "Mühendisler ve teknik uzmanlar" },

  // --- Sections ---
  ourServices: { ar: "خدماتنا", en: "Our services", es: "Nuestros servicios", it: "I nostri servizi", zh: "我们的服务", tr: "Hizmetlerimiz" },
  servicesHeading: {
    ar: "تغطية تشمل كل ما يُفحص ويُشحن",
    en: "Coverage for everything inspected and shipped",
    es: "Cobertura para todo lo que se inspecciona y se embarca",
    it: "Copertura per tutto ciò che viene ispezionato e spedito",
    zh: "覆盖各类检验与运输需求",
    tr: "Denetlenen ve sevk edilen her şey için kapsam",
  },
  allServices: { ar: "تفاصيل كل الخدمات", en: "See all services", es: "Ver todos los servicios", it: "Vedi tutti i servizi", zh: "查看全部服务", tr: "Tüm hizmetleri gör" },
  moreItems: { ar: "عنصر إضافي", en: "more", es: "más", it: "altri", zh: "项以上", tr: "daha" },
  methodology: { ar: "منهجية العمل", en: "How we work", es: "Cómo trabajamos", it: "Come lavoriamo", zh: "工作方式", tr: "Nasıl çalışırız" },
  processHeading: {
    ar: "نرافق الشحنة من المصنع حتى التسليم",
    en: "We follow the shipment from factory to delivery",
    es: "Acompañamos el envío desde la fábrica hasta la entrega",
    it: "Seguiamo la spedizione dalla fabbrica alla consegna",
    zh: "从工厂到交付，全程跟踪货物",
    tr: "Sevkiyatı fabrikadan teslimata kadar izliyoruz",
  },
  processLede: {
    ar: "أربع مراحل متصلة، كل واحدة منها موثّقة بتقرير.",
    en: "Four connected stages, each documented in a report.",
    es: "Cuatro etapas conectadas, cada una documentada en un informe.",
    it: "Quattro fasi collegate, ciascuna documentata in un rapporto.",
    zh: "四个连贯阶段，每一步均有报告存档。",
    tr: "Birbirine bağlı dört aşama, her biri raporla belgelenir.",
  },
  fieldWork: { ar: "من الميدان", en: "From the field", es: "Desde el terreno", it: "Sul campo", zh: "现场实况", tr: "Sahadan" },
  fieldWorkHeading: { ar: "مفتشونا في مواقع العمل", en: "Our inspectors on site", es: "Nuestros inspectores en el terreno", it: "I nostri ispettori sul posto", zh: "我们的检验员在现场", tr: "Denetçilerimiz sahada" },
  fieldWorkLede: {
    ar: "صور حقيقية من عمليات تفتيش نفّذها فريقنا — لا صور تجارية جاهزة.",
    en: "Real photographs from inspections carried out by our team — not stock imagery.",
    es: "Fotografías reales de inspecciones de nuestro equipo, no imágenes de archivo.",
    it: "Fotografie reali di ispezioni svolte dal nostro team, non immagini stock.",
    zh: "均为团队实地检验的真实照片，而非图库素材。",
    tr: "Ekibimizin yaptığı denetimlerden gerçek fotoğraflar — stok görsel değil.",
  },
  inspectionContainerAlt: {
    ar: "مفتش من شركة الديوان يفحص شحنة داخل حاوية",
    en: "An Al-Diwan inspector checking cargo inside a container",
    es: "Un inspector de Al-Diwan revisando carga dentro de un contenedor",
    it: "Un ispettore Al-Diwan controlla il carico in un container",
    zh: "Al-Diwan 检验员在集装箱内查验货物",
    tr: "Bir Al-Diwan denetçisi konteyner içindeki yükü kontrol ediyor",
  },
  inspectionDocumentsAlt: {
    ar: "مفتش يراجع وثائق الشحنة ويوثّقها",
    en: "An inspector reviewing and documenting shipment paperwork",
    es: "Un inspector revisando y documentando la documentación del envío",
    it: "Un ispettore esamina e documenta i documenti di spedizione",
    zh: "检验员审核并记录货运单据",
    tr: "Bir denetçi sevkiyat evrakını inceliyor ve belgeliyor",
  },
  inspectionTeamAlt: {
    ar: "فريق التفتيش عند باب الحاوية أثناء المعاينة",
    en: "The inspection team at the container door during examination",
    es: "El equipo de inspección en la puerta del contenedor durante el examen",
    it: "Il team di ispezione alla porta del container durante l'esame",
    zh: "检验团队在集装箱门口进行查验",
    tr: "Denetim ekibi inceleme sırasında konteyner kapısında",
  },
  inspectionCargoAlt: {
    ar: "أخذ عينات من شحنة حبوب على متن سفينة سائبة",
    en: "Sampling a grain consignment aboard a bulk carrier",
    es: "Toma de muestras de un cargamento de grano a bordo de un granelero",
    it: "Campionamento di un carico di cereali a bordo di una nave bulk",
    zh: "在散货船上对粮食货物取样",
    tr: "Dökme yük gemisinde tahıl sevkiyatından numune alma",
  },
  officeAlt: {
    ar: "مقر شركة الديوان في مصراتة",
    en: "Al-Diwan's head office in Misrata",
    es: "Sede de Al-Diwan en Misrata",
    it: "La sede di Al-Diwan a Misurata",
    zh: "Al-Diwan 位于米苏拉塔的总部",
    tr: "Al-Diwan'ın Misrata'daki merkez ofisi",
  },
  ourOffice: { ar: "مقرنا", en: "Our office", es: "Nuestra oficina", it: "La nostra sede", zh: "我们的办公室", tr: "Ofisimiz" },
  qualityPolicy: { ar: "سياسة الجودة", en: "Quality policy", es: "Política de calidad", it: "Politica per la qualità", zh: "质量方针", tr: "Kalite politikası" },
  qualityHeading: {
    ar: "الالتزام ليس شعارًا، بل نظام إداري موثّق",
    en: "Commitment isn't a slogan — it's a documented management system",
    es: "El compromiso no es un lema: es un sistema de gestión documentado",
    it: "L'impegno non è uno slogan: è un sistema di gestione documentato",
    zh: "承诺不是口号，而是有据可查的管理体系",
    tr: "Bağlılık bir slogan değil — belgelenmiş bir yönetim sistemidir",
  },
  latestNews: { ar: "آخر الأخبار والمقالات", en: "Latest news and articles", es: "Últimas noticias y artículos", it: "Ultime notizie e articoli", zh: "最新动态与文章", tr: "Son haberler ve makaleler" },
  ctaHeading: {
    ar: "لديك شحنة تحتاج تفتيشًا؟",
    en: "Have a shipment that needs inspecting?",
    es: "¿Tiene un envío que necesita inspección?",
    it: "Hai una spedizione da ispezionare?",
    zh: "有需要检验的货物吗？",
    tr: "Denetlenmesi gereken bir sevkiyatınız mı var?",
  },
  ctaLede: {
    ar: "أرسل لنا تفاصيل الشحنة أو المنتج، وسنعود إليك بخطة تفتيش واضحة.",
    en: "Send us the shipment or product details and we'll come back with a clear inspection plan.",
    es: "Envíenos los detalles del envío o producto y le responderemos con un plan de inspección claro.",
    it: "Inviaci i dettagli della spedizione o del prodotto e ti risponderemo con un piano di ispezione chiaro.",
    zh: "把货物或产品信息发给我们，我们会回复清晰的检验方案。",
    tr: "Sevkiyat veya ürün bilgilerini gönderin, size net bir denetim planıyla dönelim.",
  },
  whatsapp: { ar: "واتساب", en: "WhatsApp", es: "WhatsApp", it: "WhatsApp", zh: "WhatsApp", tr: "WhatsApp" },

  // --- Services page ---
  whatWeOffer: { ar: "ما نقدمه", en: "What we offer", es: "Qué ofrecemos", it: "Cosa offriamo", zh: "我们提供什么", tr: "Ne sunuyoruz" },
  servicesPageTitle: { ar: "خدمات التفتيش والمطابقة", en: "Inspection and conformity services", es: "Servicios de inspección y conformidad", it: "Servizi di ispezione e conformità", zh: "检验与合规服务", tr: "Denetim ve uygunluk hizmetleri" },
  bySector: { ar: "حسب القطاع", en: "By sector", es: "Por sector", it: "Per settore", zh: "按行业", tr: "Sektöre göre" },
  sectorsHeading: { ar: "قطاعات نغطيها", en: "Sectors we cover", es: "Sectores que cubrimos", it: "Settori che copriamo", zh: "我们覆盖的行业", tr: "Kapsadığımız sektörler" },
  shipmentCycle: { ar: "دورة الشحنة", en: "Shipment cycle", es: "Ciclo del envío", it: "Ciclo della spedizione", zh: "货运流程", tr: "Sevkiyat döngüsü" },
  notFoundService: {
    ar: "لم تجد الخدمة التي تبحث عنها؟",
    en: "Didn't find the service you need?",
    es: "¿No encontró el servicio que necesita?",
    it: "Non hai trovato il servizio che ti serve?",
    zh: "没有找到您需要的服务？",
    tr: "İhtiyacınız olan hizmeti bulamadınız mı?",
  },
  notFoundServiceLede: {
    ar: "قائمتنا تغطي أكثر ما يُشحن ويُفحص، لكنها ليست حصرية. أخبرنا بما لديك.",
    en: "Our list covers most of what gets shipped and inspected, but it isn't exhaustive. Tell us what you have.",
    es: "Nuestra lista cubre la mayor parte de lo que se embarca e inspecciona, pero no es exhaustiva. Cuéntenos su caso.",
    it: "Il nostro elenco copre gran parte di ciò che viene spedito e ispezionato, ma non è esaustivo. Raccontaci il tuo caso.",
    zh: "我们的清单涵盖大多数运输与检验需求，但并不详尽。请告诉我们您的情况。",
    tr: "Listemiz sevk edilen ve denetlenenlerin çoğunu kapsar, ancak sınırlı değildir. Durumunuzu bize anlatın.",
  },
  askDirectly: { ar: "اسألنا مباشرة", en: "Ask us directly", es: "Consúltenos directamente", it: "Chiedici direttamente", zh: "直接咨询我们", tr: "Doğrudan bize sorun" },

  // --- About page ---
  theCompany: { ar: "الشركة", en: "The company", es: "La empresa", it: "L'azienda", zh: "公司简介", tr: "Şirket" },
  aboutTitle: {
    ar: "طرف ثالث محايد، مقره مصراتة",
    en: "An independent third party, based in Misrata",
    es: "Un tercero independiente, con sede en Misrata",
    it: "Una terza parte indipendente, con sede a Misurata",
    zh: "总部位于米苏拉塔的独立第三方",
    tr: "Misrata merkezli bağımsız üçüncü taraf",
  },
  ourTeam: { ar: "فريق العمل", en: "Our team", es: "Nuestro equipo", it: "Il nostro team", zh: "我们的团队", tr: "Ekibimiz" },
  ourNetwork: { ar: "شبكتنا", en: "Our network", es: "Nuestra red", it: "La nostra rete", zh: "我们的网络", tr: "Ağımız" },
  neutralHeading: {
    ar: "نعمل معك كطرف محايد",
    en: "We work with you as a neutral party",
    es: "Trabajamos con usted como parte neutral",
    it: "Lavoriamo con te come parte neutrale",
    zh: "我们以中立方身份与您合作",
    tr: "Sizinle tarafsız bir taraf olarak çalışırız",
  },
  neutralLede: {
    ar: "استقلاليتنا هي ما يجعل تقاريرنا ذات قيمة. تواصل معنا لمناقشة احتياجك.",
    en: "Our independence is what gives our reports their value. Get in touch to discuss what you need.",
    es: "Nuestra independencia es lo que da valor a nuestros informes. Contáctenos para hablar de lo que necesita.",
    it: "La nostra indipendenza è ciò che dà valore ai nostri rapporti. Contattaci per parlare di ciò che ti serve.",
    zh: "独立性正是我们报告价值的来源。欢迎联系我们商讨您的需求。",
    tr: "Raporlarımıza değerini kazandıran şey bağımsızlığımızdır. İhtiyacınızı konuşmak için bize ulaşın.",
  },

  // --- Blog ---
  blogTitle: { ar: "أخبار ومقالات", en: "News and articles", es: "Noticias y artículos", it: "Notizie e articoli", zh: "新闻与文章", tr: "Haberler ve makaleler" },
  blogLede: {
    ar: "تحديثات من الشركة، ومواد حول معايير التفتيش ومراقبة الجودة.",
    en: "Company updates and material on inspection and quality-control standards.",
    es: "Novedades de la empresa y material sobre normas de inspección y control de calidad.",
    it: "Aggiornamenti aziendali e materiali sugli standard di ispezione e controllo qualità.",
    zh: "公司动态以及检验与质量控制标准相关资料。",
    tr: "Şirket güncellemeleri ile denetim ve kalite kontrol standartlarına dair içerikler.",
  },
  allCategories: { ar: "الكل", en: "All", es: "Todos", it: "Tutti", zh: "全部", tr: "Tümü" },
  noPosts: { ar: "لا توجد منشورات منشورة بعد.", en: "No published posts yet.", es: "Aún no hay publicaciones.", it: "Nessun articolo pubblicato.", zh: "暂无已发布的文章。", tr: "Henüz yayımlanmış yazı yok." },
  readNext: { ar: "اقرأ أيضًا", en: "Read next", es: "Sigue leyendo", it: "Continua a leggere", zh: "继续阅读", tr: "Sonrakini oku" },
  backToBlog: { ar: "العودة إلى المدونة", en: "Back to the blog", es: "Volver al blog", it: "Torna al blog", zh: "返回博客", tr: "Bloga dön" },

  // --- Contact ---
  howToReach: { ar: "كيفية التواصل؟", en: "How to reach us", es: "Cómo contactarnos", it: "Come contattarci", zh: "如何联系我们", tr: "Bize nasıl ulaşırsınız" },
  contactTitle: {
    ar: "يمكنك دائمًا العثور علينا هنا",
    en: "You can always find us here",
    es: "Siempre puede encontrarnos aquí",
    it: "Puoi sempre trovarci qui",
    zh: "您随时可以在这里找到我们",
    tr: "Bizi her zaman burada bulabilirsiniz",
  },
  contactLede: {
    ar: "أرسل تفاصيل شحنتك أو استفسارك، وسيصلك الرد من فريقنا مباشرة.",
    en: "Send your shipment details or a question, and our team will reply directly.",
    es: "Envíe los detalles de su envío o su consulta y nuestro equipo le responderá directamente.",
    it: "Invia i dettagli della spedizione o una domanda: il nostro team ti risponderà direttamente.",
    zh: "发送您的货运信息或问题，我们的团队会直接回复。",
    tr: "Sevkiyat bilgilerinizi veya sorunuzu gönderin, ekibimiz doğrudan yanıtlasın.",
  },
  contactDetails: { ar: "معلومات الاتصال", en: "Contact details", es: "Datos de contacto", it: "Contatti", zh: "联系方式", tr: "İletişim bilgileri" },
  sendMessage: { ar: "أرسل لنا رسالة", en: "Send us a message", es: "Envíenos un mensaje", it: "Inviaci un messaggio", zh: "给我们留言", tr: "Bize mesaj gönderin" },
  email: { ar: "البريد الإلكتروني", en: "Email", es: "Correo electrónico", it: "Email", zh: "电子邮件", tr: "E-posta" },
  location: { ar: "الموقع", en: "Location", es: "Ubicación", it: "Sede", zh: "地址", tr: "Konum" },
  facebookPage: { ar: "صفحة فيسبوك", en: "Facebook page", es: "Página de Facebook", it: "Pagina Facebook", zh: "Facebook 主页", tr: "Facebook sayfası" },
  nameLabel: { ar: "الاسم", en: "Name", es: "Nombre", it: "Nome", zh: "姓名", tr: "Ad" },
  namePlaceholder: { ar: "اسمك الكامل", en: "Your full name", es: "Su nombre completo", it: "Il tuo nome completo", zh: "您的全名", tr: "Tam adınız" },
  subjectLabel: { ar: "الموضوع", en: "Subject", es: "Asunto", it: "Oggetto", zh: "主题", tr: "Konu" },
  subjectPlaceholder: {
    ar: "مثال: استفسار عن فحص شحنة",
    en: "e.g. Enquiry about a shipment inspection",
    es: "p. ej. Consulta sobre la inspección de un envío",
    it: "es. Richiesta su un'ispezione di spedizione",
    zh: "例如：关于货物检验的咨询",
    tr: "örn. Sevkiyat denetimi hakkında soru",
  },
  messageLabel: { ar: "رسالتك", en: "Your message", es: "Su mensaje", it: "Il tuo messaggio", zh: "您的留言", tr: "Mesajınız" },
  messagePlaceholder: { ar: "اشرح لنا احتياجك بإيجاز…", en: "Briefly describe what you need…", es: "Describa brevemente lo que necesita…", it: "Descrivi brevemente ciò che ti serve…", zh: "请简要说明您的需求…", tr: "İhtiyacınızı kısaca anlatın…" },
  send: { ar: "إرسال الرسالة", en: "Send message", es: "Enviar mensaje", it: "Invia messaggio", zh: "发送留言", tr: "Mesajı gönder" },
  sending: { ar: "جارٍ الإرسال…", en: "Sending…", es: "Enviando…", it: "Invio in corso…", zh: "发送中…", tr: "Gönderiliyor…" },
  contactSuccess: {
    ar: "تم استلام رسالتك. سنتواصل معك قريبًا.",
    en: "Your message has been received. We'll be in touch shortly.",
    es: "Hemos recibido su mensaje. Nos pondremos en contacto en breve.",
    it: "Abbiamo ricevuto il tuo messaggio. Ti contatteremo a breve.",
    zh: "我们已收到您的留言，会尽快与您联系。",
    tr: "Mesajınız alındı. Kısa süre içinde sizinle iletişime geçeceğiz.",
  },
  contactError: {
    ar: "تعذّر إرسال الرسالة. حاول مرة أخرى أو راسلنا مباشرة.",
    en: "The message couldn't be sent. Please try again or email us directly.",
    es: "No se pudo enviar el mensaje. Inténtelo de nuevo o escríbanos directamente.",
    it: "Impossibile inviare il messaggio. Riprova o scrivici direttamente.",
    zh: "留言发送失败，请重试或直接发邮件给我们。",
    tr: "Mesaj gönderilemedi. Lütfen tekrar deneyin veya doğrudan e-posta gönderin.",
  },
  required: { ar: "هذا الحقل مطلوب", en: "This field is required", es: "Este campo es obligatorio", it: "Campo obbligatorio", zh: "此项为必填", tr: "Bu alan zorunludur" },
  invalidEmail: { ar: "بريد إلكتروني غير صالح", en: "Invalid email address", es: "Correo electrónico no válido", it: "Indirizzo email non valido", zh: "电子邮件地址无效", tr: "Geçersiz e-posta adresi" },

  // --- Footer ---
  links: { ar: "روابط", en: "Links", es: "Enlaces", it: "Link", zh: "链接", tr: "Bağlantılar" },
  accreditations: { ar: "الاعتمادات", en: "Accreditations", es: "Acreditaciones", it: "Accreditamenti", zh: "认证资质", tr: "Akreditasyonlar" },
  rightsReserved: {
    ar: "شركة الديوان للتفتيش والمطابقة. جميع الحقوق محفوظة.",
    en: "Al-Diwan Inspection & Conformity. All rights reserved.",
    es: "Al-Diwan Inspección y Conformidad. Todos los derechos reservados.",
    it: "Al-Diwan Ispezione e Conformità. Tutti i diritti riservati.",
    zh: "Al-Diwan 检验与合规。版权所有。",
    tr: "Al-Diwan Denetim ve Uygunluk. Tüm hakları saklıdır.",
  },
  misrataLibya: { ar: "مصراتة، ليبيا", en: "Misrata, Libya", es: "Misrata, Libia", it: "Misurata, Libia", zh: "利比亚，米苏拉塔", tr: "Misrata, Libya" },
  footerBlurb: {
    ar: "شركة مستقلة مقرها مصراتة، ليبيا. نعمل كطرف ثالث محايد في خدمات التفتيش ومراقبة الجودة وفق المعايير الدولية.",
    en: "An independent company based in Misrata, Libya. We act as a neutral third party in inspection and quality-control services under international standards.",
    es: "Empresa independiente con sede en Misrata, Libia. Actuamos como tercero neutral en servicios de inspección y control de calidad conforme a normas internacionales.",
    it: "Azienda indipendente con sede a Misurata, Libia. Operiamo come terza parte neutrale nei servizi di ispezione e controllo qualità secondo standard internazionali.",
    zh: "一家总部位于利比亚米苏拉塔的独立公司。我们依据国际标准，以中立第三方身份提供检验与质量控制服务。",
    tr: "Libya'nın Misrata şehrinde kurulu bağımsız bir şirket. Uluslararası standartlar çerçevesinde denetim ve kalite kontrol hizmetlerinde tarafsız üçüncü taraf olarak görev yaparız.",
  },

  // --- Dashboard ---
  dashboard: { ar: "لوحة التحكم", en: "Dashboard", es: "Panel", it: "Pannello", zh: "控制台", tr: "Panel" },
  staffDashboard: { ar: "لوحة تحكم الموظفين", en: "Staff dashboard", es: "Panel de personal", it: "Pannello dello staff", zh: "员工控制台", tr: "Personel paneli" },
  signIn: { ar: "دخول", en: "Sign in", es: "Iniciar sesión", it: "Accedi", zh: "登录", tr: "Giriş yap" },
  signingIn: { ar: "جارٍ الدخول…", en: "Signing in…", es: "Iniciando sesión…", it: "Accesso in corso…", zh: "登录中…", tr: "Giriş yapılıyor…" },
  signOut: { ar: "تسجيل الخروج", en: "Sign out", es: "Cerrar sesión", it: "Esci", zh: "退出登录", tr: "Çıkış yap" },
  username: { ar: "اسم المستخدم", en: "Username", es: "Usuario", it: "Nome utente", zh: "用户名", tr: "Kullanıcı adı" },
  password: { ar: "كلمة المرور", en: "Password", es: "Contraseña", it: "Password", zh: "密码", tr: "Şifre" },
  loginFailed: { ar: "اسم المستخدم أو كلمة المرور غير صحيحة.", en: "Incorrect username or password.", es: "Usuario o contraseña incorrectos.", it: "Nome utente o password errati.", zh: "用户名或密码不正确。", tr: "Kullanıcı adı veya şifre hatalı." },
  backToSite: { ar: "العودة إلى الموقع", en: "Back to the site", es: "Volver al sitio", it: "Torna al sito", zh: "返回网站", tr: "Siteye dön" },
  posts: { ar: "المنشورات", en: "Posts", es: "Publicaciones", it: "Articoli", zh: "文章", tr: "Yazılar" },
  messages: { ar: "الرسائل", en: "Messages", es: "Mensajes", it: "Messaggi", zh: "消息", tr: "Mesajlar" },
  fullAdmin: { ar: "الإدارة الكاملة", en: "Full admin", es: "Administración completa", it: "Amministrazione completa", zh: "完整后台", tr: "Tam yönetim" },
  viewSite: { ar: "عرض الموقع", en: "View site", es: "Ver el sitio", it: "Vedi il sito", zh: "查看网站", tr: "Siteyi görüntüle" },
  newPost: { ar: "منشور جديد", en: "New post", es: "Nueva publicación", it: "Nuovo articolo", zh: "新建文章", tr: "Yeni yazı" },
  editPost: { ar: "تعديل منشور", en: "Edit post", es: "Editar publicación", it: "Modifica articolo", zh: "编辑文章", tr: "Yazıyı düzenle" },
  title: { ar: "العنوان", en: "Title", es: "Título", it: "Titolo", zh: "标题", tr: "Başlık" },
  slug: { ar: "الرابط", en: "Slug", es: "URL", it: "Slug", zh: "网址别名", tr: "Bağlantı adı" },
  category: { ar: "التصنيف", en: "Category", es: "Categoría", it: "Categoria", zh: "分类", tr: "Kategori" },
  author: { ar: "الكاتب", en: "Author", es: "Autor", it: "Autore", zh: "作者", tr: "Yazar" },
  status: { ar: "الحالة", en: "Status", es: "Estado", it: "Stato", zh: "状态", tr: "Durum" },
  publishedAt: { ar: "تاريخ النشر", en: "Published", es: "Publicado", it: "Pubblicato", zh: "发布时间", tr: "Yayımlandı" },
  excerpt: { ar: "مقتطف", en: "Excerpt", es: "Extracto", it: "Estratto", zh: "摘要", tr: "Özet" },
  content: { ar: "المحتوى", en: "Content", es: "Contenido", it: "Contenuto", zh: "内容", tr: "İçerik" },
  save: { ar: "حفظ", en: "Save", es: "Guardar", it: "Salva", zh: "保存", tr: "Kaydet" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…", es: "Guardando…", it: "Salvataggio…", zh: "保存中…", tr: "Kaydediliyor…" },
  saved: { ar: "تم الحفظ.", en: "Saved.", es: "Guardado.", it: "Salvato.", zh: "已保存。", tr: "Kaydedildi." },
  delete: { ar: "حذف", en: "Delete", es: "Eliminar", it: "Elimina", zh: "删除", tr: "Sil" },
  cancel: { ar: "إلغاء", en: "Cancel", es: "Cancelar", it: "Annulla", zh: "取消", tr: "İptal" },
  back: { ar: "رجوع", en: "Back", es: "Volver", it: "Indietro", zh: "返回", tr: "Geri" },
  confirmDelete: { ar: "هل تريد حذف هذا المنشور؟ لا يمكن التراجع.", en: "Delete this post? This cannot be undone.", es: "¿Eliminar esta publicación? No se puede deshacer.", it: "Eliminare questo articolo? L'operazione è irreversibile.", zh: "确定删除这篇文章吗？此操作无法撤销。", tr: "Bu yazı silinsin mi? Bu işlem geri alınamaz." },
  noPostsYet: { ar: "لا توجد منشورات بعد.", en: "No posts yet.", es: "Aún no hay publicaciones.", it: "Nessun articolo.", zh: "暂无文章。", tr: "Henüz yazı yok." },
  draft: { ar: "مسودة", en: "Draft", es: "Borrador", it: "Bozza", zh: "草稿", tr: "Taslak" },
  scheduled: { ar: "مجدول", en: "Scheduled", es: "Programado", it: "Programmato", zh: "已排程", tr: "Zamanlanmış" },
  published: { ar: "منشور", en: "Published", es: "Publicado", it: "Pubblicato", zh: "已发布", tr: "Yayımlandı" },
  editingLanguage: { ar: "لغة التحرير", en: "Editing language", es: "Idioma de edición", it: "Lingua di modifica", zh: "编辑语言", tr: "Düzenleme dili" },
  editingLanguageNote: {
    ar: "تحرّر الآن النسخة المعروضة فقط — النسخ الأخرى لا تتأثر.",
    en: "You're editing only the language shown — other versions are unaffected.",
    es: "Solo está editando el idioma mostrado; las demás versiones no cambian.",
    it: "Stai modificando solo la lingua mostrata: le altre versioni non cambiano.",
    zh: "您当前只在编辑所显示的语言版本，其他版本不受影响。",
    tr: "Yalnızca gösterilen dili düzenliyorsunuz — diğer sürümler etkilenmez.",
  },
  newMessage: { ar: "رسالة جديدة", en: "New message", es: "Nuevo mensaje", it: "Nuovo messaggio", zh: "新建消息", tr: "Yeni mesaj" },
  subject: { ar: "الموضوع", en: "Subject", es: "Asunto", it: "Oggetto", zh: "主题", tr: "Konu" },
  from: { ar: "من", en: "From", es: "De", it: "Da", zh: "发件人", tr: "Gönderen" },
  assignedTo: { ar: "مسندة إلى", en: "Assigned to", es: "Asignado a", it: "Assegnato a", zh: "指派给", tr: "Atanan" },
  updated: { ar: "آخر تحديث", en: "Updated", es: "Actualizado", it: "Aggiornato", zh: "更新时间", tr: "Güncellendi" },
  unread: { ar: "جديد", en: "New", es: "Nuevo", it: "Nuovo", zh: "新", tr: "Yeni" },
  noMessages: { ar: "لا توجد رسائل.", en: "No messages.", es: "No hay mensajes.", it: "Nessun messaggio.", zh: "暂无消息。", tr: "Mesaj yok." },
  statusOpen: { ar: "مفتوحة", en: "Open", es: "Abierta", it: "Aperta", zh: "进行中", tr: "Açık" },
  statusPending: { ar: "بانتظار الرد", en: "Awaiting reply", es: "Esperando respuesta", it: "In attesa di risposta", zh: "等待回复", tr: "Yanıt bekleniyor" },
  statusClosed: { ar: "مغلقة", en: "Closed", es: "Cerrada", it: "Chiusa", zh: "已关闭", tr: "Kapalı" },
  assignedToMe: { ar: "المسندة إليّ", en: "Assigned to me", es: "Asignadas a mí", it: "Assegnate a me", zh: "指派给我", tr: "Bana atananlar" },
  assignToMe: { ar: "إسناد إليّ", en: "Assign to me", es: "Asignarme", it: "Assegna a me", zh: "指派给我", tr: "Bana ata" },
  close: { ar: "إغلاق", en: "Close", es: "Cerrar", it: "Chiudi", zh: "关闭", tr: "Kapat" },
  reply: { ar: "الرد", en: "Reply", es: "Respuesta", it: "Risposta", zh: "回复", tr: "Yanıt" },
  replySend: { ar: "إرسال", en: "Send", es: "Enviar", it: "Invia", zh: "发送", tr: "Gönder" },
  recipientEmail: { ar: "البريد الإلكتروني للمستلم", en: "Recipient email", es: "Correo del destinatario", it: "Email del destinatario", zh: "收件人邮箱", tr: "Alıcı e-postası" },
  recipientName: { ar: "اسم المستلم", en: "Recipient name", es: "Nombre del destinatario", it: "Nome del destinatario", zh: "收件人姓名", tr: "Alıcı adı" },
  noAccess: {
    ar: "لا تملك صلاحيات وصول لأي قسم بعد. تواصل مع المسؤول.",
    en: "You don't have access to any section yet. Contact an administrator.",
    es: "Aún no tiene acceso a ninguna sección. Contacte con un administrador.",
    it: "Non hai ancora accesso a nessuna sezione. Contatta un amministratore.",
    zh: "您暂无任何模块的访问权限，请联系管理员。",
    tr: "Henüz hiçbir bölüme erişiminiz yok. Bir yöneticiyle iletişime geçin.",
  },

  // --- Generic ---
  loading: { ar: "جارٍ التحميل…", en: "Loading…", es: "Cargando…", it: "Caricamento…", zh: "加载中…", tr: "Yükleniyor…" },
  errorLoading: { ar: "تعذّر تحميل البيانات.", en: "Couldn't load data.", es: "No se pudieron cargar los datos.", it: "Impossibile caricare i dati.", zh: "数据加载失败。", tr: "Veriler yüklenemedi." },
  notFound: { ar: "الصفحة غير موجودة", en: "Page not found", es: "Página no encontrada", it: "Pagina non trovata", zh: "页面不存在", tr: "Sayfa bulunamadı" },
  notFoundLede: { ar: "الرابط الذي طلبته غير متاح.", en: "The page you requested isn't available.", es: "La página solicitada no está disponible.", it: "La pagina richiesta non è disponibile.", zh: "您请求的页面不可用。", tr: "İstediğiniz sayfa mevcut değil." },
  goHome: { ar: "العودة للرئيسية", en: "Go home", es: "Ir al inicio", it: "Torna alla home", zh: "返回首页", tr: "Ana sayfaya dön" },
} satisfies Record<string, Entry>;

export type StringKey = keyof typeof strings;

export function t(key: StringKey, lang: Lang): string {
  return strings[key][lang];
}

/** Curried helper so components can do `const tr = useT()` then `tr("home")`. */
export function makeT(lang: Lang) {
  return (key: StringKey) => t(key, lang);
}
