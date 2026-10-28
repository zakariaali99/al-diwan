/**
 * Inline editor for short translated lists — blog categories, quality
 * principles. Each row saves on its own; the language tabs switch which
 * translation the text boxes show and write.
 */

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useDT } from "./strings";
import { DeleteButton, Empty, LangTabs, LoadError, Loading, Notice, smallBtn, useEditLang, useFlash } from "./ui";

export interface InlineField {
  key: string;
  label: string;
  type?: "text" | "number";
  translated?: boolean;
  wide?: boolean;
}

interface Row {
  id: number;
  translated_languages?: string[];
}

interface Props<T extends Row> {
  queryKey: string;
  fields: InlineField[];
  list: (language: string) => Promise<T[]>;
  create: (payload: Record<string, unknown>) => Promise<T>;
  update: (id: number, payload: Record<string, unknown>) => Promise<T>;
  remove: (id: number) => Promise<void>;
  canEdit: boolean;
  addLabel: string;
  deleteNote?: string;
  extra?: (row: T) => ReactNode;
  extraLabel?: string;
}

function valuesOf(row: Row | null, fields: InlineField[]) {
  const record = row as unknown as Record<string, unknown> | null;
  return Object.fromEntries(fields.map((f) => [f.key, record ? String(record[f.key] ?? "") : f.type === "number" ? "0" : ""]));
}

function payloadOf(values: Record<string, string>, fields: InlineField[], language: string) {
  const payload: Record<string, unknown> = { language };
  for (const field of fields) payload[field.key] = field.type === "number" ? Number(values[field.key] || 0) : values[field.key];
  return payload;
}

function RowForm<T extends Row>({
  row,
  fields,
  dir,
  language,
  props,
  onDone,
}: {
  row: T | null;
  fields: InlineField[];
  dir: "rtl" | "ltr";
  language: string;
  props: Props<T>;
  onDone: () => void;
}) {
  const dt = useDT();
  const [values, setValues] = useState(() => valuesOf(row, fields));
  // Reset only when the saved row changes (refetch or language switch), never
  // mid-typing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setValues(valuesOf(row, fields)), [row]);
  const dirty = JSON.stringify(values) !== JSON.stringify(valuesOf(row, fields));

  const save = useMutation({
    mutationFn: () => {
      const payload = payloadOf(values, fields, language);
      return row ? props.update(row.id, payload) : props.create(payload);
    },
    onSuccess: () => {
      if (!row) setValues(valuesOf(null, fields));
      onDone();
    },
  });
  const remove = useMutation({ mutationFn: () => props.remove(row!.id), onSuccess: onDone });
  const missing = row && row.translated_languages && !row.translated_languages.includes(language);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
      className="flex flex-wrap items-center gap-3 px-4 py-3"
    >
      {fields.map((field) => (
        <input
          key={field.key}
          aria-label={field.label}
          placeholder={field.label}
          type={field.type === "number" ? "number" : "text"}
          value={values[field.key]}
          onChange={(event) => setValues((previous) => ({ ...previous, [field.key]: event.target.value }))}
          disabled={!props.canEdit}
          required={field.translated}
          dir={field.translated ? dir : "ltr"}
          className={`field-input py-2 ${field.type === "number" ? "w-24" : field.wide ? "min-w-[14rem] flex-1" : "min-w-[10rem] flex-1"} ${
            missing && field.translated ? "border-amber-400" : ""
          }`}
        />
      ))}
      {row && props.extra && <span className="text-sm text-muted">{props.extra(row)}</span>}
      {props.canEdit && (
        <span className="flex items-center gap-1">
          <button type="submit" disabled={save.isPending || (row !== null && !dirty)} className={smallBtn}>
            {save.isPending ? dt("saving") : row ? dt("save") : dt("add")}
          </button>
          {row && (
            <DeleteButton
              pending={remove.isPending}
              confirmText={props.deleteNote ? `${dt("confirmDelete")}\n${props.deleteNote}` : undefined}
              onConfirm={() => remove.mutate()}
            />
          )}
        </span>
      )}
      {(save.isError || remove.isError) && <span className="w-full text-xs text-red-600">{dt("saveFailed")}</span>}
    </form>
  );
}

export default function InlineList<T extends Row>(props: Props<T>) {
  const dt = useDT();
  const queryClient = useQueryClient();
  const { lang, apiLang, dir, setLang } = useEditLang();
  const [flash, setFlash] = useFlash();

  const rows = useQuery({ queryKey: [props.queryKey, apiLang], queryFn: () => props.list(apiLang) });
  const refresh = () => {
    setFlash(dt("saved"));
    queryClient.invalidateQueries({ queryKey: [props.queryKey] });
  };

  return (
    <>
      <LangTabs value={lang} onChange={setLang} />
      {flash && (
        <div className="mb-4">
          <Notice tone="success">{flash}</Notice>
        </div>
      )}
      {props.deleteNote && <p className="mb-4 text-sm text-muted">{props.deleteNote}</p>}

      {props.canEdit && (
        <div className="mb-5 rounded-2xl border border-dashed border-brand-400/60 bg-surface">
          <p className="px-4 pt-3 text-sm font-semibold text-brand-600 dark:text-brand-300">{props.addLabel}</p>
          <RowForm row={null} fields={props.fields} dir={dir} language={apiLang} props={props} onDone={refresh} />
        </div>
      )}

      {rows.isLoading ? (
        <Loading />
      ) : rows.isError ? (
        <LoadError />
      ) : (rows.data?.length ?? 0) === 0 ? (
        <Empty />
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {rows.data?.map((row) => (
            <RowForm key={row.id} row={row} fields={props.fields} dir={dir} language={apiLang} props={props} onDone={refresh} />
          ))}
        </div>
      )}
    </>
  );
}
