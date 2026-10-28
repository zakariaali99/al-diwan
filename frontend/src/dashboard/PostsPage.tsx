import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import { api, type PostStatus } from "@/lib/api";
import { useLang, useLinkTo } from "@/lib/hooks";
import { LANGS, LANG_META } from "@/lib/i18n";
import { PlusIcon } from "./icons";
import { useDT } from "./strings";
import {
  DeleteButton,
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

export const POST_STATUS_TONE = { published: "green", scheduled: "amber", draft: "gray" } as const;

export function usePostStatusLabel() {
  const dt = useDT();
  return (status: PostStatus) => dt(status);
}

function PostsList() {
  const dt = useDT();
  const lang = useLang();
  const linkTo = useLinkTo();
  const can = useCan();
  const queryClient = useQueryClient();
  const statusLabel = usePostStatusLabel();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const [search, setSearch] = useState("");

  const posts = useQuery({
    queryKey: ["dashboard-posts", status, search],
    queryFn: () => api.dashboard.posts.list({ status, q: search }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.dashboard.posts.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-posts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
    },
  });

  const statuses: (PostStatus | "")[] = ["", "published", "scheduled", "draft"];

  return (
    <>
      <PageHeader
        title={dt("posts")}
        actions={
          can("manage_posts") && (
            <Link to={linkTo("dashboard/posts/new/")} className={primaryBtn}>
              <PlusIcon className="h-4 w-4" />
              {dt("newPost")}
            </Link>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {statuses.map((value) => (
            <button
              key={value || "all"}
              type="button"
              className={filterChip(status === value)}
              onClick={() => setParams(value ? { status: value } : {})}
            >
              {value ? statusLabel(value) : dt("all")}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={dt("search")}
          className="field-input max-w-xs py-2"
          aria-label={dt("search")}
        />
      </div>

      {posts.isLoading ? (
        <Loading />
      ) : posts.isError ? (
        <LoadError />
      ) : (posts.data?.length ?? 0) === 0 ? (
        <Empty>{dt("noPostsYet")}</Empty>
      ) : (
        <Table
          head={
            <>
              <th className={th}>{dt("title")}</th>
              <th className={th}>{dt("status")}</th>
              <th className={th}>{dt("translations")}</th>
              <th className={th}>{dt("comments")}</th>
              <th className={th}>{dt("updated")}</th>
              <th className={th} />
            </>
          }
        >
          {posts.data?.map((post) => (
            <tr key={post.id} className="hover:bg-subtle/60">
              <td className={td}>
                <Link to={linkTo(`dashboard/posts/${post.id}/`)} className="flex min-w-[16rem] items-center gap-3">
                  <span className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-800 to-brand-500">
                    {post.featured_image && <img src={post.featured_image} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-body hover:text-brand-600">{post.title || "—"}</span>
                    <span className="block text-xs text-muted">
                      {post.category_name || dt("noCategory")} · {post.author_name || "—"}
                    </span>
                  </span>
                </Link>
              </td>
              <td className={td}>
                <Pill tone={POST_STATUS_TONE[post.status]}>{statusLabel(post.status)}</Pill>
              </td>
              <td className={td}>
                <span className="flex gap-1">
                  {LANGS.map((code) => (
                    <span
                      key={code}
                      title={LANG_META[code].name}
                      className={`rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase ${
                        post.translated_languages.includes(LANG_META[code].apiLang)
                          ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                          : "bg-subtle text-faint"
                      }`}
                    >
                      {code}
                    </span>
                  ))}
                </span>
              </td>
              <td className={td}>
                <Link to={linkTo(`dashboard/comments/?post=${post.id}`)} className="text-muted hover:text-brand-600">
                  {post.comment_count}
                </Link>
              </td>
              <td className={`${td} whitespace-nowrap text-muted`}>{formatDate(post.updated_at, lang)}</td>
              <td className={`${td} text-end`}>
                {can("delete_posts") && (
                  <DeleteButton pending={remove.isPending && remove.variables === post.id} onConfirm={() => remove.mutate(post.id)} />
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

export default function PostsPage() {
  return (
    <RequireCap capability="view_posts">
      <PostsList />
    </RequireCap>
  );
}
