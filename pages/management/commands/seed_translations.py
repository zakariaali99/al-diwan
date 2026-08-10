"""Seed DRAFT Spanish, Italian, Chinese and Turkish translations.

`seed_content` writes the Arabic source records and `seed_english` translates
them; everything else in LANGUAGES was declared but never populated, so /es/,
/it/, /zh/ and /tr/ fell back to Arabic body copy under a translated UI.

These are working translations of the Arabic source, editable in Django Admin.
They should be reviewed by the company before launch — particularly the quality
policy, which restates ISO commitments in the company's own official wording.

Also backfills ServiceCategory.icon (see CATEGORY_KEYS in seed_content) for
categories created before that field was populated. The frontend needs it: the
category *name* arrives translated, so it cannot be matched on.
"""

from django.core.management.base import BaseCommand, CommandError

from pages.management.commands.seed_content import CATEGORY_KEYS
from pages.models import ContentBlock, QualityPrinciple
from posts.models import Category
from services.models import ServiceCategory
from siteconfig.models import SiteSettings

SPANISH = {
    "tagline": "Al-Diwan Inspección y Conformidad",
    "post_category": ("General", "general"),
    "content_blocks": {
        "home_hero": (
            "",
            "Prestamos servicios de inspección y conformidad conforme a las normas "
            "internacionales reconocidas en la materia.",
        ),
        "home_intro": (
            "La pasión por hacer bien el trabajo",
            "En Al-Diwan Inspección y Conformidad creemos en la fuerza de la precisión, la "
            "dedicación y el rigor. Nuestro equipo trabaja con verdadero compromiso para ofrecer "
            "resultados que cumplen los más altos estándares de exactitud y fiabilidad. Sabemos "
            "lo importante que es que cada inspección y cada verificación de conformidad se "
            "realice con la máxima atención al detalle. Nuestro compromiso con la excelencia nos "
            "lleva a superar las expectativas, asegurando que el trabajo no solo se termine, sino "
            "que se haga bien a la primera.\n\n"
            "Confíe en Al-Diwan para realizar el trabajo con eficacia y precisión, siempre.",
        ),
        "vision": (
            "Nuestra visión",
            "Aspiramos a lograr la satisfacción del cliente mediante un servicio de alta calidad, "
            "precisión en el trabajo y entrega en el plazo acordado. Nos comprometemos a mantener "
            "un nivel de servicio destacado que responda plenamente a las necesidades y "
            "expectativas de nuestros clientes.",
        ),
        "mission": (
            "Nuestra misión",
            "Nuestro objetivo es prestar servicios de primer nivel que redefinan el concepto y el "
            "papel de las empresas de inspección, contribuyendo activamente al crecimiento del "
            "sector económico.",
        ),
        "goal": (
            "Nuestro objetivo",
            "Prestar servicios de inspección, supervisión y conformidad con profesionalidad en "
            "todos los sectores industriales, con el compromiso de cumplir las normas reconocidas "
            "internacionalmente en Libia. Como entidad neutral, atendemos a nuestros estimados "
            "clientes conforme a los reglamentos y la legislación del Estado en materia de "
            "servicios de inspección y control de calidad.",
        ),
        "team_intro": (
            "Un equipo plenamente formado",
            "Nuestra completa gama de servicios profesionales responde a las necesidades de una "
            "clientela diversa, gracias a nuestro excelente equipo de profesionales "
            "comprometidos.\n\n"
            "Como empresa, realizamos inspecciones en los distintos centros de producción para "
            "todo tipo de mercancías, cargas y productos, tanto dentro de Libia como en el "
            "extranjero, durante y después de la fabricación. La empresa se enorgullece de "
            "ofrecer servicios excepcionales que nos permiten afrontar una amplia variedad de "
            "encargos con rapidez y máxima precisión. Nuestro equipo está formado por inspectores "
            "y especialistas altamente cualificados, con una amplia experiencia en campos muy "
            "diversos.",
        ),
        "quality_policy": (
            "Política de calidad",
            "Al-Diwan Inspección y Conformidad, como experta en servicios de inspección y "
            "conformidad, se compromete a prestar servicios de alta calidad que satisfagan las "
            "necesidades y expectativas de sus clientes, mediante un sistema de gestión integral "
            "conforme a las normas internacionales ISO 9001:2015 e ISO/IEC 17020:2012.\n\n"
            "Para alcanzar los objetivos de calidad de servicio de la empresa y garantizar la "
            "máxima satisfacción del cliente, la alta dirección ha establecido los siguientes "
            "valores y principios fundamentales como marco orientador de todas las actividades, "
            "planes y objetivos de desarrollo de la organización:",
        ),
        "about_intro": (
            "Quiénes somos",
            "Al-Diwan Inspección y Conformidad es una empresa independiente con sede en Misrata, "
            "Libia, especializada en servicios de inspección y conformidad conforme a la "
            "normativa internacional. Actuamos como tercero neutral y nos centramos en los "
            "servicios de control de calidad e inspección industrial. Nuestro principal objetivo "
            "es prestar servicios de inspección de la máxima calidad, aprovechando las técnicas "
            "más avanzadas y nuestra amplia experiencia.",
        ),
        "about_services_intro": (
            "Nuestros servicios",
            "Prestamos servicios integrales de inspección a todos los niveles, local y "
            "globalmente, y cubrimos la mayoría de los países del mundo. Nuestras inspecciones "
            "abarcan una amplia gama de productos y garantizan el cumplimiento de las normas de "
            "gestión de la calidad (ISO 9001) y de los requisitos para organismos de inspección "
            "(ISO 17020).",
        ),
        "about_closing": (
            "",
            "Al-Diwan Inspección y Conformidad trabaja continuamente para ampliar su destacada "
            "red de relaciones, rodeándose de un número creciente de equipos eficaces.\n\n"
            "Nuestro trabajo se apoya en una plantilla de ingenieros cualificados y especialistas "
            "técnicos que comparten las mismas cualidades: experiencia, entusiasmo constante y "
            "motivación propia, y que hacen de la excelencia y el liderazgo en el mercado su "
            "primer objetivo.",
        ),
    },
    "quality_principles": [
        "Un enfoque orientado a objetivos en todas las operaciones de la empresa.",
        "El compromiso con la excelencia, con plena integridad e independencia.",
        "El cumplimiento de los requisitos profesionales, legales y reglamentarios.",
        "El cumplimiento de los requisitos del sistema de gestión de la calidad según la norma "
        "internacional ISO 9001:2015.",
        "El cumplimiento de los requisitos para organismos de inspección según la norma "
        "internacional ISO/IEC 17020:2012.",
    ],
    "service_categories": {
        "خدمات الفحص الطبي": ("Servicios de inspección médica", [
            "Medicamentos y preparados farmacéuticos",
            "Preparados farmacéuticos",
            "Sueros y vacunas",
            "Material sanitario",
        ]),
        "خدمات التفتيش الصناعي": ("Servicios de inspección industrial", [
            "Materiales de todo tipo (metales, minerales y metales preciosos), componentes de "
            "fábricas y equipos para plantas de desalación y depuración de agua, y estaciones de "
            "generación, transporte y distribución de energía",
            "Maquinaria de todo tipo y piezas de repuesto, equipos industriales pesados y "
            "ligeros, y grúas",
            "Equipos eléctricos y electrónicos, y sistemas de comunicación y navegación",
            "Dispositivos y equipos médicos para el equipamiento de hospitales y clínicas",
            "Buques de carga, plataformas pesqueras y repuestos navales",
            "Y mucho más",
        ]),
        "خدمات فحص الأغذية": ("Servicios de inspección alimentaria", [
            "Cereales y semillas",
            "Harina y piensos",
            "Arroz, frutas, verduras y legumbres",
            "Patata de siembra y plantones de árboles",
            "Aceites comestibles, concentrado de tomate, concentrados y zumos",
            "Azúcar, café, cacao y té",
            "Frutos secos y productos lácteos",
            "Alimentos infantiles, carne y pescado",
            "Alimentos enlatados, congelados y desecados",
            "Levadura",
        ]),
        "فحص ما قبل التصنيع": ("Inspección previa a la fabricación", [
            "Inspección visual de las materias primas",
            "Muestreo aleatorio y ensayos preliminares",
            "Revisión de los certificados y la documentación adjunta para comprobar que se "
            "ajustan a las especificaciones exigidas",
            "Emisión de informes de aprobación de las materias primas destinadas a producción",
        ]),
        "فحص ما قبل الشحن": ("Inspección previa al embarque", [
            "Inspección de las instalaciones de almacenamiento para comprobar su idoneidad",
            "Inspección de los edificios y la maquinaria de las fábricas",
            "Evaluación de los sistemas de control de calidad",
            "Controles de higiene y salubridad",
            "Inspección de los procesos de fabricación",
        ]),
        "خدمات فحص الزيوت": ("Servicios de inspección de hidrocarburos", [
            "Petróleo crudo y sus derivados",
            "Productos petrolíferos gaseosos, líquidos y sólidos",
        ]),
        "خدمات أخذ العينات والاختبار": ("Servicios de muestreo y ensayo", [
            "Toma de muestras en fábricas, almacenes e instalaciones de transporte",
            "Realización de ensayos y validación",
        ]),
        "أثناء فحص الشحنة": ("Inspección durante el transporte", [
            "Inspección inicial de los medios de transporte",
            "Comprobación de que no existen fugas ni defectos",
            "Verificación de las marcas y los números de transporte",
            "Inspección visual de la mercancía",
            "Supervisión de la carga y la descarga: comprobación de las condiciones de transporte",
        ]),
        "التفتيش عند الوصول": ("Inspección a la llegada", [
            "Muestreo y ensayo a la llegada",
            "Seguimiento de la mercancía hasta la entrega final",
            "Aseguramiento de la calidad y evaluación de factores ambientales como la temperatura",
            "Evaluación fotográfica de la mercancía",
        ]),
    },
}

