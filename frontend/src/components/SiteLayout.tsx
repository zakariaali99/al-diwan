import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import logo from "@/assets/logo.png";
import { useLang, useLinkTo, useSiteSettings, useT } from "@/lib/hooks";
import { LANGS, LANG_META } from "@/lib/i18n";
import {
  CloseIcon,
  FacebookIcon,
  InstagramIcon,
  MenuIcon,
  WhatsAppIcon,
  XIcon,
} from "./Icons";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

function Header() {
  const t = useT();
  const lang = useLang();
  const linkTo = useLinkTo();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navItems = [
    { to: linkTo(""), label: t("home"), end: true },
    { to: linkTo("services/"), label: t("services") },
    { to: linkTo("about-us/"), label: t("about") },
    { to: linkTo("posts/"), label: t("blog") },
    { to: linkTo("contact-us/"), label: t("contact") },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b bg-surface/85 backdrop-blur-lg transition-shadow ${
          scrolled ? "border-line shadow-sm" : "border-transparent"
        }`}
      >
        <div className="container-page flex min-h-[76px] items-center gap-4">
          <Link to={linkTo("")} className="flex shrink-0 items-center gap-3">
            <img src={logo} alt={t("logoAlt")} className="h-12 w-12" width={48} height={48} />
            <span className="flex flex-col leading-tight">
              <strong className="text-base font-bold text-body">{t("companyName")}</strong>
              <span className="text-[0.7rem] font-medium text-muted">{t("companyTagline")}</span>
            </span>
          </Link>

          <nav className="ms-auto hidden items-center gap-1 lg:flex" aria-label={t("mainNav")}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-[0.95rem] font-medium transition-colors ${
                    isActive ? "bg-brand-tint text-brand-700 dark:text-brand-200" : "text-body hover:bg-subtle hover:text-brand-600"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-2 lg:ms-0">
            <div className="hidden items-center gap-2 sm:flex">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-lg border border-line text-body lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-drawer"
              aria-label={t("openMenu")}
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Off-canvas drawer. Rendered outside the sticky header so it can't be
          trapped by the header's stacking context — that was why the old
          panel slid underneath the page content. */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-brand-950/60 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <nav
          id="mobile-drawer"
          aria-label={t("mainNav")}
          className={`absolute inset-y-0 end-0 flex w-[min(20rem,85vw)] flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "ltr:translate-x-full rtl:-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="flex items-center gap-2.5">
              <img src={logo} alt="" className="h-9 w-9" width={36} height={36} />
              <span className="text-sm font-bold text-body">{t("companyName")}</span>
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-line text-body"
              aria-label={t("closeMenu")}
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3.5 text-lg font-medium transition-colors ${
                    isActive ? "bg-brand-tint text-brand-700 dark:text-brand-200" : "text-body hover:bg-subtle"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="border-t border-line p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                {t("appearance")}
              </p>
              <ThemeToggle />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
              {t("chooseLanguage")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(location.pathname.replace(/^\/[a-z-]+/, `/${code}`));
                  }}
                  lang={LANG_META[code].apiLang}
                  dir={code === "ar" ? "rtl" : "ltr"}
                  aria-current={code === lang ? "true" : undefined}
                  className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    code === lang
                      ? "border-brand-600 bg-brand-tint font-semibold text-brand-700 dark:text-brand-200"
                      : "border-line text-body hover:border-brand-600"
                  }`}
                >
                  {LANG_META[code].name}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}

function Footer() {
  const t = useT();
  const linkTo = useLinkTo();
  const { data: site } = useSiteSettings();

  const socials = [
    { url: site?.facebook_url, Icon: FacebookIcon, label: "Facebook" },
    { url: site?.instagram_url, Icon: InstagramIcon, label: "Instagram" },
    { url: site?.x_url, Icon: XIcon, label: "X" },
    { url: site?.whatsapp_url, Icon: WhatsAppIcon, label: t("whatsapp") },
  ].filter((s) => Boolean(s.url));

  return (
    <footer className="mt-auto bg-brand-950 py-16 text-slate-300">
      <div className="container-page">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-12 w-12 rounded-full bg-white/95 p-0.5" width={48} height={48} />
              <span className="flex flex-col leading-tight">
                <strong className="text-base font-bold text-white">{t("companyName")}</strong>
                <span className="text-[0.7rem] text-slate-400">{t("companyTagline")}</span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-400">{t("footerBlurb")}</p>
            {socials.length > 0 && (
              <div className="mt-6 flex gap-3">
                {socials.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition-all hover:-translate-y-0.5 hover:bg-brand-500 hover:text-white"
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">{t("links")}</h4>
            <ul className="flex flex-col gap-3 text-sm">
              {[
                { to: linkTo(""), label: t("home") },
                { to: linkTo("services/"), label: t("services") },
                { to: linkTo("about-us/"), label: t("about") },
                { to: linkTo("posts/"), label: t("blog") },
                { to: linkTo("contact-us/"), label: t("contact") },
              ].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-slate-400 transition-colors hover:text-brand-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">{t("accreditations")}</h4>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              <li>ISO 9001:2015</li>
              <li>ISO/IEC 17020:2012</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">{t("contact")}</h4>
            <ul className="flex flex-col gap-3 text-sm">
              {site?.phone && (
                <li>
                  <a href={site.whatsapp_url || "#"} dir="ltr" className="text-slate-400 hover:text-brand-300">
                    {site.phone}
                  </a>
                </li>
              )}
              {site?.email && (
                <li>
                  <a href={`mailto:${site.email}`} className="text-slate-400 hover:text-brand-300">
                    {site.email}
                  </a>
                </li>
              )}
              {site?.address && (
                <li>
                  <a href={site.map_url || "#"} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-300">
                    {site.address}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} {t("rightsReserved")}</span>
          <span>{t("misrataLibya")}</span>
        </div>
      </div>
    </footer>
  );
}

export default function SiteLayout() {
  const t = useT();
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="absolute start-4 top-[-100px] z-[100] rounded-b-lg bg-brand-600 px-5 py-3 font-semibold text-white transition-all focus:top-0"
      >
        {t("skipToContent")}
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
