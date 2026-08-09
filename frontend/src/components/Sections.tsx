import { Link } from "react-router-dom";

import inspectionContainer from "@/assets/inspection-container.jpeg";
import inspectionDocuments from "@/assets/inspection-documents.jpeg";
import type { PostListItem, ServiceCategory } from "@/lib/api";
import { useLinkTo, useT } from "@/lib/hooks";
import { ArrowIcon, CheckIcon, iconForCategory } from "./Icons";
import Reveal from "./Reveal";

export function SectionHead({
  eyebrow,
  title,
  lede,
  onDark = false,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  onDark?: boolean;
}) {
  return (
    <div className="mb-12 max-w-2xl">
      <span className={`eyebrow ${onDark ? "text-brand-300" : ""}`}>
        <span aria-hidden className="h-0.5 w-7 rounded bg-rust-500" />
        {eyebrow}
      </span>
      <h2
        className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${
          onDark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {lede && (
        <p className={`mt-4 text-lg leading-relaxed ${onDark ? "text-slate-300" : "text-ink-muted"}`}>
          {lede}
        </p>
      )}
    </div>
  );
}

export function TrustBar() {
  const t = useT();
  const items = [
    { value: t("trustIndependent"), label: t("trustIndependentSub") },
    { value: t("trustAccredited"), label: t("trustAccreditedSub") },
    { value: t("trustMisrata"), label: t("trustMisrataSub") },
    { value: t("trustTeam"), label: t("trustTeamSub") },
  ];

  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="container-page grid grid-cols-2 divide-x divide-slate-200 rtl:divide-x-reverse lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.value} className="px-4 py-8 text-center">
            <strong className="block text-xl font-bold text-brand-600 sm:text-2xl">{item.value}</strong>
            <span className="mt-1 block text-sm text-ink-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ServiceGrid({ categories, showAll = false }: { categories: ServiceCategory[]; showAll?: boolean }) {
  const t = useT();

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category, index) => {
        const Icon = iconForCategory(category.name);
        const items = showAll ? category.items : category.items.slice(0, 4);
        const remaining = category.items.length - items.length;

        return (
          <Reveal key={category.id} delay={index * 0.05}>
            <article className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-brand-500 to-rust-400 transition-transform duration-300 group-hover:scale-x-100 rtl:origin-right"
              />
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-bold text-ink">{category.name}</h3>
              <ul className="flex flex-col gap-2 text-[0.94rem] leading-relaxed text-ink-muted">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-rust-500" />
                    {item.text}
                  </li>
                ))}
              </ul>
              {remaining > 0 && (
                <p className="mt-auto pt-2 text-sm font-semibold text-ink-soft">
                  + {remaining} {t("moreItems")}
                </p>
              )}
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}

export function ProcessTimeline({ categories }: { categories: ServiceCategory[] }) {
  return (
    <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <span
        aria-hidden
        className="absolute inset-x-0 top-7 hidden h-0.5 bg-gradient-to-r from-brand-400 via-brand-400 to-rust-400 opacity-40 lg:block"
      />
      {categories.map((category, index) => (
        <Reveal key={category.id} delay={index * 0.08}>
          <li className="relative">
            <span className="relative z-10 grid h-14 w-14 place-items-center rounded-full border-2 border-brand-400 bg-white text-lg font-bold text-brand-600">
              {index + 1}
            </span>
            <h3 className="mt-4 text-base font-bold text-ink">{category.name}</h3>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink-muted">
              {category.items.slice(0, 3).map((item) => (
                <li key={item.id} className="flex gap-2">
                  <span aria-hidden className="text-rust-500">—</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}

/** Real photographs of the team at work — the strongest trust signal available. */
export function FieldWork() {
  const t = useT();
  const photos = [
    { src: inspectionContainer, alt: t("inspectionContainerAlt") },
    { src: inspectionDocuments, alt: t("inspectionDocumentsAlt") },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="container-page">
        <SectionHead eyebrow={t("fieldWork")} title={t("fieldWorkHeading")} lede={t("fieldWorkLede")} />
        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          {photos.map((photo, index) => (
            <Reveal key={photo.src} delay={index * 0.08}>
              <figure className="group relative overflow-hidden rounded-2xl bg-slate-100 shadow-lg shadow-slate-200/60">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-950/85 to-transparent p-5 text-sm text-white">
                  {photo.alt}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PrincipleList({ principles }: { principles: { id: number; text: string }[] }) {
  return (
    <ul className="grid gap-4">
      {principles.map((principle, index) => (
        <Reveal key={principle.id} delay={index * 0.05}>
          <li className="flex items-start gap-4">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
              <CheckIcon className="h-3.5 w-3.5" />
            </span>
            <p className="text-ink-muted">{principle.text}</p>
          </li>
        </Reveal>
      ))}
    </ul>
  );
}

export function PostCard({ post }: { post: PostListItem }) {
  const linkTo = useLinkTo();
  const href = linkTo(`posts/${encodeURIComponent(post.slug)}/`);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
      <div className="aspect-video overflow-hidden bg-gradient-to-br from-brand-800 to-brand-500">
        {post.featured_image && (
          <img
            src={post.featured_image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft">
          {post.category && (
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-semibold text-brand-700">
              {post.category.name}
            </span>
          )}
          {post.published_at && (
            <time dateTime={post.published_at}>
              {new Date(post.published_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
        </div>
        <h3 className="text-lg font-bold leading-snug">
          <Link to={href} className="text-ink transition-colors hover:text-brand-600">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="text-sm leading-relaxed text-ink-muted">{post.excerpt}</p>}
      </div>
    </article>
  );
}

export function CtaBand({ title, lede, whatsappUrl }: { title: string; lede: string; whatsappUrl?: string }) {
  const t = useT();
  const linkTo = useLinkTo();

  return (
    <section className="py-20 lg:py-24">
      <div className="container-page">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 px-8 py-14 text-center text-white sm:px-12">
            <span
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{
                background: "radial-gradient(circle at 20% 20%, rgba(196,105,63,0.28), transparent 55%)",
              }}
            />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">{lede}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to={linkTo("contact-us/")} className="btn-accent group">
                {t("contact")}
                <ArrowIcon className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-on-dark">
                  {t("whatsapp")}
                </a>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 py-16 text-white lg:py-24">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 90% at 75% 20%, #000, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 90% at 75% 20%, #000, transparent 75%)",
        }}
      />
      <div className="container-page">
        <span className="eyebrow text-brand-300">
          <span aria-hidden className="h-0.5 w-7 rounded bg-rust-400" />
          {eyebrow}
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
        {lede && <p className="mt-4 max-w-2xl text-lg text-slate-300">{lede}</p>}
      </div>
    </section>
  );
}

export function LoadingBlock() {
  const t = useT();
  return <div className="container-page py-24 text-center text-ink-muted">{t("loading")}</div>;
}

export function ErrorBlock() {
  const t = useT();
  return <div className="container-page py-24 text-center text-ink-muted">{t("errorLoading")}</div>;
}
