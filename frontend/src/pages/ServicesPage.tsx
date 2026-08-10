import {
  CtaBand,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  ProcessTimeline,
  SectionHead,
  ServiceGrid,
} from "@/components/Sections";
import {
  splitServiceCategories,
  useContentBlocks,
  useServiceCategories,
  useSiteSettings,
  useT,
} from "@/lib/hooks";
import { usePageMeta } from "@/lib/meta";

export default function ServicesPage() {
  const t = useT();
  const categories = useServiceCategories();
  const blocks = useContentBlocks();
  const { data: site } = useSiteSettings();

  const intro = blocks.data?.about_services_intro;
  usePageMeta({ title: `${t("servicesPageTitle")} — ${t("companyName")}`, description: intro?.body });

  if (categories.isLoading) return <LoadingBlock />;
  if (categories.isError) return <ErrorBlock />;

  const { commodity, process } = splitServiceCategories(categories.data ?? []);

  return (
    <>
      <PageHeader eyebrow={t("whatWeOffer")} title={t("servicesPageTitle")} lede={intro?.body} />

      <section className="py-20 lg:py-24">
        <div className="container-page">
          <SectionHead eyebrow={t("bySector")} title={t("sectorsHeading")} />
          <ServiceGrid categories={commodity} showAll />
        </div>
      </section>

      {process.length > 0 && (
        <section className="bg-subtle py-20 lg:py-24">
          <div className="container-page">
            <SectionHead eyebrow={t("shipmentCycle")} title={t("processHeading")} lede={t("processLede")} />
            <ProcessTimeline categories={process} />
          </div>
        </section>
      )}

      <CtaBand title={t("notFoundService")} lede={t("notFoundServiceLede")} whatsappUrl={site?.whatsapp_url} />
    </>
  );
}
