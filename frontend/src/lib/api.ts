/**
 * API client. Same-origin, so auth is the Django session cookie plus the
 * CSRF token — no tokens to store, no CORS.
 */

import { apiLangFor, isLang, type Lang } from "./i18n";

export type { Lang };

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown, message: string) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/** Django only sets csrftoken after a GET that calls get_token(). */
export async function primeCsrf(): Promise<void> {
  if (getCookie("csrftoken")) return;
  await fetch("/api/auth/csrf/", { credentials: "same-origin" });
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  lang?: Lang;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, lang } = options;
  const isWrite = method !== "GET" && method !== "HEAD";

  if (isWrite) await primeCsrf();

  const headers: Record<string, string> = {};
  // parler resolves translations from the active language; /api/ is outside
  // i18n_patterns so Django reads it from this header.
  // Calls that don't name a language (the dashboard's) follow the page's, which
  // LangShell keeps on <html lang>.
  const pageLang = document.documentElement.lang;
  const effective = lang ?? (isLang(pageLang) ? pageLang : undefined);
  if (effective) headers["Accept-Language"] = apiLangFor(effective);
  // FormData (file uploads) sets its own multipart boundary.
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (isWrite) {
    const token = getCookie("csrftoken");
    if (token) headers["X-CSRFToken"] = token;
  }

  const response = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : `Request failed (${response.status})`;
    throw new ApiError(response.status, payload, detail);
  }

  return payload as T;
}

// --- Types mirroring the DRF serializers ----------------------------------

export interface SiteSettings {
  tagline: string;
  phone: string;
  whatsapp_url: string;
  email: string;
  address: string;
  map_url: string;
  facebook_url: string;
  instagram_url: string;
  x_url: string;
}

export interface ContentBlock {
  slug: string;
  title: string;
  body: string;
}

export type ContentBlocks = Record<string, ContentBlock | undefined>;

export interface QualityPrinciple {
  id: number;
  text: string;
  order: number;
}

export interface ServiceItem {
  id: number;
  text: string;
  order: number;
}

export interface ServiceCategory {
  id: number;
  name: string;
  icon: string;
  order: number;
  items: ServiceItem[];
}

export interface PostCategory {
  id: number;
  name: string;
}

export interface PostListItem {
  id: number;
  title: string;
  excerpt: string;
  category: PostCategory | null;
  author_name: string;
  featured_image: string | null;
  published_at: string | null;
  comment_count: number;
}

export interface PublicComment {
  id: number;
  name: string;
  body: string;
  created_at: string;
}

export interface PostDetail extends PostListItem {
  body: string;
  seo_title: string;
  seo_description: string;
  updated_at: string;
}

// --- Dashboard -------------------------------------------------------------