ITALIAN = {
    "tagline": "Al-Diwan Ispezione e Conformità",
    "post_category": ("Generale", "generale"),
    "content_blocks": {
        "home_hero": (
            "",
            "Forniamo servizi di ispezione e conformità secondo le regole internazionali "
            "riconosciute in materia.",
        ),
        "home_intro": (
            "La passione per il lavoro fatto bene",
            "In Al-Diwan Ispezione e Conformità crediamo nella forza della precisione, della "
            "dedizione e del rigore. Il nostro team lavora con vero impegno per fornire risultati "
            "che soddisfano i più alti standard di accuratezza e affidabilità. Sappiamo quanto "
            "sia importante che ogni ispezione e ogni verifica di conformità venga svolta con la "
            "massima attenzione ai dettagli. Il nostro impegno per l'eccellenza ci spinge oltre "
            "le aspettative, garantendo che il lavoro non sia soltanto portato a termine, ma "
            "svolto correttamente fin dalla prima volta.\n\n"
            "Affidatevi ad Al-Diwan per un lavoro efficiente e preciso, ogni volta.",
        ),
        "vision": (
            "La nostra visione",
            "Puntiamo alla soddisfazione del cliente attraverso un servizio di alta qualità, "
            "precisione nel lavoro e consegna nei tempi stabiliti. Ci impegniamo a mantenere un "
            "livello di servizio eccellente, capace di rispondere pienamente alle esigenze e alle "
            "aspettative dei nostri clienti.",
        ),
        "mission": (
            "La nostra missione",
            "Il nostro obiettivo è offrire servizi di altissimo livello che ridefiniscano il "
            "concetto e il ruolo delle società di ispezione, contribuendo attivamente alla "
            "crescita del settore economico.",
        ),
        "goal": (
            "Il nostro obiettivo",
            "Fornire servizi di ispezione, supervisione e conformità con professionalità in tutti "
            "i settori industriali, nel rispetto degli standard riconosciuti a livello "
            "internazionale in Libia. In quanto soggetto neutrale, serviamo i nostri stimati "
            "clienti in linea con i regolamenti e la legislazione dello Stato in materia di "
            "servizi di ispezione e controllo qualità.",
        ),
        "team_intro": (
            "Un team pienamente formato",
            "La nostra gamma completa di servizi professionali risponde alle esigenze di una "
            "clientela diversificata, grazie al nostro eccellente team di persone dedicate.\n\n"
            "Come azienda effettuiamo ispezioni nei diversi siti produttivi per ogni tipo di "
            "merce, carico e prodotto, sia in Libia sia all'estero, durante e dopo la "
            "fabbricazione. L'azienda è orgogliosa di offrire servizi eccezionali che ci "
            "permettono di gestire un'ampia varietà di incarichi con rapidità e massima "
            "precisione. Il nostro team è composto da ispettori e specialisti altamente "
            "qualificati, con una vasta esperienza in molti settori.",
        ),
        "quality_policy": (
            "Politica per la qualità",
            "Al-Diwan Ispezione e Conformità, in qualità di esperta nei servizi di ispezione e "
            "conformità, si impegna a fornire servizi di alta qualità che soddisfino le esigenze "
            "e le aspettative dei propri clienti, attraverso un sistema di gestione integrato "
            "conforme alle norme internazionali ISO 9001:2015 e ISO/IEC 17020:2012.\n\n"
            "Per raggiungere gli obiettivi di qualità del servizio e garantire la massima "
            "soddisfazione del cliente, l'alta direzione ha stabilito i seguenti valori e "
            "principi fondamentali come quadro di riferimento per tutte le attività, i piani e "
            "gli obiettivi di sviluppo dell'organizzazione:",
        ),
        "about_intro": (
            "Chi siamo",
            "Al-Diwan Ispezione e Conformità è un'azienda indipendente con sede a Misurata, in "
            "Libia, specializzata in servizi di ispezione e conformità secondo le normative "
            "internazionali. Operiamo come terza parte neutrale e ci concentriamo sui servizi di "
            "controllo qualità e ispezione industriale. Il nostro obiettivo principale è fornire "
            "servizi di ispezione della massima qualità, avvalendoci delle tecniche più avanzate "
            "e della nostra vasta esperienza.",
        ),
        "about_services_intro": (
            "I nostri servizi",
            "Forniamo servizi di ispezione completi a ogni livello, in ambito locale e globale, "
            "coprendo la maggior parte dei paesi del mondo. Le nostre ispezioni riguardano "
            "un'ampia gamma di prodotti e garantiscono la conformità agli standard di gestione "
            "della qualità (ISO 9001) e ai requisiti per gli organismi di ispezione (ISO 17020).",
        ),
        "about_closing": (
            "",
            "Al-Diwan Ispezione e Conformità lavora costantemente per ampliare la propria rete di "
            "relazioni, circondandosi di un numero crescente di squadre efficaci.\n\n"
            "Il nostro lavoro poggia su uno staff di ingegneri qualificati e specialisti tecnici "
            "che condividono le stesse qualità: esperienza, entusiasmo costante e motivazione "
            "personale, e che fanno dell'eccellenza e della leadership sul mercato il loro primo "
            "obiettivo.",
        ),
    },
    "quality_principles": [
        "Un approccio orientato agli obiettivi in tutte le attività aziendali.",
        "L'impegno per l'eccellenza, con piena integrità e indipendenza.",
        "Il rispetto dei requisiti professionali, legali e regolamentari.",
        "Il rispetto dei requisiti del sistema di gestione della qualità secondo la norma "
        "internazionale ISO 9001:2015.",
        "Il rispetto dei requisiti per gli organismi di ispezione secondo la norma internazionale "
        "ISO/IEC 17020:2012.",
    ],
    "service_categories": {
        "خدمات الفحص الطبي": ("Servizi di ispezione medica", [
            "Farmaci e preparati farmaceutici",
            "Preparati farmaceutici",
            "Sieri e vaccini",
            "Materiali sanitari",
        ]),
        "خدمات التفتيش الصناعي": ("Servizi di ispezione industriale", [
            "Materiali di ogni tipo (metalli, minerali e metalli preziosi), componenti di impianti "
            "e attrezzature per impianti di dissalazione e depurazione delle acque, e stazioni di "
            "generazione, trasmissione e distribuzione dell'energia",
            "Macchinari di ogni tipo e ricambi, attrezzature industriali pesanti e leggere, e gru",
            "Apparecchiature elettriche ed elettroniche, sistemi di comunicazione e navigazione",
            "Dispositivi e apparecchiature medicali per l'allestimento di ospedali e cliniche",
            "Navi da carico, piattaforme di pesca e ricambi navali",
            "E molto altro",
        ]),
        "خدمات فحص الأغذية": ("Servizi di ispezione alimentare", [
            "Cereali e sementi",
            "Farina e mangimi",
            "Riso, frutta, verdura e legumi",
            "Patate da semina e piantine di alberi",
            "Oli alimentari, concentrato di pomodoro, concentrati e succhi",
            "Zucchero, caffè, cacao e tè",
            "Frutta secca e prodotti lattiero-caseari",
            "Alimenti per l'infanzia, carne e pesce",
            "Alimenti in scatola, surgelati ed essiccati",
            "Lievito",
        ]),
        "فحص ما قبل التصنيع": ("Ispezione prima della produzione", [
            "Ispezione visiva delle materie prime",
            "Campionamento casuale e prove preliminari",
            "Verifica dei certificati e dei documenti allegati per accertarne la conformità alle "
            "specifiche richieste",
            "Emissione dei rapporti di approvazione delle materie prime destinate alla produzione",
        ]),
        "فحص ما قبل الشحن": ("Ispezione prima della spedizione", [
            "Ispezione dei depositi per verificarne l'idoneità",
            "Ispezione degli edifici e dei macchinari degli stabilimenti",
            "Valutazione dei sistemi di controllo qualità",
            "Controlli igienico-sanitari",
            "Ispezione dei processi di produzione",
        ]),
        "خدمات فحص الزيوت": ("Servizi di ispezione di oli e idrocarburi", [
            "Petrolio greggio e suoi derivati",
            "Prodotti petroliferi gassosi, liquidi e solidi",
        ]),
        "خدمات أخذ العينات والاختبار": ("Servizi di campionamento e prova", [
            "Campionamento presso stabilimenti, magazzini e impianti di trasporto",
            "Esecuzione di prove e validazione",
        ]),
        "أثناء فحص الشحنة": ("Ispezione durante la spedizione", [
            "Ispezione iniziale dei mezzi di trasporto",
            "Verifica dell'assenza di perdite o difetti",
            "Verifica delle marcature e dei numeri di trasporto",
            "Ispezione visiva della merce",
            "Supervisione delle operazioni di carico e scarico: verifica delle condizioni di "
            "trasporto",
        ]),
        "التفتيش عند الوصول": ("Ispezione all'arrivo", [
            "Campionamento e prove all'arrivo",
            "Monitoraggio della merce fino alla consegna finale",
            "Assicurazione della qualità e valutazione di fattori ambientali come la temperatura",
            "Valutazione fotografica della merce",
        ]),
    },
}

