import { useSearchParams } from "react-router-dom";

import Reveal from "@/components/Reveal";
import { ErrorBlock, LoadingBlock, PageHeader, PostCard } from "@/components/Sections";
import { usePostCategories, usePosts, useT } from "@/lib/hooks";
import { usePageMeta } from "@/lib/meta";

export default function BlogPage() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") ?? undefined;

  const posts = usePosts(activeCategory);
  const categories = usePostCategories();

  usePageMeta({ title: `${t("blogTitle")} — ${t("companyName")}`, description: t("blogLede") });

  return (
    <>
      <PageHeader eyebrow={t("blog")} title={t("blogTitle")} lede={t("blogLede")} />

      <section className="py-20 lg:py-24">
        <div className="container-page">
          {(categories.data?.length ?? 0) > 0 && (
            <nav className="mb-10 flex flex-wrap gap-2" aria-label={t("allCategories")}>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                aria-current={!activeCategory ? "true" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  !activeCategory
                    ? "bg-brand-600 text-white"
                    : "border border-line text-muted hover:border-brand-600 hover:text-brand-600"
                }`}
              >
                {t("allCategories")}
              </button>
              {categories.data?.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSearchParams({ category: String(category.id) })}
                  aria-current={activeCategory === String(category.id) ? "true" : undefined}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeCategory === String(category.id)
                      ? "bg-brand-600 text-white"
                      : "border border-line text-muted hover:border-brand-600 hover:text-brand-600"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </nav>
          )}

          {posts.isLoading ? (
            <LoadingBlock />
          ) : posts.isError ? (
            <ErrorBlock />
          ) : (posts.data?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-line bg-subtle py-16 text-center text-muted">
              {t("noPosts")}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.data?.map((post, index) => (
                <Reveal key={post.id} delay={index * 0.05}>
                  <PostCard post={post} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
