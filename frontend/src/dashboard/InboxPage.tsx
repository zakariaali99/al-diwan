import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import { api } from "@/lib/api";
import { useCurrentUser, useLinkTo, useT } from "@/lib/hooks";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  closed: "bg-slate-100 text-slate-700",
};

export default function InboxPage() {
  const t = useT();
  const linkTo = useLinkTo();
  const { data: user } = useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get("status") ?? undefined;
  const mine = searchParams.get("mine") === "1";

  const threads = useQuery({
    queryKey: ["dashboard-threads", status ?? null, mine],
    queryFn: () => api.dashboard.threads({ status, mine }),
  });

  const statusLabel = (value: string) =>
    value === "open" ? t("statusOpen") : value === "pending" ? t("statusPending") : t("statusClosed");

  const filters = [
    { key: "all", label: t("allCategories"), active: !status && !mine, apply: () => setSearchParams({}) },
    { key: "open", label: t("statusOpen"), active: status === "open", apply: () => setSearchParams({ status: "open" }) },
    { key: "pending", label: t("statusPending"), active: status === "pending", apply: () => setSearchParams({ status: "pending" }) },
    { key: "closed", label: t("statusClosed"), active: status === "closed", apply: () => setSearchParams({ status: "closed" }) },
    { key: "mine", label: t("assignedToMe"), active: mine, apply: () => setSearchParams({ mine: "1" }) },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">{t("messages")}</h1>
        {user?.permissions?.canAddThreads && (
          <Link to={linkTo("dashboard/inbox/compose/")} className="btn-primary">
            {t("newMessage")}
          </Link>
        )}
      </div>

      <nav className="mb-5 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={filter.apply}
            aria-current={filter.active ? "true" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter.active
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-ink-muted hover:border-brand-600 hover:text-brand-600"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </nav>

      {threads.isLoading ? (
        <p className="text-ink-muted">{t("loading")}</p>
      ) : threads.isError ? (
        <p className="text-ink-muted">{t("errorLoading")}</p>
      ) : (threads.data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-ink-muted">
          {t("noMessages")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-3" />
                <th className="p-3 text-start font-semibold">{t("subject")}</th>
                <th className="p-3 text-start font-semibold">{t("from")}</th>
                <th className="p-3 text-start font-semibold">{t("assignedTo")}</th>
                <th className="p-3 text-start font-semibold">{t("status")}</th>
                <th className="p-3 text-start font-semibold">{t("updated")}</th>
              </tr>
            </thead>
            <tbody>
              {threads.data?.map((thread) => (
                <tr key={thread.id} className="border-t border-slate-100">
                  <td className="p-3">
                    {thread.is_unread && (
                      <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[0.7rem] font-semibold text-white">
                        {t("unread")}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <Link
                      to={linkTo(`dashboard/inbox/${thread.id}/`)}
                      className="font-medium text-ink hover:text-brand-600"
                    >
                      {thread.subject}
                    </Link>
                  </td>
                  <td className="p-3 text-ink-muted">{thread.correspondent.name || thread.correspondent.email}</td>
                  <td className="p-3 text-ink-muted">{thread.assigned_to_name || "—"}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[thread.status]}`}>
                      {statusLabel(thread.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-3 text-ink-muted">
                    {new Date(thread.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
