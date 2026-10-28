/**
 * Building blocks shared by every dashboard screen, so each page reads as the
 * same product: one header style, one card style, one way to pick a language.
 */

import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

import { ApiError, type Capability } from "@/lib/api";
import { useCurrentUser, useLang } from "@/lib/hooks";
import { LANGS, LANG_META, apiLangFor, dirFor, isLang, type Lang } from "@/lib/i18n";
import { useDT } from "./strings";

// --- Access ----------------------------------------------------------------

export function useCan() {
  const { data: user } = useCurrentUser();
  const capabilities = new Set(user?.capabilities ?? []);
  return (capability: Capability) => capabilities.has(capability);
}

/** Renders its page only for staff holding `capability`. */
export function RequireCap({ capability, children }: { capability: Capability; children: ReactNode }) {
  const can = useCan();
  const dt = useDT();
  if (!can(capability)) return <Notice tone="warn">{dt("forbidden")}</Notice>;
  return <>{children}</>;
}

// --- Layout ----------------------------------------------------------------

export function PageHeader({ title, lede, actions }: { title: string; lede?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-body">{title}</h1>
        {lede && <p className="mt-1 max-w-2xl text-sm text-muted">{lede}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-base font-bold text-body">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-body">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

const NOTICE_TONES = {
  info: "border-brand-200 bg-brand-tint text-body dark:border-brand-700/50",
  success: "border-green-300 bg-green-50 text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300",
  warn: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200",
  error: "border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300",
};

export function Notice({ tone = "info", children }: { tone?: keyof typeof NOTICE_TONES; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${NOTICE_TONES[tone]}`}
    >
      {children}
    </p>
  );
}

export function Loading() {
  const dt = useDT();
  return <p className="py-10 text-center text-muted">{dt("loading")}</p>;
}

export function LoadError() {
  const dt = useDT();
  return <Notice tone="error">{dt("errorLoading")}</Notice>;
}

export function Empty({ children }: { children?: ReactNode }) {
  const dt = useDT();
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-10 text-center text-muted">
      {children ?? dt("noResults")}
    </div>
  );
}

/** Standard data table wrapper: scrolls sideways on phones instead of the page. */
export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-subtle text-start text-xs uppercase tracking-wide text-muted">{head}</tr>
        </thead>
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-line">{children}</tbody>
      </table>
    </div>
  );
}

export const th = "p-3 text-start font-semibold";
export const td = "p-3 align-middle";

// --- Badges & controls -----------------------------------------------------

const PILL_TONES = {
  green: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  blue: "bg-brand-tint text-brand-700 dark:text-brand-200",
  gray: "bg-subtle text-muted",
  red: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

export function Pill({ tone = "gray", children }: { tone?: keyof typeof PILL_TONES; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${PILL_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <label htmlFor={id} className={`inline-flex items-center gap-3 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        aria-hidden
        className="relative h-6 w-11 shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-brand-600 peer-focus-visible:ring-[3px] peer-focus-visible:ring-brand-400 after:absolute after:start-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5"
      />
      <span className="text-sm text-body">{label}</span>
    </label>
  );
}

export function DeleteButton({
  onConfirm,
  label,
  confirmText,
  pending,
  className = "",
}: {
  onConfirm: () => void;
  label?: string;
  confirmText?: string;
  pending?: boolean;
  className?: string;
}) {
  const dt = useDT();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmText ?? dt("confirmDelete"))) onConfirm();
      }}
      className={`rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10 ${className}`}
    >
      {pending ? dt("deleting") : (label ?? dt("delete"))}
    </button>
  );
}

export const smallBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-sm font-medium text-body transition-colors hover:border-brand-600 hover:text-brand-600 disabled:opacity-50";

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60";

export const filterChip = (active: boolean) =>
  `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
    active ? "bg-brand-600 text-white" : "border border-line bg-surface text-muted hover:border-brand-600 hover:text-brand-600"
  }`;

// --- Editing language ------------------------------------------------------

/** The language being edited, kept in `?lang=` so a reload stays on it. */
export function useEditLang() {
  const uiLang = useLang();
  const [params, setParams] = useSearchParams();
  const raw = params.get("lang") ?? undefined;
  const lang: Lang = isLang(raw) ? raw : uiLang;
  const setLang = (next: Lang) =>
    setParams(
      (previous) => {
        const copy = new URLSearchParams(previous);
        copy.set("lang", next);
        return copy;
      },
      { replace: true },
    );
  return { lang, apiLang: apiLangFor(lang), dir: dirFor(lang), setLang };
}

export function LangTabs({
  value,
  onChange,
  translated,
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
  translated?: string[];
}) {
  const dt = useDT();
  return (
    <div className="mb-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label={dt("editingLanguage")}>
        {LANGS.map((code) => {
          const has = translated?.includes(LANG_META[code].apiLang);
          const active = value === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange(code)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-brand-600 text-white" : "border border-line bg-surface text-muted hover:border-brand-600"
              }`}
            >
              {LANG_META[code].name}
              {translated && (
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full ${
                    has ? (active ? "bg-white" : "bg-green-500") : active ? "bg-white/40" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">{dt("editingLanguageNote")}</p>
    </div>
  );
}

// --- Helpers ---------------------------------------------------------------

export function formatDate(iso: string | null | undefined, lang: Lang, withTime = false) {
  if (!iso) return "—";
  const locale = lang === "zh" ? "zh-CN" : lang === "ar" ? "ar-LY" : lang;
  return new Date(iso).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Field errors from a DRF 400 response, flattened to one message per field. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(error.data as Record<string, unknown>)) {
    result[key] = Array.isArray(value) ? value.map(String).join(" ") : String(value);
  }
  return result;
}

/** A message that clears itself, for "Saved." confirmations. */
export function useFlash(timeout = 2500) {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), timeout);
    return () => window.clearTimeout(timer);
  }, [message, timeout]);
  return [message, setMessage] as const;
}
