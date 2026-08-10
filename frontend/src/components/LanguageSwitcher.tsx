import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useLang, useT } from "@/lib/hooks";
import { LANGS, LANG_META, type Lang } from "@/lib/i18n";
import { CheckIcon, GlobeIcon } from "./Icons";

/**
 * Globe menu for switching language. Swapping keeps the visitor on the same
 * page by rewriting only the /:lang/ prefix.
 */
export default function LanguageSwitcher({ onDark = false }: { onDark?: boolean }) {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const switchTo = (next: Lang) => {
    setOpen(false);
    navigate(location.pathname.replace(/^\/[a-z-]+/, `/${next}`) + location.search, {
      replace: false,
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("chooseLanguage")}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
          onDark
            ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
            : "border-line bg-surface text-body hover:border-brand-600 hover:text-brand-600"
        }`}
      >
        <GlobeIcon className="h-[18px] w-[18px]" />
        <span className="uppercase">{lang}</span>
      </button>

      {open && (
        <ul
          role="menu"
          aria-label={t("chooseLanguage")}
          className="absolute end-0 z-[70] mt-2 min-w-[190px] overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-xl"
        >
          {LANGS.map((code) => {
            const active = code === lang;
            return (
              <li key={code} role="none">
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => switchTo(code)}
                  lang={LANG_META[code].apiLang}
                  dir={code === "ar" ? "rtl" : "ltr"}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-start text-sm transition-colors ${
                    active ? "bg-brand-tint font-semibold text-brand-700 dark:text-brand-200" : "text-body hover:bg-subtle"
                  }`}
                >
                  <span>{LANG_META[code].name}</span>
                  {active ? (
                    <CheckIcon className="h-4 w-4 shrink-0 text-brand-600" />
                  ) : (
                    <span className="text-xs uppercase text-faint">{code}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
