import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { images } from "@/assets/generated/manifest";
import { FacebookIcon, MailIcon, PinIcon, WhatsAppIcon } from "@/components/Icons";
import { PageHeader } from "@/components/Sections";
import SmartImage from "@/components/SmartImage";
import { api } from "@/lib/api";
import { useLang, useSiteSettings, useT } from "@/lib/hooks";
import { usePageMeta } from "@/lib/meta";
import { t as translate } from "@/lib/i18n";

export default function ContactPage() {
  const t = useT();
  const lang = useLang();
  const { data: site } = useSiteSettings();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  usePageMeta({ title: `${t("contact")} — ${t("companyName")}`, description: t("contactLede") });

  const schema = z.object({
    name: z.string().min(1, translate("required", lang)),
    email: z.string().min(1, translate("required", lang)).email(translate("invalidEmail", lang)),
    subject: z.string().optional(),
    message: z.string().min(1, translate("required", lang)),
    website: z.string().optional(), // honeypot
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setStatus("idle");
    try {
      await api.contact({
        name: values.name,
        email: values.email,
        subject: values.subject ?? "",
        message: values.message,
        website: values.website ?? "",
      });
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  };

  const cards = [
    site?.whatsapp_url && {
      href: site.whatsapp_url,
      Icon: WhatsAppIcon,
      label: t("whatsapp"),
      value: site.phone,
      ltr: true,
      external: true,
    },
    site?.email && {
      href: `mailto:${site.email}`,
      Icon: MailIcon,
      label: t("email"),
      value: site.email,
      ltr: true,
      external: false,
    },
    site?.map_url && {
      href: site.map_url,
      Icon: PinIcon,
      label: t("location"),
      value: `${site.address} — ${t("misrataLibya")}`,
      ltr: false,
      external: true,
    },
    site?.facebook_url && {
      href: site.facebook_url,
      Icon: FacebookIcon,
      label: t("facebookPage"),
      value: "aldiwan company",
      ltr: true,
      external: true,
    },
  ].filter(Boolean) as {
    href: string;
    Icon: (props: { className?: string }) => JSX.Element;
    label: string;
    value: string;
    ltr: boolean;
    external: boolean;
  }[];

  return (
    <>
      <PageHeader eyebrow={t("howToReach")} title={t("contactTitle")} lede={t("contactLede")} />

      <section className="py-20 lg:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            {/* The office photo is a small original, so rather than stretching
                it flat it becomes a framed feature: the photo sits on a deep
                brand panel with its own colours bled behind it, which reads as
                deliberate art direction instead of a low-res image. */}
            <figure className="relative mb-8 overflow-hidden rounded-3xl bg-brand-950 p-3 shadow-xl shadow-brand-950/15">
              <span
                aria-hidden
                className="absolute inset-0 scale-125 bg-cover bg-center opacity-45 blur-2xl"
                style={{ backgroundImage: `url("${images.office.lqip}")` }}
              />
              <div className="relative overflow-hidden rounded-2xl">
                <SmartImage
                  asset={images.office}
                  alt={t("officeAlt")}
                  sizes="(max-width: 1024px) 90vw, 420px"
                  rounded="rounded-2xl"
                />
              </div>
              <figcaption className="relative flex items-center gap-2 px-3 py-3 text-sm text-slate-300">
                <PinIcon className="h-4 w-4 shrink-0 text-rust-400" />
                <span>
                  <strong className="font-semibold text-white">{t("ourOffice")}</strong>
                  {" — "}
                  {t("misrataLibya")}
                </span>
              </figcaption>
            </figure>

            <h2 className="mb-6 text-2xl font-bold text-body">{t("contactDetails")}</h2>
            <div className="flex flex-col gap-4">
              {cards.map((card) => (
                <a
                  key={card.label}
                  href={card.href}
                  {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex items-start gap-4 rounded-xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand-600 hover:shadow-md"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-600 dark:text-brand-300">
                    <card.Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-body">{card.label}</strong>
                    <span
                      className="block break-words text-sm text-muted"
                      dir={card.ltr ? "ltr" : undefined}
                    >
                      {card.value}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-2xl font-bold text-body">{t("sendMessage")}</h2>

            {status === "success" && (
              <div role="status" className="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300">
                {t("contactSuccess")}
              </div>
            )}
            {status === "error" && (
              <div role="alert" className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
                {t("contactError")}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-body">
                  {t("nameLabel")} <span className="text-red-600 dark:text-red-400" aria-hidden>*</span>
                </label>
                <input
                  id="name"
                  {...register("name")}
                  className="field-input"
                  placeholder={t("namePlaceholder")}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-body">
                  {t("email")} <span className="text-red-600 dark:text-red-400" aria-hidden>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  dir="ltr"
                  {...register("email")}
                  className="field-input"
                  placeholder="name@company.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-body">
                  {t("subjectLabel")}
                </label>
                <input
                  id="subject"
                  {...register("subject")}
                  className="field-input"
                  placeholder={t("subjectPlaceholder")}
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-semibold text-body">
                  {t("messageLabel")} <span className="text-red-600 dark:text-red-400" aria-hidden>*</span>
                </label>
                <textarea
                  id="message"
                  rows={6}
                  {...register("message")}
                  className="field-input resize-y"
                  placeholder={t("messagePlaceholder")}
                  aria-invalid={Boolean(errors.message)}
                />
                {errors.message && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.message.message}</p>}
              </div>

              {/* Honeypot — hidden from people, tempting to bots */}
              <div className="absolute h-px w-px overflow-hidden" style={{ clipPath: "inset(50%)" }} aria-hidden>
                <label htmlFor="website">Leave this field empty</label>
                <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
                {isSubmitting ? t("sending") : t("send")}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
