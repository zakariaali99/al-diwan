import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type DashboardSiteSettings } from "@/lib/api";
import { useDT, type DashboardKey } from "./strings";
import {
  Field,
  LangTabs,
  LoadError,
  Loading,
  Notice,
  PageHeader,
  Panel,
  RequireCap,
  fieldErrors,
  primaryBtn,
  useEditLang,
  useFlash,
} from "./ui";

type Values = Omit<DashboardSiteSettings, "translated_languages">;

const CONTACT_FIELDS: [keyof Values, DashboardKey, string][] = [
  ["phone", "phone", "tel"],
  ["email", "email", "email"],
  ["whatsapp_url", "whatsapp", "url"],
  ["address", "address", "text"],
  ["map_url", "mapUrl", "url"],
];
const SOCIAL_FIELDS: [keyof Values, string][] = [
  ["facebook_url", "Facebook"],
  ["instagram_url", "Instagram"],
  ["x_url", "X (Twitter)"],
];

function SiteSettings() {
  const dt = useDT();
  const queryClient = useQueryClient();
  const { lang, apiLang, dir, setLang } = useEditLang();
  const [flash, setFlash] = useFlash();
  const [values, setValues] = useState<Values | null>(null);

  const settings = useQuery({
    queryKey: ["dashboard-site-settings", apiLang],
    queryFn: () => api.dashboard.siteSettings(apiLang),
  });
  useEffect(() => {
    if (settings.data) setValues(settings.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () => api.dashboard.updateSiteSettings({ ...values, language: apiLang }),
    onSuccess: (data) => {
      setFlash(dt("saved"));
      queryClient.setQueryData(["dashboard-site-settings", apiLang], data);
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
  const errors = fieldErrors(save.error);

  if (settings.isLoading || !values) return settings.isError ? <LoadError /> : <Loading />;

  const set = (key: keyof Values, value: string) => setValues((previous) => (previous ? { ...previous, [key]: value } : previous));

  return (
    <>
      <PageHeader title={dt("siteSettings")} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        className="flex flex-col gap-5"
      >
        <Panel title={dt("tagline")}>
          <LangTabs value={lang} onChange={setLang} translated={settings.data?.translated_languages} />
          <Field label={`${dt("tagline")} — ${dt("translatedField")}`} htmlFor="tagline" error={errors.tagline}>
            <input id="tagline" value={values.tagline} onChange={(event) => set("tagline", event.target.value)} dir={dir} className="field-input" />
          </Field>
        </Panel>

        <Panel title={dt("contactInfo")}>
          <div className="grid gap-4 sm:grid-cols-2">
            {CONTACT_FIELDS.map(([key, label, type]) => (
              <Field key={key} label={dt(label)} htmlFor={key} error={errors[key]}>
                <input
                  id={key}
                  type={type}
                  value={values[key]}
                  onChange={(event) => set(key, event.target.value)}
                  dir={key === "address" ? undefined : "ltr"}
                  className="field-input"
                />
              </Field>
            ))}
          </div>
        </Panel>

        <Panel title={dt("socialLinks")}>
          <div className="grid gap-4 sm:grid-cols-3">
            {SOCIAL_FIELDS.map(([key, label]) => (
              <Field key={key} label={label} htmlFor={key} error={errors[key]}>
                <input id={key} type="url" value={values[key]} onChange={(event) => set(key, event.target.value)} dir="ltr" className="field-input" />
              </Field>
            ))}
          </div>
        </Panel>

        {flash && <Notice tone="success">{flash}</Notice>}
        {save.isError && <Notice tone="error">{dt("saveFailed")}</Notice>}
        <button type="submit" disabled={save.isPending} className={`${primaryBtn} self-start`}>
          {save.isPending ? dt("saving") : dt("save")}
        </button>
      </form>
    </>
  );
}

export default function SiteSettingsPage() {
  return (
    <RequireCap capability="manage_content">
      <SiteSettings />
    </RequireCap>
  );
}
