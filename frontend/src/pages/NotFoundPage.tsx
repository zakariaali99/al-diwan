import { Link } from "react-router-dom";

import { useLinkTo, useT } from "@/lib/hooks";

export default function NotFoundPage() {
  const t = useT();
  const linkTo = useLinkTo();

  return (
    <section className="grid min-h-[60vh] place-items-center px-6 py-24 text-center">
      <div>
        <p className="text-6xl font-bold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-body">{t("notFound")}</h1>
        <p className="mt-2 text-muted">{t("notFoundLede")}</p>
        <Link to={linkTo("")} className="btn-primary mt-8">
          {t("goHome")}
        </Link>
      </div>
    </section>
  );
}