CHINESE = {
    "tagline": "Al-Diwan 检验与合规",
    "post_category": ("综合", "general"),
    "content_blocks": {
        "home_hero": (
            "",
            "我们依据本领域公认的国际规则，提供检验与合规服务。",
        ),
        "home_intro": (
            "以极致的态度完成每一项工作",
            "在 Al-Diwan 检验与合规，我们相信精确、专注与周密的力量。我们的团队以真诚的投入，交付符合最高"
            "准确性与可靠性标准的结果。我们深知，每一次检验与合规核查都必须做到一丝不苟。对卓越的坚持促使"
            "我们超越预期，确保工作不仅得以完成，而且一次做对。\n\n"
            "请信赖 Al-Diwan，每一次都高效而准确地完成任务。",
        ),
        "vision": (
            "我们的愿景",
            "我们致力于以高质量的服务、严谨的作业和准时的交付赢得客户满意。我们承诺始终保持出色的服务水准，"
            "全面满足客户的需求与期望。",
        ),
        "mission": (
            "我们的使命",
            "我们的目标是提供高水准的服务，重新定义检验公司的概念与角色，并为经济部门的发展作出积极贡献。",
        ),
        "goal": (
            "我们的目标",
            "在各个行业以专业方式提供检验、监督与合规服务，并恪守利比亚境内公认的国际标准。作为中立机构，"
            "我们依照国家有关检验与质量控制服务的法规和立法，为尊贵的客户提供服务。",
        ),
        "team_intro": (
            "训练有素的团队",
            "我们全面的专业服务由一支敬业出色的团队提供，满足各类客户的需求。\n\n"
            "作为一家公司，我们在各类生产现场对各种货物、货载与产品进行检验，无论在利比亚境内还是境外，"
            "涵盖制造过程中与制造之后。公司以卓越的服务为傲，使我们能够迅速且极为准确地承接各类任务。我们的"
            "团队由资历深厚的检验员与专家组成，在众多领域拥有广泛经验。",
        ),
        "quality_policy": (
            "质量方针",
            "作为检验与合规服务领域的专家，Al-Diwan 检验与合规承诺通过符合 ISO 9001:2015 与 "
            "ISO/IEC 17020:2012 国际标准的综合管理体系，提供满足客户需求与期望的高质量服务。\n\n"
            "为实现公司的服务质量目标并确保客户的最大满意度，高层管理者确立了以下核心价值与原则，作为组织内"
            "一切活动、计划与发展目标的指导框架：",
        ),
        "about_intro": (
            "关于我们",
            "Al-Diwan 检验与合规是一家总部位于利比亚米苏拉塔的独立公司，专注于依据国际规范提供检验与合规"
            "服务。我们以中立第三方身份运作，专注于质量控制与工业检验服务。我们的首要目标是运用最新技术与"
            "丰富经验，提供最高质量的检验服务。",
        ),
        "about_services_intro": (
            "我们的服务",
            "我们在本地与全球各个层面提供全面的检验服务，覆盖世界上大多数国家。我们的检验涵盖广泛的产品"
            "类别，确保符合质量管理标准（ISO 9001）与检验机构标准（ISO 17020）。",
        ),
        "about_closing": (
            "",
            "Al-Diwan 检验与合规持续拓展其卓越的合作网络，汇聚越来越多高效的工作团队。\n\n"
            "我们的工作依托于一支由资深工程师与技术专家组成的队伍，他们都具备同样的特质：经验、持久的热情"
            "与自我驱动力，并以在市场中追求卓越与领先作为首要目标。",
        ),
    },
    "quality_principles": [
        "公司各项运营均以目标为导向。",
        "以完全的诚信与独立性坚持卓越。",
        "遵守专业、法律与监管方面的要求。",
        "遵守基于国际标准 ISO 9001:2015 的质量管理体系要求。",
        "遵守基于国际标准 ISO/IEC 17020:2012 的检验机构要求。",
    ],
    "service_categories": {
        "خدمات الفحص الطبي": ("医药检验服务", [
            "药品与药物制剂",
            "药物制剂",
            "血清与疫苗",
            "医用材料",
        ]),
        "خدمات التفتيش الصناعي": ("工业检验服务", [
            "各类材料（金属、矿石与贵金属）、工厂组件、海水淡化与水处理厂设备，以及发电、输电与配电站设备",
            "各类机械与备件、重型和轻型工业设备及起重机",
            "电气与电子设备、通信与导航系统",
            "用于医院和诊所配置的医疗器械与设备",
            "货船、渔业平台与船用备件",
            "以及更多",
        ]),
        "خدمات فحص الأغذية": ("食品检验服务", [
            "谷物与种子",
            "面粉与动物饲料",
            "大米、水果、蔬菜与豆类",
            "种薯与树苗",
            "食用油、番茄酱、浓缩汁与果汁",
            "糖、咖啡、可可与茶叶",
            "坚果与乳制品",
            "婴幼儿食品、肉类与鱼类",
            "罐装、冷冻与干制食品",
            "酵母",
        ]),
        "فحص ما قبل التصنيع": ("生产前检验", [
            "原材料的目视检查",
            "随机取样与初步检测",
            "审核证书及随附文件，确认其符合规定的技术要求",
            "签发投产原材料的批准报告",
        ]),
        "فحص ما قبل الشحن": ("装运前检验", [
            "检查仓储设施是否适用",
            "检查厂房与机器设备",
            "评估质量控制体系",
            "卫生与清洁检查",
            "检查生产工艺流程",
        ]),
        "خدمات فحص الزيوت": ("油品检验服务", [
            "原油及其衍生产品",
            "气态、液态与固态石油产品",
        ]),
        "خدمات أخذ العينات والاختبار": ("取样与检测服务", [
            "在工厂、仓库与运输设施取样",
            "开展检测与验证",
        ]),
        "أثناء فحص الشحنة": ("运输过程检验", [
            "运输工具的初步检查",
            "确认无渗漏或缺陷",
            "核对运输标记与编号",
            "货物的目视检查",
            "监督装卸作业——检查运输条件",
        ]),
        "التفتيش عند الوصول": ("到货检验", [
            "到货时取样与检测",
            "跟踪货物直至最终交付",
            "质量保证以及温度等环境因素影响的评估",
            "货物的影像记录评估",
        ]),
    },
}

