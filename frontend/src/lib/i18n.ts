/**
 * UI-string translations. Database content (services, posts, content blocks)
 * is translated server-side by parler and arrives already localised — this
 * only covers strings that live in the frontend.
 */

import type { Lang } from "./api";

export const LANGS: Lang[] = ["ar", "en"];
export const DEFAULT_LANG: Lang = "ar";

export function isLang(value: string | undefined): value is Lang {
  return value === "ar" || value === "en";
}

export function dirFor(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}

const strings = {
  // Navigation
  home: { ar: "الرئيسية", en: "Home" },
  services: { ar: "خدماتنا", en: "Services" },
  about: { ar: "من نحن", en: "About" },
  blog: { ar: "المدونة", en: "Blog" },
  contact: { ar: "تواصل معنا", en: "Contact" },
  mainNav: { ar: "التنقل الرئيسي", en: "Main navigation" },
  openMenu: { ar: "فتح القائمة", en: "Open menu" },
  closeMenu: { ar: "إغلاق القائمة", en: "Close menu" },
  skipToContent: { ar: "تخطى إلى المحتوى", en: "Skip to content" },
  companyName: { ar: "شركة الديوان", en: "Al-Diwan" },
  companyTagline: { ar: "للتفتيش والمطابقة", en: "Inspection & Conformity" },
  logoAlt: { ar: "شعار شركة الديوان للتفتيش والمطابقة", en: "Al-Diwan Inspection & Conformity logo" },

  // Hero
  heroEyebrow: { ar: "طرف ثالث محايد", en: "Independent third party" },
  heroTitle: {
    ar: "التفتيش والمطابقة، بدقة تُبنى عليها القرارات.",
    en: "Inspection and conformity, precise enough to decide on.",
  },
  requestQuote: { ar: "اطلب عرض سعر", en: "Request a quote" },
  exploreServices: { ar: "استعرض خدماتنا", en: "Explore our services" },
  qualityManagement: { ar: "نظام إدارة الجودة", en: "Quality management system" },
  inspectionBodies: { ar: "متطلبات هيئات التفتيش", en: "Requirements for inspection bodies" },
  shipAlt: {
    ar: "سفينة حاويات أثناء التفريغ في الميناء",
    en: "Container ship being unloaded at port",
  },

  // Trust bar
  trustIndependent: { ar: "مستقلة", en: "Independent" },
  trustIndependentSub: { ar: "طرف ثالث محايد", en: "Neutral third party" },
  trustAccredited: { ar: "معتمدة", en: "Accredited" },
  trustAccreditedSub: { ar: "وفق المعايير الدولية", en: "To international standards" },
  trustMisrata: { ar: "مصراتة", en: "Misrata" },
  trustMisrataSub: { ar: "المقر الرئيسي، ليبيا", en: "Head office, Libya" },
  trustTeam: { ar: "فريق مؤهل", en: "Qualified team" },
  trustTeamSub: { ar: "مهندسون ومتخصصون فنيون", en: "Engineers and technical specialists" },

  // Sections
  ourServices: { ar: "خدماتنا", en: "Our services" },
  servicesHeading: {
    ar: "تغطية تشمل كل ما يُفحص ويُشحن",
    en: "Coverage for everything inspected and shipped",
  },
  allServices: { ar: "تفاصيل كل الخدمات", en: "See all services" },
  moreItems: { ar: "عنصر إضافي", en: "more" },
  methodology: { ar: "منهجية العمل", en: "How we work" },
  processHeading: {
    ar: "نرافق الشحنة من المصنع حتى التسليم",
    en: "We follow the shipment from factory to delivery",
  },
  processLede: {
    ar: "أربع مراحل متصلة، كل واحدة منها موثّقة بتقرير.",
    en: "Four connected stages, each documented in a report.",
  },
  fieldWork: { ar: "من الميدان", en: "From the field" },
  fieldWorkHeading: { ar: "مفتشونا في مواقع العمل", en: "Our inspectors on site" },
  fieldWorkLede: {
    ar: "صور حقيقية من عمليات تفتيش نفّذها فريقنا — لا صور تجارية جاهزة.",
    en: "Real photographs from inspections carried out by our team — not stock imagery.",
  },
  inspectionContainerAlt: {
    ar: "مفتش من شركة الديوان يفحص شحنة داخل حاوية",
    en: "An Al-Diwan inspector checking cargo inside a container",
  },
  inspectionDocumentsAlt: {
    ar: "مفتش يراجع وثائق الشحنة ويوثّقها",
    en: "An inspector reviewing and documenting shipment paperwork",
  },
  qualityPolicy: { ar: "سياسة الجودة", en: "Quality policy" },
  qualityHeading: {
    ar: "الالتزام ليس شعارًا، بل نظام إداري موثّق",
    en: "Commitment isn't a slogan — it's a documented management system",
  },
  latestNews: { ar: "آخر الأخبار والمقالات", en: "Latest news and articles" },
  ctaHeading: { ar: "لديك شحنة تحتاج تفتيشًا؟", en: "Have a shipment that needs inspecting?" },
  ctaLede: {
    ar: "أرسل لنا تفاصيل الشحنة أو المنتج، وسنعود إليك بخطة تفتيش وعرض سعر واضح.",
    en: "Send us the shipment or product details and we'll come back with an inspection plan and a clear quote.",
  },
  whatsapp: { ar: "واتساب", en: "WhatsApp" },

  // Services page
  whatWeOffer: { ar: "ما نقدمه", en: "What we offer" },
  servicesPageTitle: { ar: "خدمات التفتيش والمطابقة", en: "Inspection and conformity services" },
  bySector: { ar: "حسب القطاع", en: "By sector" },
  sectorsHeading: { ar: "قطاعات نغطيها", en: "Sectors we cover" },
  shipmentCycle: { ar: "دورة الشحنة", en: "Shipment cycle" },
  notFoundService: { ar: "لم تجد الخدمة التي تبحث عنها؟", en: "Didn't find the service you need?" },
  notFoundServiceLede: {
    ar: "قائمتنا تغطي أكثر ما يُشحن ويُفحص، لكنها ليست حصرية. أخبرنا بما لديك.",
    en: "Our list covers most of what gets shipped and inspected, but it isn't exhaustive. Tell us what you have.",
  },
  askDirectly: { ar: "اسألنا مباشرة", en: "Ask us directly" },

  // About page
  theCompany: { ar: "الشركة", en: "The company" },
  aboutTitle: { ar: "طرف ثالث محايد، مقره مصراتة", en: "An independent third party, based in Misrata" },
  ourTeam: { ar: "فريق العمل", en: "Our team" },
  ourNetwork: { ar: "شبكتنا", en: "Our network" },
  neutralHeading: { ar: "نعمل معك كطرف محايد", en: "We work with you as a neutral party" },
  neutralLede: {
    ar: "استقلاليتنا هي ما يجعل تقاريرنا ذات قيمة. تواصل معنا لمناقشة احتياجك.",
    en: "Our independence is what gives our reports their value. Get in touch to discuss what you need.",
  },

  // Blog
  blogTitle: { ar: "أخبار ومقالات", en: "News and articles" },
  blogLede: {
    ar: "تحديثات من الشركة، ومواد حول معايير التفتيش ومراقبة الجودة.",
    en: "Company updates and material on inspection and quality-control standards.",
  },
  allCategories: { ar: "الكل", en: "All" },
  noPosts: { ar: "لا توجد منشورات منشورة بعد.", en: "No published posts yet." },
  readNext: { ar: "اقرأ أيضًا", en: "Read next" },
  backToBlog: { ar: "العودة إلى المدونة", en: "Back to the blog" },

  // Contact
  howToReach: { ar: "كيفية التواصل؟", en: "How to reach us" },
  contactTitle: { ar: "يمكنك دائمًا العثور علينا هنا", en: "You can always find us here" },
  contactLede: {
    ar: "أرسل تفاصيل شحنتك أو استفسارك، وسيصلك الرد من فريقنا مباشرة.",
    en: "Send your shipment details or a question, and our team will reply directly.",
  },
  contactDetails: { ar: "معلومات الاتصال", en: "Contact details" },
  sendMessage: { ar: "أرسل لنا رسالة", en: "Send us a message" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  location: { ar: "الموقع", en: "Location" },
  facebookPage: { ar: "صفحة فيسبوك", en: "Facebook page" },
  nameLabel: { ar: "الاسم", en: "Name" },
  namePlaceholder: { ar: "اسمك الكامل", en: "Your full name" },
  subjectLabel: { ar: "الموضوع", en: "Subject" },
  subjectPlaceholder: { ar: "مثال: طلب عرض سعر لفحص شحنة", en: "e.g. Quote request for shipment inspection" },
  messageLabel: { ar: "رسالتك", en: "Your message" },
  messagePlaceholder: { ar: "اشرح لنا احتياجك بإيجاز…", en: "Briefly describe what you need…" },
  send: { ar: "إرسال الرسالة", en: "Send message" },
  sending: { ar: "جارٍ الإرسال…", en: "Sending…" },
  contactSuccess: {
    ar: "تم استلام رسالتك. سنتواصل معك قريبًا.",
    en: "Your message has been received. We'll be in touch shortly.",
  },
  contactError: {
    ar: "تعذّر إرسال الرسالة. حاول مرة أخرى أو راسلنا مباشرة.",
    en: "The message couldn't be sent. Please try again or email us directly.",
  },
  required: { ar: "هذا الحقل مطلوب", en: "This field is required" },
  invalidEmail: { ar: "بريد إلكتروني غير صالح", en: "Invalid email address" },

  // Footer
  links: { ar: "روابط", en: "Links" },
  accreditations: { ar: "الاعتمادات", en: "Accreditations" },
  rightsReserved: {
    ar: "شركة الديوان للتفتيش والمطابقة. جميع الحقوق محفوظة.",
    en: "Al-Diwan Inspection & Conformity. All rights reserved.",
  },
  misrataLibya: { ar: "مصراتة، ليبيا", en: "Misrata, Libya" },
  footerBlurb: {
    ar: "شركة مستقلة مقرها مصراتة، ليبيا. نعمل كطرف ثالث محايد في خدمات التفتيش ومراقبة الجودة وفق المعايير الدولية.",
    en: "An independent company based in Misrata, Libya. We act as a neutral third party in inspection and quality-control services under international standards.",
  },

  // Dashboard
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  staffDashboard: { ar: "لوحة تحكم الموظفين", en: "Staff dashboard" },
  signIn: { ar: "دخول", en: "Sign in" },
  signingIn: { ar: "جارٍ الدخول…", en: "Signing in…" },
  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  username: { ar: "اسم المستخدم", en: "Username" },
  password: { ar: "كلمة المرور", en: "Password" },
  loginFailed: { ar: "اسم المستخدم أو كلمة المرور غير صحيحة.", en: "Incorrect username or password." },
  backToSite: { ar: "العودة إلى الموقع", en: "Back to the site" },
  posts: { ar: "المنشورات", en: "Posts" },
  messages: { ar: "الرسائل", en: "Messages" },
  fullAdmin: { ar: "الإدارة الكاملة", en: "Full admin" },
  viewSite: { ar: "عرض الموقع", en: "View site" },
  newPost: { ar: "منشور جديد", en: "New post" },
  editPost: { ar: "تعديل منشور", en: "Edit post" },
  title: { ar: "العنوان", en: "Title" },
  slug: { ar: "الرابط", en: "Slug" },
  category: { ar: "التصنيف", en: "Category" },
  author: { ar: "الكاتب", en: "Author" },
  status: { ar: "الحالة", en: "Status" },
  publishedAt: { ar: "تاريخ النشر", en: "Published" },
  excerpt: { ar: "مقتطف", en: "Excerpt" },
  content: { ar: "المحتوى", en: "Content" },
  save: { ar: "حفظ", en: "Save" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…" },
  saved: { ar: "تم الحفظ.", en: "Saved." },
  delete: { ar: "حذف", en: "Delete" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  back: { ar: "رجوع", en: "Back" },
  confirmDelete: { ar: "هل تريد حذف هذا المنشور؟ لا يمكن التراجع.", en: "Delete this post? This cannot be undone." },
  noPostsYet: { ar: "لا توجد منشورات بعد.", en: "No posts yet." },
  draft: { ar: "مسودة", en: "Draft" },
  scheduled: { ar: "مجدول", en: "Scheduled" },
  published: { ar: "منشور", en: "Published" },
  editingLanguage: { ar: "لغة التحرير", en: "Editing language" },
  editingLanguageNote: {
    ar: "تحرّر الآن النسخة المعروضة فقط — النسخ الأخرى لا تتأثر.",
    en: "You're editing only the language shown — other versions are unaffected.",
  },
  arabic: { ar: "العربية", en: "Arabic" },
  english: { ar: "الإنجليزية", en: "English" },
  newMessage: { ar: "رسالة جديدة", en: "New message" },
  subject: { ar: "الموضوع", en: "Subject" },
  from: { ar: "من", en: "From" },
  assignedTo: { ar: "مسندة إلى", en: "Assigned to" },
  updated: { ar: "آخر تحديث", en: "Updated" },
  unread: { ar: "جديد", en: "New" },
  noMessages: { ar: "لا توجد رسائل.", en: "No messages." },
  statusOpen: { ar: "مفتوحة", en: "Open" },
  statusPending: { ar: "بانتظار الرد", en: "Awaiting reply" },
  statusClosed: { ar: "مغلقة", en: "Closed" },
  assignedToMe: { ar: "المسندة إليّ", en: "Assigned to me" },
  assignToMe: { ar: "إسناد إليّ", en: "Assign to me" },
  close: { ar: "إغلاق", en: "Close" },
  reply: { ar: "الرد", en: "Reply" },
  replySend: { ar: "إرسال", en: "Send" },
  recipientEmail: { ar: "البريد الإلكتروني للمستلم", en: "Recipient email" },
  recipientName: { ar: "اسم المستلم", en: "Recipient name" },
  noAccess: {
    ar: "لا تملك صلاحيات وصول لأي قسم بعد. تواصل مع المسؤول.",
    en: "You don't have access to any section yet. Contact an administrator.",
  },
  loading: { ar: "جارٍ التحميل…", en: "Loading…" },
  errorLoading: { ar: "تعذّر تحميل البيانات.", en: "Couldn't load data." },
  notFound: { ar: "الصفحة غير موجودة", en: "Page not found" },
  notFoundLede: { ar: "الرابط الذي طلبته غير متاح.", en: "The page you requested isn't available." },
  goHome: { ar: "العودة للرئيسية", en: "Go home" },
} as const;

export type StringKey = keyof typeof strings;

export function t(key: StringKey, lang: Lang): string {
  return strings[key][lang];
}

/** Curried helper so components can do `const tr = useT(lang)` then `tr("home")`. */
export function makeT(lang: Lang) {
  return (key: StringKey) => t(key, lang);
}
