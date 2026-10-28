import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { iconForCategory } from "@/components/Icons";
import { api, type DashboardServiceCategory, type DashboardServiceItem } from "@/lib/api";
import { PlusIcon } from "./icons";
import { useDT } from "./strings";
import {
  DeleteButton,
  Empty,
  LangTabs,
  LoadError,
  Loading,
  Notice,
  PageHeader,
  RequireCap,
  smallBtn,
  useEditLang,
  useFlash,
} from "./ui";

// Language-independent keys the public site uses to pick the icon and to put
// shipment stages on the timeline rather than the sector cards.
const CARD_KEYS = ["medical", "industrial", "food", "oil", "sampling", ""];
const STAGE_KEYS = ["pre-manufacturing", "pre-shipment", "during-shipment", "on-arrival"];

function IconPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const dt = useDT();
  const option = (key: string) => {
    const Icon = iconForCategory({ icon: key, name: "" });
    const active = value === key;
    return (
      <button
        key={key || "general"}
        type="button"
        title={key || "general"}
        aria-label={key || "general"}
        aria-pressed={active}
        onClick={() => onChange(key)}
        className={`grid h-10 w-10 place-items-center rounded-lg border transition-colors ${
          active ? "border-brand-600 bg-brand-600 text-white" : "border-line text-muted hover:border-brand-600 hover:text-brand-600"
        }`}
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  };
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-body">{dt("icon")}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {CARD_KEYS.map(option)}
        <span className="mx-1 h-6 w-px bg-line" aria-hidden />
        {STAGE_KEYS.map(option)}
      </div>
      <p className="mt-1.5 text-xs text-muted">{dt("iconHint")}</p>
    </div>
  );
}

function ItemRow({
  item,
  categoryId,
  language,
  dir,
  onChanged,
}: {
  item: DashboardServiceItem | null;
  categoryId: number;
  language: string;
  dir: "rtl" | "ltr";
  onChanged: () => void;
}) {
  const dt = useDT();
  const [text, setText] = useState(item?.text ?? "");
  const [order, setOrder] = useState(String(item?.order ?? 0));
  useEffect(() => {
    setText(item?.text ?? "");
    setOrder(String(item?.order ?? 0));
  }, [item]);
  const dirty = !item || text !== item.text || Number(order) !== item.order;

  const save = useMutation({
    mutationFn: () => {
      const payload = { text, order: Number(order) || 0, language };
      return item
        ? api.dashboard.serviceItems.update(item.id, payload)
        : api.dashboard.serviceItems.create({ ...payload, category: categoryId });
    },
    onSuccess: () => {
      if (!item) {
        setText("");
        setOrder("0");
      }
      onChanged();
    },
  });
  const remove = useMutation({ mutationFn: () => api.dashboard.serviceItems.remove(item!.id), onSuccess: onChanged });
  const missing = item && !item.translated_languages.includes(language);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        type="number"
        value={order}
        onChange={(event) => setOrder(event.target.value)}
        aria-label={dt("order")}
        className="field-input w-20 py-1.5"
      />
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={item ? dt("itemText") : dt("newItem")}
        aria-label={dt("itemText")}
        required
        dir={dir}
        className={`field-input min-w-[12rem] flex-1 py-1.5 ${missing ? "border-amber-400" : ""}`}
      />
      <button type="submit" disabled={!dirty || save.isPending} className={smallBtn}>
        {item ? dt("save") : <PlusIcon className="h-4 w-4" />}
        {!item && dt("add")}
      </button>
      {item && <DeleteButton pending={remove.isPending} onConfirm={() => remove.mutate()} />}
    </form>
  );
}