TURKISH = {
    "tagline": "Al-Diwan Denetim ve Uygunluk",
    "post_category": ("Genel", "genel"),
    "content_blocks": {
        "home_hero": (
            "",
            "Bu alanda tanınan uluslararası kurallara uygun olarak denetim ve uygunluk hizmetleri "
            "sunuyoruz.",
        ),
        "home_intro": (
            "İşi eksiksiz yapma tutkusu",
            "Al-Diwan Denetim ve Uygunluk olarak kesinliğin, özverinin ve titizliğin gücüne "
            "inanıyoruz. Ekibimiz, en yüksek doğruluk ve güvenilirlik standartlarını karşılayan "
            "sonuçlar sunmak için gerçek bir bağlılıkla çalışır. Her denetimin ve her uygunluk "
            "kontrolünün en ince ayrıntısına kadar özenle yürütülmesinin ne kadar önemli olduğunu "
            "biliyoruz. Mükemmelliğe olan bağlılığımız bizi beklentilerin ötesine taşır; işin "
            "yalnızca bitirilmesini değil, ilk seferde doğru yapılmasını sağlar.\n\n"
            "İşin her seferinde verimli ve doğru biçimde tamamlanması için Al-Diwan'a güvenin.",
        ),
        "vision": (
            "Vizyonumuz",
            "Yüksek kaliteli hizmet, işte titizlik ve zamanında teslim yoluyla müşteri "
            "memnuniyetine ulaşmayı hedefliyoruz. Müşterilerimizin ihtiyaç ve beklentilerini "
            "eksiksiz karşılayan üstün bir hizmet düzeyini sürdürmeye kararlıyız.",
        ),
        "mission": (
            "Misyonumuz",
            "Amacımız, denetim şirketlerinin kavramını ve rolünü yeniden tanımlayan üst düzey "
            "hizmetler sunmak ve ekonomik sektörün büyümesine etkin biçimde katkıda bulunmaktır.",
        ),
        "goal": (
            "Hedefimiz",
            "Tüm sektörlerde denetim, gözetim ve uygunluk hizmetlerini profesyonel biçimde sunmak "
            "ve Libya'da uluslararası kabul görmüş standartlara bağlı kalmak. Tarafsız bir kuruluş "
            "olarak, değerli müşterilerimize devletin denetim ve kalite kontrol hizmetlerine "
            "ilişkin mevzuatı ve düzenlemeleri doğrultusunda hizmet veriyoruz.",
        ),
        "team_intro": (
            "Tam donanımlı bir ekip",
            "Kapsamlı profesyonel hizmet yelpazemiz, işine bağlı mükemmel ekibimiz aracılığıyla "
            "çok çeşitli müşterilerin ihtiyaçlarını karşılar.\n\n"
            "Bir şirket olarak, Libya içinde ya da dışında, üretim sırasında ve sonrasında her "
            "türlü mal, yük ve ürün için çeşitli üretim sahalarında denetim yapıyoruz. "
            "Şirketimiz, geniş bir görev yelpazesini hızla ve en yüksek doğrulukla üstlenmemizi "
            "sağlayan istisnai hizmetler sunmaktan gurur duyar. Ekibimiz, pek çok alanda geniş "
            "deneyime sahip, üst düzey nitelikli denetçi ve uzmanlardan oluşur.",
        ),
        "quality_policy": (
            "Kalite politikası",
            "Denetim ve uygunluk hizmetlerinde uzman olan Al-Diwan Denetim ve Uygunluk, "
            "ISO 9001:2015 ve ISO/IEC 17020:2012 uluslararası standartlarına uygun kapsamlı bir "
            "yönetim sistemi aracılığıyla, müşterilerinin ihtiyaç ve beklentilerini karşılayan "
            "yüksek kaliteli hizmetler sunmayı taahhüt eder.\n\n"
            "Şirketin hizmet kalitesi hedeflerine ulaşmak ve azami müşteri memnuniyetini sağlamak "
            "amacıyla üst yönetim, kuruluş içindeki tüm faaliyet, plan ve gelişim hedefleri için "
            "yol gösterici bir çerçeve olarak aşağıdaki temel değer ve ilkeleri belirlemiştir:",
        ),
        "about_intro": (
            "Hakkımızda",
            "Al-Diwan Denetim ve Uygunluk, Libya'nın Misrata şehrinde kurulu, uluslararası "
            "düzenlemelere uygun denetim ve uygunluk hizmetlerinde uzmanlaşmış bağımsız bir "
            "şirkettir. Tarafsız üçüncü taraf olarak çalışır, kalite kontrol ve endüstriyel "
            "denetim hizmetlerine odaklanırız. Temel hedefimiz, en yeni tekniklerden ve geniş "
            "deneyimimizden yararlanarak en yüksek kalitede denetim hizmeti sunmaktır.",
        ),
        "about_services_intro": (
            "Hizmetlerimiz",
            "Yerel ve küresel ölçekte, dünyanın çoğu ülkesini kapsayacak şekilde her düzeyde "
            "kapsamlı denetim hizmetleri sunuyoruz. Denetimlerimiz geniş bir ürün yelpazesini "
            "kapsar ve kalite yönetimi standartlarına (ISO 9001) ile denetim kuruluşu şartlarına "
            "(ISO 17020) uygunluğu güvence altına alır.",
        ),
        "about_closing": (
            "",
            "Al-Diwan Denetim ve Uygunluk, seçkin ilişki ağını sürekli geliştirmek için çalışır ve "
            "giderek artan sayıda etkin ekiple çevrelenir.\n\n"
            "Çalışmalarımız, tamamı aynı niteliklere sahip yetkin mühendisler ve teknik "
            "uzmanlardan oluşan bir kadroya dayanır: deneyim, kalıcı istek ve öz motivasyon. Bu "
            "kadro, pazarda mükemmelliği ve öncülüğü ilk hedefi sayar.",
        ),
    },
    "quality_principles": [
        "Şirketin tüm operasyonlarında hedefe odaklı bir yaklaşım.",
        "Tam dürüstlük ve bağımsızlıkla mükemmelliğe bağlılık.",
        "Mesleki, yasal ve düzenleyici şartlara uyum.",
        "ISO 9001:2015 uluslararası standardına dayalı kalite yönetim sistemi şartlarına uyum.",
        "ISO/IEC 17020:2012 uluslararası standardına dayalı denetim kuruluşu şartlarına uyum.",
    ],
    "service_categories": {
        "خدمات الفحص الطبي": ("Tıbbi denetim hizmetleri", [
            "İlaçlar ve farmasötik müstahzarlar",
            "Farmasötik müstahzarlar",
            "Serumlar ve aşılar",
            "Tıbbi malzemeler",
        ]),
        "خدمات التفتيش الصناعي": ("Endüstriyel denetim hizmetleri", [
            "Her türden malzeme (metaller, cevherler ve kıymetli madenler), fabrika bileşenleri, "
            "su arıtma ve tuzdan arındırma tesisi ekipmanları ile enerji üretim, iletim ve dağıtım "
            "istasyonları",
            "Her türlü makine ve yedek parça, ağır ve hafif endüstriyel ekipman ve vinçler",
            "Elektrikli ve elektronik ekipmanlar, haberleşme ve seyrüsefer sistemleri",
            "Hastane ve kliniklerin donatılmasına yönelik tıbbi cihaz ve ekipmanlar",
            "Yük gemileri, balıkçılık platformları ve denizcilik yedek parçaları",
            "Ve çok daha fazlası",
        ]),
        "خدمات فحص الأغذية": ("Gıda denetim hizmetleri", [
            "Tahıllar ve tohumlar",
            "Un ve hayvan yemi",
            "Pirinç, meyve, sebze ve bakliyat",
            "Tohumluk patates ve ağaç fidanları",
            "Yemeklik yağlar, salça, konsantreler ve meyve suları",
            "Şeker, kahve, kakao ve çay",
            "Kuruyemiş ve süt ürünleri",
            "Bebek maması, et ve balık",
            "Konserve, dondurulmuş ve kurutulmuş gıdalar",
            "Maya",
        ]),
        "فحص ما قبل التصنيع": ("Üretim öncesi denetim", [
            "Hammaddelerin gözle muayenesi",
            "Rastgele numune alma ve ön testler",
            "Sertifikaların ve ekli belgelerin istenen şartnamelere uygunluğunun incelenmesi",
            "Üretime girecek hammaddeler için onay raporlarının düzenlenmesi",
        ]),
        "فحص ما قبل الشحن": ("Sevkiyat öncesi denetim", [
            "Depolama tesislerinin uygunluğunun denetlenmesi",
            "Fabrika binalarının ve makinelerinin denetlenmesi",
            "Kalite kontrol sistemlerinin değerlendirilmesi",
            "Hijyen ve sağlık kontrolleri",
            "Üretim süreçlerinin denetlenmesi",
        ]),
        "خدمات فحص الزيوت": ("Akaryakıt ve yağ denetim hizmetleri", [
            "Ham petrol ve türevleri",
            "Gaz, sıvı ve katı petrol ürünleri",
        ]),
        "خدمات أخذ العينات والاختبار": ("Numune alma ve test hizmetleri", [
            "Fabrikalarda, depolarda ve nakliye tesislerinde numune alma",
            "Testlerin yürütülmesi ve doğrulama",
        ]),
        "أثناء فحص الشحنة": ("Sevkiyat sırasında denetim", [
            "Nakliye araçlarının ilk denetimi",
            "Sızıntı veya kusur bulunmadığının doğrulanması",
            "Nakliye işaret ve numaralarının doğrulanması",
            "Sevkiyatın gözle muayenesi",
            "Yükleme ve boşaltma işlemlerinin gözetimi — nakliye koşullarının kontrolü",
        ]),
        "التفتيش عند الوصول": ("Varışta denetim", [
            "Varışta numune alma ve test",
            "Sevkiyatın nihai teslimata kadar izlenmesi",
            "Kalite güvencesi ve sıcaklık gibi çevresel etkenlerin değerlendirilmesi",
            "Sevkiyatın fotoğrafla değerlendirilmesi",
        ]),
    },
}

