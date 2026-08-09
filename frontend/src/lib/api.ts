/**
 * API client. Same-origin, so auth is the Django session cookie plus the
 * CSRF token — no tokens to store, no CORS.
 */

export type Lang = "ar" | "en";

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
  if (lang) headers["Accept-Language"] = lang;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (isWrite) {
    const token = getCookie("csrftoken");
    if (token) headers["X-CSRFToken"] = token;
  }

  const response = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    body: body === undefined ? undefined : JSON.stringify(body),
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
  slug: string;
}

export interface PostListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: PostCategory | null;
  author_name: string;
  featured_image: string | null;
  published_at: string | null;
}

export interface PostDetail extends PostListItem {
  body: string;
  seo_title: string;
  seo_description: string;
  updated_at: string;
}

export interface UserPermissions {
  canViewPosts: boolean;
  canAddPosts: boolean;
  canChangePosts: boolean;
  canDeletePosts: boolean;
  canViewThreads: boolean;
  canChangeThreads: boolean;
  canAddThreads: boolean;
}

export interface CurrentUser {
  isAuthenticated: boolean;
  id?: number;
  username?: string;
  is_superuser?: boolean;
  permissions?: UserPermissions;
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

export interface ThreadListItem {
  id: number;
  subject: string;
  correspondent: Correspondent;
  assigned_to_name: string;
  status: "open" | "pending" | "closed";
  is_unread: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ThreadDetail extends ThreadListItem {
  messages: ThreadMessage[];
}

export interface DashboardPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  seo_title: string;
  seo_description: string;
  category: number | null;
  featured_image: string | null;
  status: "draft" | "scheduled" | "published";
  published_at: string | null;
  author_name: string;
  available_languages: string[];
  created_at: string;
  updated_at: string;
}

// --- Endpoints -------------------------------------------------------------

export const api = {
  siteSettings: (lang: Lang) => request<SiteSettings>("/api/site-settings/", { lang }),
  contentBlocks: (lang: Lang) => request<ContentBlocks>("/api/content-blocks/", { lang }),
  qualityPrinciples: (lang: Lang) => request<QualityPrinciple[]>("/api/quality-principles/", { lang }),
  serviceCategories: (lang: Lang) => request<ServiceCategory[]>("/api/service-categories/", { lang }),
  postCategories: (lang: Lang) => request<PostCategory[]>("/api/post-categories/", { lang }),

  posts: (lang: Lang, category?: string) =>
    request<PostListItem[]>(
      `/api/posts/${category ? `?category=${encodeURIComponent(category)}` : ""}`,
      { lang },
    ),
  post: (lang: Lang, slug: string) =>
    request<PostDetail>(`/api/posts/${encodeURIComponent(slug)}/`, { lang }),

  contact: (payload: { name: string; email: string; subject: string; message: string; website: string }) =>
    request<{ thread_id: number }>("/api/contact/", { method: "POST", body: payload }),

  me: () => request<CurrentUser>("/api/auth/me/"),
  login: (username: string, password: string) =>
    request<CurrentUser>("/api/auth/login/", { method: "POST", body: { username, password } }),
  logout: () => request<void>("/api/auth/logout/", { method: "POST" }),

  dashboard: {
    posts: () => request<DashboardPost[]>("/api/dashboard/posts/"),
    post: (id: number) => request<DashboardPost>(`/api/dashboard/posts/${id}/`),
    createPost: (payload: Record<string, unknown>) =>
      request<DashboardPost>("/api/dashboard/posts/", { method: "POST", body: payload }),
    updatePost: (id: number, payload: Record<string, unknown>) =>
      request<DashboardPost>(`/api/dashboard/posts/${id}/`, { method: "PATCH", body: payload }),
    deletePost: (id: number) =>
      request<void>(`/api/dashboard/posts/${id}/`, { method: "DELETE" }),

    threads: (params: { status?: string; mine?: boolean } = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.set("status", params.status);
      if (params.mine) query.set("mine", "1");
      const qs = query.toString();
      return request<ThreadListItem[]>(`/api/dashboard/threads/${qs ? `?${qs}` : ""}`);
    },
    thread: (id: number) => request<ThreadDetail>(`/api/dashboard/threads/${id}/`),
    reply: (id: number, body: string) =>
      request<ThreadDetail>(`/api/dashboard/threads/${id}/reply/`, { method: "POST", body: { body } }),
    compose: (payload: { to_name: string; to_email: string; subject: string; body: string }) =>
      request<ThreadDetail>("/api/dashboard/threads/compose/", { method: "POST", body: payload }),
    assignToMe: (id: number) =>
      request<ThreadListItem>(`/api/dashboard/threads/${id}/assign-to-me/`, { method: "POST" }),
    close: (id: number) =>
      request<ThreadListItem>(`/api/dashboard/threads/${id}/close/`, { method: "POST" }),
  },
};
