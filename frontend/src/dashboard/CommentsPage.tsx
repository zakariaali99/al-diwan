import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import { api } from "@/lib/api";
import { useLang, useLinkTo } from "@/lib/hooks";
import { useDT } from "./strings";
import {
  DeleteButton,
  Empty,
  LoadError,
  Loading,
  PageHeader,
  Pill,
  RequireCap,
  filterChip,
  formatDate,
  smallBtn,
  useCan,
} from "./ui";

function Comments() {
  const dt = useDT();
  const lang = useLang();
  const linkTo = useLinkTo();
  const can = useCan();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const visible = params.get("visible") ?? "";
  const post = params.get("post") ?? "";

  const comments = useQuery({
    queryKey: ["dashboard-comments", visible, post, search],
    queryFn: () => api.dashboard.comments.list({ visible, post, q: search }),
  });
  const posts = useQuery({ queryKey: ["dashboard-posts", "", ""], queryFn: () => api.dashboard.posts.list() });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-comments"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-posts"] });
  };
  const toggle = useMutation({
    mutationFn: ({ id, is_visible }: { id: number; is_visible: boolean }) =>
      api.dashboard.comments.update(id, { is_visible }),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: (id: number) => api.dashboard.comments.remove(id), onSuccess: refresh });

  const setFilter = (key: string, value: string) =>
    setParams((previous) => {
      const copy = new URLSearchParams(previous);
      if (value) copy.set(key, value);
      else copy.delete(key);
      return copy;
    });

  return (
    <>
      <PageHeader title={dt("comments")} lede={dt("commentsHint")} />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            ["", dt("all")],
            ["1", dt("visible")],
            ["0", dt("hidden")],
          ].map(([value, label]) => (
            <button key={value || "all"} type="button" className={filterChip(visible === value)} onClick={() => setFilter("visible", value)}>
              {label}
            </button>
          ))}
        </div>
        <select
          value={post}
          onChange={(event) => setFilter("post", event.target.value)}
          className="field-input w-auto max-w-xs py-2"
          aria-label={dt("onPost")}
        >
          <option value="">{dt("filterPost")}</option>
          {posts.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={dt("search")}
          aria-label={dt("search")}
          className="field-input max-w-xs py-2 sm:ms-auto"
        />
      </div>

      {comments.isLoading ? (
        <Loading />
      ) : comments.isError ? (
        <LoadError />
      ) : (comments.data?.length ?? 0) === 0 ? (
        <Empty>{dt("noComments")}</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.data?.map((comment) => (
            <li
              key={comment.id}
              className={`rounded-2xl border bg-surface p-5 ${comment.is_visible ? "border-line" : "border-dashed border-line-strong opacity-75"}`}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint font-bold text-brand-700 dark:text-brand-200">
                    {comment.name.slice(0, 1)}
                  </span>
                  <div>
                    <p className="font-semibold text-body">{comment.name}</p>
                    <a href={`mailto:${comment.email}`} dir="ltr" className="text-sm text-brand-600 hover:underline dark:text-brand-300">
                      {comment.email}
                    </a>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  {!comment.is_visible && <Pill tone="amber">{dt("hidden")}</Pill>}
                  <span>{formatDate(comment.created_at, lang, true)}</span>
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-body">{comment.body}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <Link to={linkTo(`dashboard/posts/${comment.post}/`)} className="text-sm text-muted hover:text-brand-600">
                  {dt("onPost")}: <span className="font-medium text-body">{comment.post_title}</span>
                </Link>
                {can("moderate_comments") && (
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      className={smallBtn}
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate({ id: comment.id, is_visible: !comment.is_visible })}
                    >
                      {comment.is_visible ? dt("hide") : dt("show")}
                    </button>
                    <DeleteButton pending={remove.isPending && remove.variables === comment.id} onConfirm={() => remove.mutate(comment.id)} />
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function CommentsPage() {
  return (
    <RequireCap capability="view_comments">
      <Comments />
    </RequireCap>
  );
}
