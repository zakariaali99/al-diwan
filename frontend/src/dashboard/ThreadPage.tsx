import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { api } from "@/lib/api";
import { useCurrentUser, useLinkTo, useT } from "@/lib/hooks";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  closed: "bg-slate-100 text-slate-700",
};

export default function ThreadPage() {
  const t = useT();
  const linkTo = useLinkTo();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const threadId = Number(id);
  const { data: user } = useCurrentUser();
  const [reply, setReply] = useState("");

  const thread = useQuery({
    queryKey: ["dashboard-thread", threadId],
    queryFn: () => api.dashboard.thread(threadId),
    enabled: Number.isFinite(threadId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-thread", threadId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-threads"] });
  };

  const sendReply = useMutation({
    mutationFn: (body: string) => api.dashboard.reply(threadId, body),
    onSuccess: () => {
      setReply("");
      invalidate();
    },
  });

  const assign = useMutation({
    mutationFn: () => api.dashboard.assignToMe(threadId),
    onSuccess: invalidate,
  });

  const close = useMutation({
    mutationFn: () => api.dashboard.close(threadId),
    onSuccess: invalidate,
  });

  if (thread.isLoading) return <p className="text-ink-muted">{t("loading")}</p>;
  if (thread.isError || !thread.data) return <p className="text-ink-muted">{t("errorLoading")}</p>;

  const data = thread.data;
  const statusLabel =
    data.status === "open" ? t("statusOpen") : data.status === "pending" ? t("statusPending") : t("statusClosed");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{data.subject}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <span dir="ltr">{data.correspondent.name || data.correspondent.email}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[data.status]}`}>
              {statusLabel}
            </span>
            {data.assigned_to_name && <span>· {t("assignedTo")} {data.assigned_to_name}</span>}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={linkTo("dashboard/inbox/")} className="btn-ghost">{t("back")}</Link>
          {user?.permissions?.canChangeThreads && (
            <>
              <button type="button" onClick={() => assign.mutate()} className="btn-ghost">
                {t("assignToMe")}
              </button>
              {data.status !== "closed" && (
                <button type="button" onClick={() => close.mutate()} className="btn-ghost">
                  {t("close")}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6">
        {data.messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-4 py-3 text-[0.94rem] leading-relaxed ${
              message.direction === "out"
                ? "ms-auto bg-brand-50 text-ink"
                : "border border-slate-200 bg-white text-ink"
            }`}
          >
            <div className="mb-1.5 text-xs text-ink-soft">
              {message.direction === "out"
                ? `${message.sent_by_name || "—"} → ${message.to_email}`
                : message.from_email}
              {" · "}
              {new Date(message.created_at).toLocaleString()}
            </div>
            {message.body}
            {message.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                className="mt-2 block text-sm text-brand-600 hover:underline"
              >
                📎 {attachment.filename}
              </a>
            ))}
          </div>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (reply.trim()) sendReply.mutate(reply);
        }}
        className="rounded-xl border border-slate-200 bg-white p-6"
      >
        <label htmlFor="reply" className="mb-2 block text-sm font-semibold">{t("reply")}</label>
        <textarea
          id="reply"
          rows={6}
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          className="field-input resize-y"
          required
        />
        <button type="submit" disabled={sendReply.isPending} className="btn-primary mt-4 disabled:opacity-60">
          {sendReply.isPending ? t("sending") : t("replySend")}
        </button>
        {sendReply.isError && (
          <p role="alert" className="mt-3 text-sm text-red-600">{t("contactError")}</p>
        )}
      </form>
    </>
  );
}
