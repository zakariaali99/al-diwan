import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api, type DashboardPost, type PostStatus } from "@/lib/api";
import { useLinkTo } from "@/lib/hooks";
import RichTextEditor from "./RichTextEditor";
import { POST_STATUS_TONE, usePostStatusLabel } from "./PostsPage";
import { useDT } from "./strings";
import {
  Field,
  LangTabs,
  LoadError,
  Loading,
  Notice,
  PageHeader,
  Panel,
  Pill,
  RequireCap,
  fieldErrors,
  primaryBtn,
  smallBtn,
  useCan,
  useEditLang,
  useFlash,
} from "./ui";

interface FormState {
  title: string;
  excerpt: string;
  body: string;
  seo_title: string;
  seo_description: string;
  category: string;
  status: PostStatus;
  published_at: string; // datetime-local value
}

const EMPTY: FormState = {
  title: "",
  excerpt: "",
  body: "",
  seo_title: "",
  seo_description: "",
  category: "",
  status: "draft",
  published_at: "",
};

/** ISO timestamp -> the local "YYYY-MM-DDTHH:mm" a datetime-local input wants. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromPost(post: DashboardPost): FormState {
  return {
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    seo_title: post.seo_title,
    seo_description: post.seo_description,
    category: post.category ? String(post.category) : "",
    status: post.status,
    published_at: toLocalInput(post.published_at),
  };
}

function PostEditor() {
  const dt = useDT();
  const can = useCan();
  const linkTo = useLinkTo();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const statusLabel = usePostStatusLabel();
  const { id } = useParams<{ id: string }>();
  const { lang, apiLang, dir, setLang } = useEditLang();
  const postId = id ? Number(id) : null;
  const isNew = postId === null;
  const canPublish = can("publish_posts");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [editorKey, setEditorKey] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [flash, setFlash] = useFlash();
  const fileInput = useRef<HTMLInputElement>(null);

  const post = useQuery({
    queryKey: ["dashboard-post", postId, apiLang],
    queryFn: () => api.dashboard.post.get(postId!, apiLang),
    enabled: !isNew,
  });
  const categories = useQuery({
    queryKey: ["dashboard-categories", apiLang],
    queryFn: () => api.dashboard.categories.list({ language: apiLang }),
  });

  useEffect(() => {
    if (!post.data) return;
    setForm(fromPost(post.data));
    // Remount the editor so it picks up the newly loaded translation.
    setEditorKey((key) => key + 1);
  }, [post.data]);

  useEffect(() => {
    if (!image) return setPreview(null);
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const save = useMutation({
    mutationFn: () => {
      const values: Record<string, string> = {
        title: form.title,
        excerpt: form.excerpt,
        body: form.body,
        seo_title: form.seo_title,
        seo_description: form.seo_description,
        category: form.category,
        language: apiLang,
      };
      if (canPublish) {
        values.status = form.status;
        values.published_at = form.published_at ? new Date(form.published_at).toISOString() : "";
      }
      let body: FormData | Record<string, unknown>;
      if (image || removeImage) {
        const data = new FormData();
        Object.entries(values).forEach(([key, value]) => data.append(key, value));
        if (image) data.append("featured_image", image);
        else data.append("remove_image", "true");
        body = data;
      } else {
        body = { ...values, category: form.category ? Number(form.category) : null, published_at: values.published_at || null };
      }
      return isNew ? api.dashboard.post.create(body) : api.dashboard.post.update(postId!, body);
    },
    onSuccess: (result) => {
      setImage(null);
      setRemoveImage(false);
      setFlash(dt("saved"));
      queryClient.invalidateQueries({ queryKey: ["dashboard-posts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
      queryClient.setQueryData(["dashboard-post", result.id, apiLang], result);
      if (isNew) navigate(linkTo(`dashboard/posts/${result.id}/?lang=${lang}`), { replace: true });
    },
  });

  const errors = fieldErrors(save.error);
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  if (!isNew && post.isLoading) return <Loading />;
  if (!isNew && (post.isError || !post.data)) return <LoadError />;

  // Read-only for anyone who may only view posts, and for writers once a post
  // has left draft.
  const locked = !can("manage_posts") || (!isNew && !canPublish && post.data?.status !== "draft");
  const currentImage = removeImage ? null : (preview ?? post.data?.featured_image ?? null);
  const missing = !isNew && post.data && !post.data.translated_languages.includes(apiLang);
  const isLive = post.data?.status === "published" || (post.data?.status === "scheduled" && post.data.published_at && new Date(post.data.published_at) <= new Date());

  return (
    <>
      <PageHeader
        title={isNew ? dt("newPost") : dt("editPost")}
        actions={
          <>
            {!isNew && post.data && <Pill tone={POST_STATUS_TONE[post.data.status]}>{statusLabel(post.data.status)}</Pill>}
            {isLive && (
              <a href={linkTo(`posts/${postId}/`)} target="_blank" rel="noreferrer" className={smallBtn}>
                {dt("viewOnSite")}
              </a>
            )}
            <Link to={linkTo("dashboard/posts/")} className={smallBtn}>
              {dt("back")}
            </Link>
          </>
        }
      />

      <LangTabs value={lang} onChange={setLang} translated={isNew ? undefined : post.data?.translated_languages} />

      <div className="mb-5 flex flex-col gap-3">
        {locked && <Notice tone="warn">{can("manage_posts") ? dt("lockedPost") : dt("forbidden")}</Notice>}
        {!canPublish && !locked && <Notice>{dt("writerNote")}</Notice>}
        {missing && <Notice tone="warn">{dt("missingTranslation")}</Notice>}
        {flash && <Notice tone="success">{flash}</Notice>}
        {save.isError && <Notice tone="error">{errors.detail || dt("saveFailed")}</Notice>}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <fieldset disabled={locked} className="flex min-w-0 flex-col gap-5">
          <Panel>
            <div className="flex flex-col gap-5">
              <Field label={dt("title")} htmlFor="title" error={errors.title}>
                <input
                  id="title"
                  value={form.title}
                  onChange={(event) => update("title", event.target.value)}
                  className="field-input text-lg font-semibold"
                  required
                  dir={dir}
                />
              </Field>
              <Field label={dt("excerpt")} htmlFor="excerpt" error={errors.excerpt}>
                <textarea
                  id="excerpt"
                  rows={2}
                  value={form.excerpt}
                  onChange={(event) => update("excerpt", event.target.value)}
                  className="field-input resize-y"
                  dir={dir}
                />
              </Field>
              <Field label={dt("content")}>
                <RichTextEditor key={`${editorKey}-${apiLang}`} value={form.body} onChange={(html) => update("body", html)} dir={dir} />
              </Field>
            </div>
          </Panel>

          <Panel title={dt("seoSection")}>
            <div className="flex flex-col gap-4">
              <Field label={dt("seoTitle")} htmlFor="seo_title" error={errors.seo_title}>
                <input
                  id="seo_title"
                  value={form.seo_title}
                  onChange={(event) => update("seo_title", event.target.value)}
                  className="field-input"
                  dir={dir}
                />
              </Field>
              <Field label={dt("seoDescription")} htmlFor="seo_description" error={errors.seo_description}>
                <textarea
                  id="seo_description"
                  rows={2}
                  value={form.seo_description}
                  onChange={(event) => update("seo_description", event.target.value)}
                  className="field-input resize-y"
                  dir={dir}
                />
              </Field>
            </div>
          </Panel>
        </fieldset>

        <fieldset disabled={locked} className="flex min-w-0 flex-col gap-5">
          <Panel title={dt("publishing")}>
            <div className="flex flex-col gap-4">
              {canPublish && (
                <>
                  <Field label={dt("status")} htmlFor="status">
                    <select
                      id="status"
                      value={form.status}
                      onChange={(event) => update("status", event.target.value as PostStatus)}
                      className="field-input"
                    >
                      <option value="draft">{dt("draft")}</option>
                      <option value="scheduled">{dt("scheduled")}</option>
                      <option value="published">{dt("published")}</option>
                    </select>
                  </Field>
                  {form.status !== "draft" && (
                    <Field label={dt("publishDate")} htmlFor="published_at" hint={dt("publishDateHint")} error={errors.published_at}>
                      <input
                        id="published_at"
                        type="datetime-local"
                        value={form.published_at}
                        onChange={(event) => update("published_at", event.target.value)}
                        className="field-input"
                        required={form.status === "scheduled"}
                        dir="ltr"
                      />
                    </Field>
                  )}
                </>
              )}
              <Field label={dt("category")} htmlFor="category">
                <select
                  id="category"
                  value={form.category}
                  onChange={(event) => update("category", event.target.value)}
                  className="field-input"
                >
                  <option value="">{dt("noCategory")}</option>
                  {categories.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name || `#${category.id}`}
                    </option>
                  ))}
                </select>
              </Field>
              <button type="submit" disabled={save.isPending} className={`${primaryBtn} w-full`}>
                {save.isPending ? dt("saving") : dt("save")}
              </button>
            </div>
          </Panel>

          <Panel title={dt("featuredImage")}>
            <div className="flex flex-col gap-3">
              <div className="aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-brand-800 to-brand-500">
                {currentImage && <img src={currentImage} alt="" className="h-full w-full object-cover" />}
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                id="featured_image"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setImage(file);
                  if (file) setRemoveImage(false);
                }}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" className={smallBtn} onClick={() => fileInput.current?.click()}>
                  {currentImage ? dt("replaceImage") : dt("chooseImage")}
                </button>
                {currentImage && (
                  <button
                    type="button"
                    className={`${smallBtn} text-red-600 dark:text-red-400`}
                    onClick={() => {
                      setImage(null);
                      if (fileInput.current) fileInput.current.value = "";
                      setRemoveImage(Boolean(post.data?.featured_image));
                    }}
                  >
                    {dt("removeImage")}
                  </button>
                )}
              </div>
              {errors.featured_image && <p className="text-xs text-red-600">{errors.featured_image}</p>}
              <p className="text-xs text-muted">{dt("imageHint")}</p>
            </div>
          </Panel>
        </fieldset>
      </form>
    </>
  );
}

export default function PostEditPage() {
  return (
    <RequireCap capability="view_posts">
      <PostEditor />
    </RequireCap>
  );
}