# Keyed by the Django language code, which is what parler stores.
TRANSLATIONS = {
    "es": SPANISH,
    "it": ITALIAN,
    "zh-hans": CHINESE,
    "tr": TURKISH,
}


class Command(BaseCommand):
    help = "Seed draft es/it/zh-hans/tr translations for site content (review before launch)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--lang",
            action="append",
            choices=sorted(TRANSLATIONS),
            help="Only seed this language. Repeatable; defaults to all four.",
        )

    def handle(self, *args, **options):
        codes = options.get("lang") or sorted(TRANSLATIONS)

        backfilled = 0
        for category in ServiceCategory.objects.all():
            if category.icon:
                continue
            arabic_name = category.safe_translation_getter(
                "name", language_code="ar", any_language=True
            )
            key = CATEGORY_KEYS.get(arabic_name)
            if key:
                category.icon = key
                category.save(update_fields=["icon"])
                backfilled += 1
        if backfilled:
            self.stdout.write(self.style.SUCCESS(f"Backfilled icon key on {backfilled} categories"))

        for code in codes:
            self.seed_language(code, TRANSLATIONS[code])

        self.stdout.write(self.style.WARNING(
            "Draft translations — have the company review them in /admin/ before launch."
        ))

    def seed_language(self, code, data):
        settings_obj = SiteSettings.load()
        settings_obj.set_current_language(code)
        settings_obj.tagline = data["tagline"]
        settings_obj.save()

        blocks = 0
        for slug, (title, body) in data["content_blocks"].items():
            block = ContentBlock.objects.filter(slug=slug).first()
            if not block:
                continue
            block.set_current_language(code)
            block.title = title
            block.body = body
            block.save()
            blocks += 1

        principles = QualityPrinciple.objects.order_by("order")
        texts = data["quality_principles"]
        if principles.count() != len(texts):
            raise CommandError(
                f"{code}: {principles.count()} quality principles in the database but "
                f"{len(texts)} translations — they are matched by order, so re-run "
                f"seed_content or fix the list."
            )
        for principle, text in zip(principles, texts):
            principle.set_current_language(code)
            principle.text = text
            principle.save()

        categories = 0
        for category in ServiceCategory.objects.all():
            arabic_name = category.safe_translation_getter(
                "name", language_code="ar", any_language=True
            )
            entry = data["service_categories"].get(arabic_name)
            if not entry:
                self.stdout.write(self.style.WARNING(
                    f"{code}: no translation for service category {arabic_name!r} — skipped"
                ))
                continue
            name, item_texts = entry
            items = category.items.order_by("order")
            if items.count() != len(item_texts):
                raise CommandError(
                    f"{code}: {arabic_name!r} has {items.count()} items but "
                    f"{len(item_texts)} translations — they are matched by order."
                )
            category.set_current_language(code)
            category.name = name
            category.save()
            for item, text in zip(items, item_texts):
                item.set_current_language(code)
                item.text = text
                item.save()
            categories += 1

        post_category = Category.objects.first()
        if post_category:
            name, slug = data["post_category"]
            post_category.set_current_language(code)
            post_category.name = name
            post_category.slug = slug
            post_category.save()

        self.stdout.write(self.style.SUCCESS(
            f"{code}: {blocks} content blocks, {len(texts)} principles, "
            f"{categories} service categories"
        ))
