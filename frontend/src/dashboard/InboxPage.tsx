import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import { api, type ThreadStatus } from "@/lib/api";
import { useLang, useLinkTo } from "@/lib/hooks";
import { PlusIcon } from "./icons";
import { useDT } from "./strings";
import {
  Empty,
  LoadError,
  Loading,
  PageHeader,
  Pill,
  RequireCap,
  Table,
  filterChip,
  formatDate,
  primaryBtn,
  td,
  th,
  useCan,
} from "./ui";

export const THREAD_TONE = { open: "green", pending: "amber", closed: "gray" } as const;

export function useThreadStatusLabel() {
  const dt = useDT();
  return (status: ThreadStatus) =>
    status === "open" ? dt("statusOpen") : status === "pending" ? dt("statusPending") : dt("statusClosed");
}

function Inbox() {
  const dt = useDT();
  const lang = useLang();
  const linkTo = useLinkTo();
  const can = useCan();
  const statusLabel = useThreadStatusLabel();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const mine = params.get("mine") === "1";

  const threads = useQuery({
    queryKey: ["dashboard-threads", status, mine],
    queryFn: () => api.dashboard.threads.list({ status, mine }),
  });

  const filters = [
    { label: dt("all"), active: !status && !mine, apply: () => setParams({}) },
    ...(["open", "pending", "closed"] as ThreadStatus[]).map((value) => ({
      label: statusLabel(value),
      active: status === value,
      apply: () => setParams({ status: value }),
    })),
    { label: dt("mineThreads"), active: mine, apply: () => setParams({ mine: "1" }) },
  ];

  return (
    <>
      <PageHeader
        title={dt("inbox")}
        lede={can("reply_messages") ? undefined : dt("readOnlyInbox")}
        actions={
          can("reply_messages") && (
            <Link to={linkTo("dashboard/inbox/compose/")} className={primaryBtn}>
              <PlusIcon className="h-4 w-4" />
              {dt("newMessage")}
            </Link>
          )
        }
      />

      <nav className="mb-5 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button key={filter.label} type="button" onClick={filter.apply} className={filterChip(filter.active)}>
            {filter.label}
          </button>
        ))}
      </nav>

      {threads.isLoading ? (
        <Loading />
      ) : threads.isError ? (
        <LoadError />
      ) : (threads.data?.length ?? 0) === 0 ? (
        <Empty>{dt("noMessages")}</Empty>
      ) : (
        <Table
          head={
            <>
              <th className={th}>{dt("subject")}</th>
              <th className={th}>{dt("from")}</th>
              <th className={th}>{dt("assignedTo")}</th>
              <th className={th}>{dt("status")}</th>
              <th className={th}>{dt("updated")}</th>
            </>
          }
        >
          {threads.data?.map((thread) => (
            <tr key={thread.id} className={thread.is_unread ? "bg-brand-tint/40" : "hover:bg-subtle/60"}>
              <td className={td}>
                <Link to={linkTo(`dashboard/inbox/${thread.id}/`)} className="flex items-center gap-2">
                  {thread.is_unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label={dt("unread")} />}
                  <span className={`text-body hover:text-brand-600 ${thread.is_unread ? "font-bold" : "font-medium"}`}>
                    {thread.subject}
                  </span>
                  <span className="text-xs text-faint">({thread.message_count})</span>
                </Link>
              </td>
              <td className={`${td} text-muted`}>{thread.correspondent.name || thread.correspondent.email}</td>
              <td className={`${td} text-muted`}>{thread.assigned_to_name || "—"}</td>
              <td className={td}>
                <Pill tone={THREAD_TONE[thread.status]}>{statusLabel(thread.status)}</Pill>
              </td>
              <td className={`${td} whitespace-nowrap text-muted`}>{formatDate(thread.updated_at, lang)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

export default function InboxPage() {
  return (
    <RequireCap capability="view_messages">
      <Inbox />
    </RequireCap>
  );
}