function CategoryCard({
  category,
  language,
  dir,
  onChanged,
}: {
  category: DashboardServiceCategory | null;
  language: string;
  dir: "rtl" | "ltr";
  onChanged: () => void;
}) {
  const dt = useDT();
  const [name, setName] = useState(category?.name ?? "");
  const [order, setOrder] = useState(String(category?.order ?? 0));
  const [icon, setIcon] = useState(category?.icon ?? "");
  useEffect(() => {
    setName(category?.name ?? "");
    setOrder(String(category?.order ?? 0));
    setIcon(category?.icon ?? "");
  }, [category]);
  const dirty = !category || name !== category.name || Number(order) !== category.order || icon !== category.icon;

  const save = useMutation({
    mutationFn: () => {
      const payload = { name, order: Number(order) || 0, icon, language };
      return category
        ? api.dashboard.serviceCategories.update(category.id, payload)
        : api.dashboard.serviceCategories.create(payload);
    },
    onSuccess: () => {
      if (!category) {
        setName("");
        setOrder("0");
        setIcon("");
      }
      onChanged();
    },
  });
  const remove = useMutation({ mutationFn: () => api.dashboard.serviceCategories.remove(category!.id), onSuccess: onChanged });
  const missing = category && !category.translated_languages.includes(language);

  return (
    <section
      className={`rounded-2xl border bg-surface p-5 ${category ? "border-line" : "border-dashed border-brand-400/60"}`}
    >
      {!category && <p className="mb-3 text-sm font-semibold text-brand-600 dark:text-brand-300">{dt("newServiceCategory")}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[14rem] flex-1">
            <span className="mb-1.5 block text-sm font-semibold text-body">{dt("name")}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              dir={dir}
              className={`field-input py-2 text-base font-semibold ${missing ? "border-amber-400" : ""}`}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-semibold text-body">{dt("order")}</span>
            <input type="number" value={order} onChange={(event) => setOrder(event.target.value)} className="field-input w-24 py-2" />
          </label>
        </div>
        <IconPicker value={icon} onChange={setIcon} />
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={!dirty || save.isPending} className={smallBtn}>
            {save.isPending ? dt("saving") : category ? dt("save") : dt("add")}
          </button>
          {category && (
            <DeleteButton
              pending={remove.isPending}
              confirmText={`${dt("confirmDelete")} (${category.items.length} ${dt("items")})`}
              onConfirm={() => remove.mutate()}
            />
          )}
          {missing && <span className="text-xs text-amber-700 dark:text-amber-300">{dt("missingTranslation")}</span>}
        </div>
      </form>

      {category && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-3 text-sm font-semibold text-body">
            {dt("items")} <span className="text-muted">({category.items.length})</span>
          </p>
          <div className="flex flex-col gap-2">
            {category.items.map((item) => (
              <ItemRow key={item.id} item={item} categoryId={category.id} language={language} dir={dir} onChanged={onChanged} />
            ))}
            <ItemRow item={null} categoryId={category.id} language={language} dir={dir} onChanged={onChanged} />
          </div>
        </div>
      )}
    </section>
  );
}

function ServicesAdmin() {
  const dt = useDT();
  const queryClient = useQueryClient();
  const { lang, apiLang, dir, setLang } = useEditLang();
  const [flash, setFlash] = useFlash();

  const categories = useQuery({
    queryKey: ["dashboard-service-categories", apiLang],
    queryFn: () => api.dashboard.serviceCategories.list({ language: apiLang }),
  });
  const refresh = () => {
    setFlash(dt("saved"));
    queryClient.invalidateQueries({ queryKey: ["dashboard-service-categories"] });
    queryClient.invalidateQueries({ queryKey: ["service-categories"] });
  };

  return (
    <>
      <PageHeader title={dt("services")} />
      <LangTabs value={lang} onChange={setLang} />
      {flash && (
        <div className="mb-4">
          <Notice tone="success">{flash}</Notice>
        </div>
      )}
      <div className="flex flex-col gap-5">
        <CategoryCard category={null} language={apiLang} dir={dir} onChanged={refresh} />
        {categories.isLoading ? (
          <Loading />
        ) : categories.isError ? (
          <LoadError />
        ) : (categories.data?.length ?? 0) === 0 ? (
          <Empty />
        ) : (
          categories.data?.map((category) => (
            <CategoryCard key={category.id} category={category} language={apiLang} dir={dir} onChanged={refresh} />
          ))
        )}
      </div>
    </>
  );
}

export default function ServicesAdminPage() {
  return (
    <RequireCap capability="manage_services">
      <ServicesAdmin />
    </RequireCap>
  );
}
