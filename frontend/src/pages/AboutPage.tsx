import Reveal from "@/components/Reveal";
import { CheckIcon, ShieldCheckIcon } from "@/components/Icons";
import {
  CtaBand,
  ErrorBlock,
  FieldWork,
  LoadingBlock,
  PageHeader,
  PrincipleList,
} from "@/components/Sections";
import { useContentBlocks, useQualityPrinciples, useSiteSettings, useT } from "@/lib/hooks";
import { usePageMeta } from "@/lib/meta";

export default function AboutPage() {
  const t = useT();
  const blocks = useContentBlocks();
  const principles = useQualityPrinciples();
  const { data: site } = useSiteSettings();

  const intro = blocks.data?.about_intro;
  usePageMeta({ title: `${t("about")} — ${t("companyName")}`, description: intro?.body });

  if (blocks.isLoading) return <LoadingBlock />;
  if (blocks.isError) return <ErrorBlock />;

  const team = blocks.data?.team_intro;
  const quality = blocks.data?.quality_policy;
  const closing = blocks.data?.about_closing;
  const values = [blocks.data?.vision, blocks.data?.mission, blocks.data?.goal].filter(Boolean);

  return (
    <>
      <PageHeader eyebrow={t("theCompany")} title={t("aboutTitle")} lede={intro?.body} />

      <section className="py-20 lg:py-24">
        <div className="container-page grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div>
              <span className="eyebrow">
                <span aria-hidden className="h-0.5 w-7 rounded bg-rust-500" />
                {t("ourTeam")}
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {team?.title || t("ourTeam")}
              </h2>
              {team?.body && (
                <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-muted">{team.body}</p>
              )}
            </div>
          </Reveal>

          <ul className="grid gap-6">
            {values.map((block, index) => (
              <Reveal key={block!.slug} delay={index * 0.06}>
                <li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6">
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="mb-2 text-lg font-bold text-ink">{block!.title}</h3>
                    <p className="leading-relaxed text-ink-muted">{block!.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <FieldWork />

      {quality && (
        <section className="bg-slate-50 py-20 lg:py-24">
          <div className="container-page grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div>
                <span className="eyebrow">
                  <span aria-hidden className="h-0.5 w-7 rounded bg-rust-500" />
                  {t("qualityPolicy")}
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  {quality.title || t("qualityHeading")}
                </h2>
                <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-muted">{quality.body}</p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {[
                    { code: "ISO 9001:2015", label: t("qualityManagement") },
                    { code: "ISO/IEC 17020:2012", label: t("inspectionBodies") },
                  ].map((badge) => (
                    <span
                      key={badge.code}
                      className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <ShieldCheckIcon className="h-5 w-5 shrink-0 text-rust-500" />
                      <span>
                        <strong className="block text-sm font-semibold text-ink">{badge.code}</strong>
                        <span className="text-xs text-ink-muted">{badge.label}</span>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
            <PrincipleList principles={principles.data ?? []} />
          </div>
        </section>
      )}

      {closing?.body && (
        <section className="py-20 lg:py-24">
          <Reveal className="container-page max-w-3xl text-center">
            <span className="eyebrow justify-center">
              <span aria-hidden className="h-0.5 w-7 rounded bg-rust-500" />
              {t("ourNetwork")}
            </span>
            <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-ink-muted">
              {closing.body}
            </p>
          </Reveal>
        </section>
      )}

      <CtaBand title={t("neutralHeading")} lede={t("neutralLede")} whatsappUrl={site?.whatsapp_url} />
    </>
  );
}
