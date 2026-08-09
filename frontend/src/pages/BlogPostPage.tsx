import { Link, useParams } from "react-router-dom";

import { ArrowIcon } from "@/components/Icons";
import Reveal from "@/components/Reveal";
import { ErrorBlock, LoadingBlock, PageHeader, PostCard } from "@/components/Sections";
import { usePost, usePosts, useLinkTo, useT } from "@/lib/hooks";
import { usePageMeta } from "@/lib/meta";

export default function BlogPostPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const t = useT();
  const linkTo = useLinkTo();
  const post = usePost(decodeURIComponent(slug));
  const allPosts = usePosts();

  usePageMeta({
    title: post.data ? `${post.data.seo_title || post.data.title} — ${t("companyName")}` : undefined,
    description: post.data?.seo_description || post.data?.excerpt,
  });

  if (post.isLoading) return <LoadingBlock />;
  if (post.isError || !post.data) return <ErrorBlock />;

  const related = (allPosts.data ?? []).filter((p) => p.id !== post.data.id).slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow={post.data.category?.name || t("blog")}
        title={post.data.title}
        lede={
          post.data.published_at
            ? new Date(post.data.published_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : undefined
        }
      />

      <article className="py-16 lg:py-20">
        <div className="container-page max-w-3xl">
          {post.data.featured_image && (
            <img
              src={post.data.featured_image}
              alt=""
              className="mb-10 aspect-video w-full rounded-2xl object-cover"
            />
          )}

          {post.data.excerpt && (
            <p className="mb-8 text-lg leading-relaxed text-ink-muted">{post.data.excerpt}</p>
          )}

          <div
            className="prose-content"
            // Body is HTML authored by staff in the dashboard editor.
            dangerouslySetInnerHTML={{ __html: post.data.body }}
          />

          <Link to={linkTo("posts/")} className="btn-ghost group mt-12">
            <ArrowIcon className="h-4.5 w-4.5 rotate-180 transition-transform group-hover:-translate-x-1 rtl:rotate-0 rtl:group-hover:translate-x-1" />
            {t("backToBlog")}
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <section className="bg-slate-50 py-20">
          <div className="container-page">
            <h2 className="mb-10 text-2xl font-bold text-ink">{t("readNext")}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, index) => (
                <Reveal key={item.id} delay={index * 0.05}>
                  <PostCard post={item} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
