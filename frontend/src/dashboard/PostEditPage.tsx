import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { api, type Lang } from "@/lib/api";
import { useLinkTo, useT } from "@/lib/hooks";
import { LANGS, LANG_META, isLang } from "@/lib/i18n";
import RichTextEditor from "./RichTextEditor";

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  seo_title: string;
  seo_description: string;
  status: "draft" | "scheduled" | "published";
}

const EMPTY: FormState = {
  title: "", slug: "", excerpt: "", body: "",
  seo_title: "", seo_description: "", status: "draft",
};

export default function PostEditPage() {
  const t = useT();
  const linkTo = useLinkTo();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const isNew = !id;
  const postId = id ? Number(id) : null;

  // Which translation is being edited. Sent to the API so parler writes the
  // right one — without it an English edit silently overwrites Arabic.
  const editLangParam = searchParams.get("lang");
  const editLang: Lang = isLang(editLangParam ?? undefined) ? (editLangParam as Lang) : "ar";

  const [form, setForm] = useState<FormState>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const post = useQuery({
    queryKey: ["dashboard-post", postId, editLang],
    queryFn: () => api.dashboard.post(postId!),
    enabled: postId !== null,
  });

  useEffect(() => {
    if (!post.data) return;
    setForm({
      title: post.data.title ?? "",
      slug: post.data.slug ?? "",
      excerpt: post.data.excerpt ?? "",
      body: post.data.body ?? "",
      seo_title: post.data.seo_title ?? "",
      seo_description: post.data.seo_description ?? "",
      status: post.data.status,
    });
    // Remount the editor so it picks up the newly loaded translation.
    setEditorKey((key) => key + 1);
  }, [post.data]);

  const save = useMutation({
    mutationFn: (values: FormState) => {
      const payload = { ...values, language: editLang };
      return isNew
        ? api.dashboard.createPost(payload)
        : api.dashboard.updatePost(postId!, payload);
    },
    onSuccess: (result) => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["dashboard-posts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-post", result.id] });
      if (isNew) navigate(linkTo(`dashboard/posts/${result.id}/?lang=${editLang}`), { replace: true });
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const switchLang = (lang: Lang) => {
    setSearchParams({ lang });
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">{isNew ? t("newPost") : t("editPost")}</h1>
        <Link to={linkTo("dashboard/posts/")} className="btn-ghost">{t("back")}</Link>
      </div>

      {!isNew && (
        <div className="mb-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("editingLanguage")}>
            {LANGS.map((code) => {
              const translated = post.data?.available_languages.includes(LANG_META[code].apiLang);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => switchLang(code)}
                  aria-current={editLang === code ? "true" : undefined}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    editLang === code
                      ? "bg-brand-600 text-white"
                      : "border border-slate-200 bg-white text-ink-muted hover:border-brand-600"
                  }`}
                >
                  {LANG_META[code].name}
                  {/* Dot marks which languages already have a translation, so
                      staff can see at a glance what's still missing. */}
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full ${
                      translated
                        ? editLang === code ? "bg-white" : "bg-green-500"
                        : editLang === code ? "bg-white/40" : "bg-slate-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-ink-muted">{t("editingLanguageNote")}</p>
        </div>
      )}

      {saved && (
        <p role="status" className="mb-5 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          {t("saved")}
        </p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate(form);
        }}
        className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6"
      >
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-semibold">{t("title")}</label>
          <input
            id="title"
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            className="field-input"
            required
            dir={editLang === "ar" ? "rtl" : "ltr"}
          />
        </div>

        <div>
          <label htmlFor="slug" className="mb-2 block text-sm font-semibold">{t("slug")}</label>
          <input
            id="slug"
            value={form.slug}
            onChange={(event) => update("slug", event.target.value)}
            className="field-input"
            dir={editLang === "ar" ? "rtl" : "ltr"}
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="mb-2 block text-sm font-semibold">{t("excerpt")}</label>
          <textarea
            id="excerpt"
            rows={3}
            value={form.excerpt}
            onChange={(event) => update("excerpt", event.target.value)}
            className="field-input resize-y"
            dir={editLang === "ar" ? "rtl" : "ltr"}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">{t("content")}</label>
          <RichTextEditor
            key={editorKey}
            value={form.body}
            onChange={(html) => update("body", html)}
            dir={editLang === "ar" ? "rtl" : "ltr"}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="seo_title" className="mb-2 block text-sm font-semibold">SEO title</label>
            <input
              id="seo_title"
              value={form.seo_title}
              onChange={(event) => update("seo_title", event.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-semibold">{t("status")}</label>
            <select
              id="status"
              value={form.status}
              onChange={(event) => update("status", event.target.value as FormState["status"])}
              className="field-input"
            >
              <option value="draft">{t("draft")}</option>
              <option value="scheduled">{t("scheduled")}</option>
              <option value="published">{t("published")}</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="seo_description" className="mb-2 block text-sm font-semibold">SEO description</label>
          <textarea
            id="seo_description"
            rows={2}
            value={form.seo_description}
            onChange={(event) => update("seo_description", event.target.value)}
            className="field-input resize-y"
          />
        </div>

        <button type="submit" disabled={save.isPending} className="btn-primary self-start disabled:opacity-60">
          {save.isPending ? t("saving") : t("save")}
        </button>

        {save.isError && (
          <p role="alert" className="text-sm text-red-600">{t("errorLoading")}</p>
        )}
      </form>
    </>
  );
}
