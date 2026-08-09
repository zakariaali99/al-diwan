import { Link } from "react-router-dom";

import Reveal from "@/components/Reveal";
import ShipHero from "@/components/ShipHero";
import {
  CtaBand,
  ErrorBlock,
  FieldWork,
  LoadingBlock,
  PostCard,
  PrincipleList,
  ProcessTimeline,
  SectionHead,
  ServiceGrid,
  TrustBar,
} from "@/components/Sections";
import { ArrowIcon, CheckIcon } from "@/components/Icons";
import {
  splitServiceCategories,
  useContentBlocks,
  useLinkTo,
  usePosts,
  useQualityPrinciples,
  useServiceCategories,
  useSiteSettings,
  useT,
} from "@/lib/hooks";
import { usePageMeta } from "@/lib/meta";

export default function HomePage() {
  const t = useT();
  const linkTo = useLinkTo();
  const blocks = useContentBlocks();
  const categories = useServiceCategories();
  const principles = useQualityPrinciples();
  const posts = usePosts();
  const { data: site } = useSiteSettings();

  usePageMeta({
    title: t("companyName") + " — " + t("companyTagline"),
    description: blocks.data?.home_hero?.body,
  });

  if (blocks.isLoading || categories.isLoading) return <LoadingBlock />;
  if (blocks.isError || categories.isError) return <ErrorBlock />;

  const { commodity, process } = splitServiceCategories(categories.data ?? []);
  const intro = blocks.data?.home_intro;
  const vision = blocks.data?.vision;
  const mission = blocks.data?.mission;
  const goal = blocks.data?.goal;
  const quality = blocks.data?.quality_policy;
  const latestPosts = (posts.data ?? []).slice(0, 3);

  return (
    <>
      <ShipHero lede={blocks.data?.home_hero?.body} />
      <TrustBar />

      <section className="py-20 lg:py-24">
        <div className="container-page">
          <SectionHead eyebrow={t("ourServices")} title={t("servicesHeading")} />
          <ServiceGrid categories={commodity} />
          <div className="mt-10 text-center">
            <Link to={linkTo("services/")} className="btn-ghost group">
              {t("allServices")}
              <ArrowIcon className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {process.length > 0 && (
        <section className="bg-slate-50 py-20 lg:py-24">
          <div className="container-page">
            <SectionHead eyebrow={t("methodology")} title={t("processHeading")} lede={t("processLede")} />
            <ProcessTimeline categories={process} />
          </div>
        </section>
      )}

      <FieldWork />

      {(intro || vision || mission || goal) && (
        <section className="bg-slate-50 py-20 lg:py-24">
          <div className="container-page grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div>
                <span className="eyebrow">
                  <span aria-hidden className="h-0.5 w-7 rounded bg-rust-500" />
                  {t("about")}
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  {intro?.title || t("heroEyebrow")}
                </h2>
                {intro?.body && (
                  <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-muted">{intro.body}</p>
                )}
                <Link to={linkTo("about-us/")} className="btn-primary group mt-8">
                  {t("about")}
                  <ArrowIcon className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </Link>
              </div>
            </Reveal>

            <ul className="grid gap-6">
              {[vision, mission, goal].filter(Boolean).map((block, index) => (
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
      )}

      {quality && (
        <section className="py-20 lg:py-24">
          <div className="container-page grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div>
                <span className="eyebrow">
                  <span aria-hidden className="h-0.5 w-7 rounded bg-rust-500" />
                  {t("qualityPolicy")}
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  {t("qualityHeading")}
                </h2>
                <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-muted">{quality.body}</p>
              </div>
            </Reveal>
            <PrincipleList principles={principles.data ?? []} />
          </div>
        </section>
      )}

      {latestPosts.length > 0 && (
        <section className="bg-slate-50 py-20 lg:py-24">
          <div className="container-page">
            <SectionHead eyebrow={t("blog")} title={t("latestNews")} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post, index) => (
                <Reveal key={post.id} delay={index * 0.06}>
                  <PostCard post={post} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand title={t("ctaHeading")} lede={t("ctaLede")} whatsappUrl={site?.whatsapp_url} />
    </>
  );
}
