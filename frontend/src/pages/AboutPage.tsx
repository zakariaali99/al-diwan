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
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-body sm:text-4xl">
                {team?.title || t("ourTeam")}
              </h2>
              {team?.body && (
                <p className="mt-5 whitespace-pre-line leading-relaxed text-muted">{team.body}</p>
              )}
            </div>
          </Reveal>

          <ul className="grid gap-6">
            {values.map((block, index) => (
              <Reveal key={block!.slug} delay={index * 0.06}>
                <li className="flex gap-4 rounded-2xl border border-line bg-surface p-6">
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-600 dark:text-brand-300">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="mb-2 text-lg font-bold text-body">{block!.title}</h3>
                    <p className="leading-relaxed text-muted">{block!.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <FieldWork />

      {quality && (
        <section className="bg-subtle py-20 lg:py-24">
          <div className="container-page grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div>
                <span className="eyebrow">
                  <span aria-hidden className="h-0.5 w-7 rounded bg-rust-500" />
                  {t("qualityPolicy")}
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-body sm:text-4xl">
                  {quality.title || t("qualityHeading")}
                </h2>
                <p className="mt-5 whitespace-pre-line leading-relaxed text-muted">{quality.body}</p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {[
                    { code: "ISO 9001:2015", label: t("qualityManagement") },
                    { code: "ISO/IEC 17020:2012", label: t("inspectionBodies") },
                  ].map((badge) => (
                    <span
                      key={badge.code}
                      className="inline-flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
                    >
                      <ShieldCheckIcon className="h-5 w-5 shrink-0 text-rust-500" />
                      <span>
                        <strong className="block text-sm font-semibold text-body">{badge.code}</strong>
                        <span className="text-xs text-muted">{badge.label}</span>
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
            <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-muted">
              {closing.body}
            </p>
          </Reveal>
        </section>
      )}

      <CtaBand title={t("neutralHeading")} lede={t("neutralLede")} whatsappUrl={site?.whatsapp_url} />
    </>
  );
}
