import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type DashboardContentBlock } from "@/lib/api";
import { useT } from "@/lib/hooks";
import { useDT } from "./strings";
import { Field, LangTabs, LoadError, Loading, Notice, PageHeader, Pill, RequireCap, smallBtn, useEditLang, useFlash } from "./ui";

// Which public pages render each block, so staff know what they're editing.
const PAGES_BY_BLOCK: Record<string, ("home" | "about" | "services")[]> = {
  home_hero: ["home"],
  home_intro: ["home"],
  vision: ["home", "about"],
  mission: ["home", "about"],
  goal: ["home", "about"],
  quality_policy: ["home", "about"],
  about_intro: ["about"],
  team_intro: ["about"],
  about_closing: ["about"],
  about_services_intro: ["services"],
};

function BlockCard({ block, language, dir, onSaved }: { block: DashboardContentBlock; language: string; dir: "rtl" | "ltr"; onSaved: () => void }) {
  const t = useT();
  const dt = useDT();
  const [title, setTitle] = useState(block.title);
  const [body, setBody] = useState(block.body);
  useEffect(() => {
    setTitle(block.title);
    setBody(block.body);
  }, [block]);
  const dirty = title !== block.title || body !== block.body;
  const missing = !block.translated_languages.includes(language);

  const save = useMutation({
    mutationFn: () => api.dashboard.contentBlocks.update(block.id, { title, body, language }),
    onSuccess: onSaved,
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
      className="rounded-2xl border border-line bg-surface p-5"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-subtle px-2 py-0.5 text-xs text-muted" dir="ltr">
          {block.slug}
        </code>
        {(PAGES_BY_BLOCK[block.slug] ?? []).map((page) => (
          <Pill key={page} tone="blue">
            {t(page)}
          </Pill>
        ))}
        {missing && <Pill tone="amber">{dt("missingTranslation")}</Pill>}
      </div>
      <div className="flex flex-col gap-4">
        <Field label={dt("title")} htmlFor={`title-${block.id}`}>
          <input id={`title-${block.id}`} value={title} onChange={(event) => setTitle(event.target.value)} dir={dir} className="field-input" />
        </Field>
        <Field label={dt("body")} htmlFor={`body-${block.id}`}>
          <textarea
            id={`body-${block.id}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={Math.min(10, Math.max(3, Math.ceil(body.length / 90)))}
            dir={dir}
            className="field-input resize-y leading-relaxed"
          />
        </Field>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={!dirty || save.isPending} className={smallBtn}>
            {save.isPending ? dt("saving") : dt("save")}
          </button>
          {save.isError && <span className="text-xs text-red-600">{dt("saveFailed")}</span>}
        </div>
      </div>
    </form>
  );
}

function ContentBlocks() {
  const dt = useDT();
  const queryClient = useQueryClient();
  const { lang, apiLang, dir, setLang } = useEditLang();
  const [flash, setFlash] = useFlash();
  const blocks = useQuery({
    queryKey: ["dashboard-content-blocks", apiLang],
    queryFn: () => api.dashboard.contentBlocks.list({ language: apiLang }),
  });
  const onSaved = () => {
    setFlash(dt("saved"));
    queryClient.invalidateQueries({ queryKey: ["dashboard-content-blocks"] });
    queryClient.invalidateQueries({ queryKey: ["content-blocks"] });
  };

  return (
    <>
      <PageHeader title={dt("contentBlocks")} />
      <LangTabs value={lang} onChange={setLang} />
      {flash && (
        <div className="mb-4">
          <Notice tone="success">{flash}</Notice>
        </div>
      )}
      {blocks.isLoading ? (
        <Loading />
      ) : blocks.isError ? (
        <LoadError />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {blocks.data?.map((block) => (
            <BlockCard key={block.id} block={block} language={apiLang} dir={dir} onSaved={onSaved} />
          ))}
        </div>
      )}
    </>
  );
}

export default function ContentBlocksPage() {
  return (
    <RequireCap capability="manage_content">
      <ContentBlocks />
    </RequireCap>
  );
}
