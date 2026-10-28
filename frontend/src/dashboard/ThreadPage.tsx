import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api, type ThreadStatus } from "@/lib/api";
import { useLang, useLinkTo } from "@/lib/hooks";
import { THREAD_TONE, useThreadStatusLabel } from "./InboxPage";
import { PaperclipIcon } from "./icons";
import { useDT } from "./strings";
import {
  DeleteButton,
  LoadError,
  Loading,
  Notice,
  PageHeader,
  Panel,
  Pill,
  RequireCap,
  formatDate,
  primaryBtn,
  smallBtn,
  useCan,
} from "./ui";

function Thread() {
  const dt = useDT();
  const lang = useLang();
  const linkTo = useLinkTo();
  const navigate = useNavigate();
  const can = useCan();
  const queryClient = useQueryClient();
  const statusLabel = useThreadStatusLabel();
  const { id } = useParams<{ id: string }>();
  const threadId = Number(id);
  const [reply, setReply] = useState("");

  const thread = useQuery({
    queryKey: ["dashboard-thread", threadId],
    queryFn: () => api.dashboard.thread(threadId),
    enabled: Number.isFinite(threadId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-thread", threadId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-threads"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
  };

  const sendReply = useMutation({
    mutationFn: (body: string) => api.dashboard.reply(threadId, body),
    onSuccess: () => {
      setReply("");
      invalidate();
    },
  });
  const assign = useMutation({ mutationFn: () => api.dashboard.assignToMe(threadId), onSuccess: invalidate });
  const setStatus = useMutation({
    mutationFn: (status: ThreadStatus) => api.dashboard.threads.update(threadId, { status }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: () => api.dashboard.threads.remove(threadId),
    onSuccess: () => {
      invalidate();
      navigate(linkTo("dashboard/inbox/"), { replace: true });
    },
  });

  if (thread.isLoading) return <Loading />;
  if (thread.isError || !thread.data) return <LoadError />;

  const data = thread.data;
  const canReply = can("reply_messages");

  return (
    <>
      <PageHeader
        title={data.subject}
        actions={
          <>
            <Link to={linkTo("dashboard/inbox/")} className={smallBtn}>
              {dt("back")}
            </Link>
            {canReply && (
              <>
                <button type="button" className={smallBtn} disabled={assign.isPending} onClick={() => assign.mutate()}>
                  {dt("assignToMe")}
                </button>
                <button
                  type="button"
                  className={smallBtn}
                  disabled={setStatus.isPending}
                  onClick={() => setStatus.mutate(data.status === "closed" ? "open" : "closed")}
                >
                  {data.status === "closed" ? dt("reopen") : dt("closeThread")}
                </button>
                <DeleteButton label={dt("deleteThread")} pending={remove.isPending} onConfirm={() => remove.mutate()} />
              </>
            )}
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Pill tone={THREAD_TONE[data.status]}>{statusLabel(data.status)}</Pill>
        <span>
          {dt("from")}: <span className="font-medium text-body">{data.correspondent.name || "—"}</span>{" "}
          <a href={`mailto:${data.correspondent.email}`} dir="ltr" className="text-brand-600 hover:underline dark:text-brand-300">
            {data.correspondent.email}
          </a>
        </span>
        {data.assigned_to_name && (
          <span>
            · {dt("assignedTo")}: {data.assigned_to_name}
          </span>
        )}
      </div>

      <Panel className="mb-5">
        <ol className="flex flex-col gap-4">
          {data.messages.map((message) => (
            <li
              key={message.id}
              className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[0.94rem] leading-relaxed ${
                message.direction === "out" ? "ms-auto bg-brand-tint text-body" : "border border-line bg-subtle text-body"
              }`}
            >
              <div className="mb-1.5 text-xs text-faint">
                {message.direction === "out" ? `${message.sent_by_name || "—"} → ${message.to_email}` : message.from_email}
                {" · "}
                {formatDate(message.created_at, lang, true)}
              </div>
              {message.body}
              {message.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  className="mt-2 flex items-center gap-1.5 text-sm text-brand-600 hover:underline dark:text-brand-300"
                >
                  <PaperclipIcon className="h-4 w-4" />
                  {attachment.filename}
                </a>
              ))}
            </li>
          ))}
        </ol>
      </Panel>

      {canReply ? (
        <Panel title={dt("reply")}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (reply.trim()) sendReply.mutate(reply);
            }}
          >
            <textarea
              id="reply"
              aria-label={dt("reply")}
              rows={6}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              className="field-input resize-y"
              required
            />
            {sendReply.isError && (
              <div className="mt-3">
                <Notice tone="error">{dt("sendFailed")}</Notice>
              </div>
            )}
            <button type="submit" disabled={sendReply.isPending} className={`${primaryBtn} mt-4`}>
              {sendReply.isPending ? dt("sending") : dt("send")}
            </button>
          </form>
        </Panel>
      ) : (
        <Notice>{dt("readOnlyInbox")}</Notice>
      )}
    </>
  );
}

export default function ThreadPage() {
  return (
    <RequireCap capability="view_messages">
      <Thread />
    </RequireCap>
  );
}