export const CAPABILITIES = [
  "view_posts",
  "manage_posts",
  "publish_posts",
  "delete_posts",
  "view_comments",
  "moderate_comments",
  "view_messages",
  "reply_messages",
  "manage_services",
  "manage_content",
  "manage_staff",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export interface CurrentUser {
  isAuthenticated: boolean;
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_superuser?: boolean;
  capabilities?: Capability[];
}

/** Every translated record says which languages it has text in. */
interface Translated {
  translated_languages: string[];
}

export interface Correspondent {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface ThreadMessage {
  id: number;
  direction: "in" | "out";
  from_email: string;
  to_email: string;
  body: string;
  sent_by_name: string;
  is_read: boolean;
  created_at: string;
  attachments: { id: number; filename: string; url: string }[];
}

export type ThreadStatus = "open" | "pending" | "closed";

export interface ThreadListItem {
  id: number;
  subject: string;
  correspondent: Correspondent;
  assigned_to: number | null;
  assigned_to_name: string;
  status: ThreadStatus;
  is_unread: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ThreadDetail extends ThreadListItem {
  messages: ThreadMessage[];
}

export type PostStatus = "draft" | "scheduled" | "published";

export interface DashboardPostListItem extends Translated {
  id: number;
  title: string;
  status: PostStatus;
  category: number | null;
  category_name: string;
  author_name: string;
  featured_image: string | null;
  comment_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardPost extends Translated {
  id: number;
  title: string;
  excerpt: string;
  body: string;
  seo_title: string;
  seo_description: string;
  category: number | null;
  featured_image: string | null;
  status: PostStatus;
  published_at: string | null;
  author_name: string;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardCategory extends Translated {
  id: number;
  name: string;
  post_count: number;
}

export interface DashboardComment {
  id: number;
  post: number;
  post_title: string;
  name: string;
  email: string;
  body: string;
  is_visible: boolean;
  created_at: string;
}

export interface DashboardServiceItem extends Translated {
  id: number;
  category: number;
  text: string;
  order: number;
}

export interface DashboardServiceCategory extends Translated {
  id: number;
  name: string;
  icon: string;
  order: number;
  items: DashboardServiceItem[];
}

export interface DashboardSiteSettings extends Translated {
  tagline: string;
  phone: string;
  whatsapp_url: string;
  email: string;
  address: string;
  map_url: string;
  facebook_url: string;
  instagram_url: string;
  x_url: string;
}

export interface DashboardContentBlock extends Translated {
  id: number;
  slug: string;
  title: string;
  body: string;
}

export interface DashboardPrinciple extends Translated {
  id: number;
  text: string;
  order: number;
}

export interface DashboardContact extends Correspondent {
  thread_count: number;
  created_at: string;
}

export interface StaffMember {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  role: string;
  capabilities: Capability[];
  last_login: string | null;
  date_joined: string;
}

export interface RolesInfo {
  roles: Record<string, Capability[]>;
  capabilities: Capability[];
  implies: Partial<Record<Capability, Capability[]>>;
}

export interface Overview {
  posts?: { published: number; drafts: number; scheduled: number };
  comments?: { total: number; this_week: number; hidden: number };
  messages?: { unread: number; open: number; mine: number };
  services?: { categories: number; items: number };
  staff?: { active: number };
}

type Payload = Record<string, unknown>;

function query(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "" && value !== false) {
      search.set(key, value === true ? "1" : String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** CRUD helpers for a dashboard resource addressed by numeric id. */
function resource<T>(base: string) {
  return {
    list: (params: Record<string, string | number | boolean | undefined> = {}) =>
      request<T[]>(`/api/dashboard/${base}/${query(params)}`),
    get: (id: number, language?: string) => request<T>(`/api/dashboard/${base}/${id}/${query({ language })}`),
    create: (body: Payload | FormData) => request<T>(`/api/dashboard/${base}/`, { method: "POST", body }),
    update: (id: number, body: Payload | FormData) =>
      request<T>(`/api/dashboard/${base}/${id}/`, { method: "PATCH", body }),
    remove: (id: number) => request<void>(`/api/dashboard/${base}/${id}/`, { method: "DELETE" }),
  };
}

// --- Endpoints -------------------------------------------------------------

export const api = {
  siteSettings: (lang: Lang) => request<SiteSettings>("/api/site-settings/", { lang }),
  contentBlocks: (lang: Lang) => request<ContentBlocks>("/api/content-blocks/", { lang }),
  qualityPrinciples: (lang: Lang) => request<QualityPrinciple[]>("/api/quality-principles/", { lang }),
  serviceCategories: (lang: Lang) => request<ServiceCategory[]>("/api/service-categories/", { lang }),
  postCategories: (lang: Lang) => request<PostCategory[]>("/api/post-categories/", { lang }),

  posts: (lang: Lang, category?: string) => request<PostListItem[]>(`/api/posts/${query({ category })}`, { lang }),
  post: (lang: Lang, id: number) => request<PostDetail>(`/api/posts/${id}/`, { lang }),
  comments: (postId: number) => request<PublicComment[]>(`/api/posts/${postId}/comments/`),
  addComment: (postId: number, payload: { name: string; email: string; body: string; website: string }) =>
    request<PublicComment>(`/api/posts/${postId}/comments/`, { method: "POST", body: payload }),

  contact: (payload: { name: string; email: string; subject: string; message: string; website: string }) =>
    request<{ thread_id: number }>("/api/contact/", { method: "POST", body: payload }),

  me: () => request<CurrentUser>("/api/auth/me/"),
  login: (username: string, password: string) =>
    request<CurrentUser>("/api/auth/login/", { method: "POST", body: { username, password } }),
  logout: () => request<void>("/api/auth/logout/", { method: "POST" }),

  dashboard: {
    overview: () => request<Overview>("/api/dashboard/overview/"),

    posts: resource<DashboardPostListItem>("posts"),
    post: resource<DashboardPost>("posts"),
    categories: resource<DashboardCategory>("post-categories"),
    comments: resource<DashboardComment>("comments"),

    threads: resource<ThreadListItem>("threads"),
    thread: (id: number) => request<ThreadDetail>(`/api/dashboard/threads/${id}/`),
    reply: (id: number, body: string) =>
      request<ThreadDetail>(`/api/dashboard/threads/${id}/reply/`, { method: "POST", body: { body } }),
    compose: (payload: { to_name: string; to_email: string; subject: string; body: string }) =>
      request<ThreadDetail>("/api/dashboard/threads/compose/", { method: "POST", body: payload }),
    assignToMe: (id: number) =>
      request<ThreadListItem>(`/api/dashboard/threads/${id}/assign-to-me/`, { method: "POST" }),
    contacts: resource<DashboardContact>("contacts"),

    serviceCategories: resource<DashboardServiceCategory>("service-categories"),
    serviceItems: resource<DashboardServiceItem>("service-items"),

    siteSettings: (language: string) =>
      request<DashboardSiteSettings>(`/api/dashboard/site-settings/${query({ language })}`),
    updateSiteSettings: (body: Payload) =>
      request<DashboardSiteSettings>("/api/dashboard/site-settings/", { method: "PATCH", body }),
    contentBlocks: resource<DashboardContentBlock>("content-blocks"),
    principles: resource<DashboardPrinciple>("quality-principles"),

    staff: resource<StaffMember>("staff"),
    roles: () => request<RolesInfo>("/api/dashboard/staff/roles/"),
  },
};
