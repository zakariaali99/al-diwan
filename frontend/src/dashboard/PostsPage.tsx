import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { api } from "@/lib/api";
import { useCurrentUser, useLinkTo, useT } from "@/lib/hooks";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  scheduled: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  draft: "bg-subtle text-muted",
};

export default function PostsPage() {
  const t = useT();
  const linkTo = useLinkTo();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const posts = useQuery({ queryKey: ["dashboard-posts"], queryFn: api.dashboard.posts });

  const remove = useMutation({
    mutationFn: (id: number) => api.dashboard.deletePost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-posts"] }),
  });

  const statusLabel = (status: string) =>
    status === "published" ? t("published") : status === "scheduled" ? t("scheduled") : t("draft");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-body">{t("posts")}</h1>
        {user?.permissions?.canAddPosts && (
          <Link to={linkTo("dashboard/posts/new/")} className="btn-primary">
            {t("newPost")}
          </Link>
        )}
      </div>

      {posts.isLoading ? (
        <p className="text-muted">{t("loading")}</p>
      ) : posts.isError ? (
        <p className="text-muted">{t("errorLoading")}</p>
      ) : (posts.data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-muted">
          {t("noPostsYet")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-subtle text-start">
                <th className="p-3 text-start font-semibold">{t("title")}</th>
                <th className="p-3 text-start font-semibold">{t("author")}</th>
                <th className="p-3 text-start font-semibold">{t("status")}</th>
                <th className="p-3 text-start font-semibold">{t("publishedAt")}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {posts.data?.map((post) => (
                <tr key={post.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <Link
                      to={linkTo(`dashboard/posts/${post.id}/`)}
                      className="font-medium text-body hover:text-brand-600"
                    >
                      {post.title || "—"}
                    </Link>
                  </td>
                  <td className="p-3 text-muted">{post.author_name || "—"}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[post.status]}`}>
                      {statusLabel(post.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-3 text-muted">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3 text-end">
                    {user?.permissions?.canDeletePosts && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(t("confirmDelete"))) remove.mutate(post.id);
                        }}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline"
                      >
                        {t("delete")}
                      </button>
                    )}
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
