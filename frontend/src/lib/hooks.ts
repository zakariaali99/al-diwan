import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { api, type Lang } from "./api";
import { DEFAULT_LANG, isLang, makeT } from "./i18n";

/** Reads the active language from the /:lang/ route segment. */
export function useLang(): Lang {
  const { lang } = useParams<{ lang: string }>();
  return isLang(lang) ? lang : DEFAULT_LANG;
}

export function useT() {
  return makeT(useLang());
}

/** Builds a language-prefixed path: linkTo("services/") -> "/ar/services/" */
export function useLinkTo() {
  const lang = useLang();
  return (path = "") => `/${lang}/${path.replace(/^\//, "")}`;
}

export function useSiteSettings() {
  const lang = useLang();
  return useQuery({
    queryKey: ["site-settings", lang],
    queryFn: () => api.siteSettings(lang),
    staleTime: 10 * 60 * 1000,
  });
}

export function useContentBlocks() {
  const lang = useLang();
  return useQuery({
    queryKey: ["content-blocks", lang],
    queryFn: () => api.contentBlocks(lang),
    staleTime: 10 * 60 * 1000,
  });
}

export function useQualityPrinciples() {
  const lang = useLang();
  return useQuery({
    queryKey: ["quality-principles", lang],
    queryFn: () => api.qualityPrinciples(lang),
    staleTime: 10 * 60 * 1000,
  });
}

export function useServiceCategories() {
  const lang = useLang();
  return useQuery({
    queryKey: ["service-categories", lang],
    queryFn: () => api.serviceCategories(lang),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePosts(category?: string) {
  const lang = useLang();
  return useQuery({
    queryKey: ["posts", lang, category ?? null],
    queryFn: () => api.posts(lang, category),
  });
}

export function usePost(slug: string) {
  const lang = useLang();
  return useQuery({
    queryKey: ["post", lang, slug],
    queryFn: () => api.post(lang, slug),
    enabled: Boolean(slug),
  });
}

export function usePostCategories() {
  const lang = useLang();
  return useQuery({
    queryKey: ["post-categories", lang],
    queryFn: () => api.postCategories(lang),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
    staleTime: 60 * 1000,
    retry: false,
  });
}

/**
 * The site's service catalogue mixes two different things: commodity sectors
 * (medical, food, oil…) and shipment-lifecycle stages. They need different
 * treatments — cards vs. a timeline — so split them by name.
 */
const PROCESS_STAGE_NAMES = [
  "فحص ما قبل التصنيع",
  "فحص ما قبل الشحن",
  "أثناء فحص الشحنة",
  "التفتيش عند الوصول",
  "Pre-manufacturing inspection",
  "Pre-shipment inspection",
  "Inspection during shipment",
  "Inspection on arrival",
];

export function splitServiceCategories<T extends { name: string; order: number }>(categories: T[]) {
  const process: T[] = [];
  const commodity: T[] = [];

  for (const category of categories) {
    if (PROCESS_STAGE_NAMES.includes(category.name)) process.push(category);
    else commodity.push(category);
  }

  // Preserve lifecycle order (the admin `order` field already encodes it).
  process.sort((a, b) => a.order - b.order);
  return { commodity, process };
}
