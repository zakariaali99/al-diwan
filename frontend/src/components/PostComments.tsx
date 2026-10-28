import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useLang, usePostComments, useT } from "@/lib/hooks";

/** Public comments under a post: the visible list plus a name/email form.
 *  Emails go to staff only — the API never returns them. */
export default function PostComments({ postId }: { postId: number }) {
  const t = useT();
  const lang = useLang();
  const queryClient = useQueryClient();
  const comments = usePostComments(postId);
  const [form, setForm] = useState({ name: "", email: "", body: "", website: "" });
  const [posted, setPosted] = useState(false);

  const submit = useMutation({
    mutationFn: () => api.addComment(postId, form),
    onSuccess: () => {
      setForm({ name: "", email: "", body: "", website: "" });
      setPosted(true);
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
  });

  const count = comments.data?.length ?? 0;
  const locale = lang === "zh" ? "zh-CN" : lang === "ar" ? "ar-LY" : lang;

  return (
    <section className="mt-16 border-t border-line pt-12" aria-labelledby="comments-title">
      <h2 id="comments-title" className="mb-6 text-2xl font-bold text-body">
        {t("commentsTitle")} {count > 0 && <span className="text-muted">({count})</span>}
      </h2>

      {count === 0 ? (
        <p className="mb-8 text-muted">{t("noCommentsYet")}</p>
      ) : (
        <ol className="mb-10 flex flex-col gap-4">
          {comments.data?.map((comment) => (
            <li key={comment.id} className="rounded-2xl border border-line bg-subtle p-5">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-tint font-bold text-brand-700 dark:text-brand-200">
                  {comment.name.slice(0, 1)}
                </span>
                <strong className="text-body">{comment.name}</strong>
                <time dateTime={comment.created_at} className="text-xs text-faint">
                  {new Date(comment.created_at).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
                </time>
              </div>
              <p className="whitespace-pre-wrap break-words leading-relaxed text-body">{comment.body}</p>
            </li>
          ))}
        </ol>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPosted(false);
          submit.mutate();
        }}
        className="relative flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6"
      >
        <h3 className="text-lg font-bold text-body">{t("leaveComment")}</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="comment-name" className="mb-2 block text-sm font-semibold text-body">
              {t("commentName")} <span className="text-red-600 dark:text-red-400" aria-hidden>*</span>
            </label>
            <input
              id="comment-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              maxLength={100}
              autoComplete="name"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="comment-email" className="mb-2 block text-sm font-semibold text-body">
              {t("commentEmail")} <span className="text-red-600 dark:text-red-400" aria-hidden>*</span>
            </label>
            <input
              id="comment-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
              autoComplete="email"
              dir="ltr"
              className="field-input"
              aria-describedby="comment-email-note"
            />
            <p id="comment-email-note" className="mt-1.5 text-xs text-muted">
              {t("commentEmailNote")}
            </p>
          </div>
        </div>
        <div>
          <label htmlFor="comment-body" className="mb-2 block text-sm font-semibold text-body">
            {t("commentBody")} <span className="text-red-600 dark:text-red-400" aria-hidden>*</span>
          </label>
          <textarea
            id="comment-body"
            rows={5}
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
            required
            maxLength={3000}
            className="field-input resize-y"
          />
        </div>
        {/* Honeypot: hidden from people, irresistible to bots. */}
        <div className="absolute h-px w-px overflow-hidden" style={{ clipPath: "inset(50%)" }} aria-hidden>
          <label htmlFor="comment-website">Leave this field empty</label>
          <input
            id="comment-website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => setForm({ ...form, website: event.target.value })}
          />
        </div>

        {posted && (
          <p role="status" className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300">
            {t("commentPosted")}
          </p>
        )}
        {submit.isError && (
          <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            {t("commentError")}
          </p>
        )}

        <button type="submit" disabled={submit.isPending} className="btn-primary self-start disabled:opacity-60">
          {submit.isPending ? t("postingComment") : t("postComment")}
        </button>
      </form>
    </section>
  );
}
