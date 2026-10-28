import { useEffect, useState, type ComponentType } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";

import logo from "@/assets/logo.png";
import ThemeToggle from "@/components/ThemeToggle";
import { api, type Capability } from "@/lib/api";
import { useCurrentUser, useLang, useLinkTo, useT } from "@/lib/hooks";
import {
  BadgeIcon,
  CloseIcon,
  CommentsIcon,
  ContactsIcon,
  ExternalIcon,
  InboxIcon,
  LogoutIcon,
  MenuIcon,
  OverviewIcon,
  PostsIcon,
  ServicesIcon,
  SettingsIcon,
  TagIcon,
  TeamIcon,
  TextIcon,
} from "./icons";
import { useDT, type DashboardKey } from "./strings";

interface NavItem {
  to: string;
  label: DashboardKey;
  icon: ComponentType<{ className?: string }>;
  capability?: Capability;
  badge?: "unread";
}

const NAV: { section?: DashboardKey; items: NavItem[] }[] = [
  { items: [{ to: "dashboard/", label: "overview", icon: OverviewIcon }] },
  {
    section: "sectionBlog",
    items: [
      { to: "dashboard/posts/", label: "posts", icon: PostsIcon, capability: "view_posts" },
      { to: "dashboard/comments/", label: "comments", icon: CommentsIcon, capability: "view_comments" },
      { to: "dashboard/categories/", label: "postCategories", icon: TagIcon, capability: "manage_posts" },
    ],
  },
  {
    section: "sectionInbox",
    items: [
      { to: "dashboard/inbox/", label: "inbox", icon: InboxIcon, capability: "view_messages", badge: "unread" },
      { to: "dashboard/contacts/", label: "contacts", icon: ContactsIcon, capability: "view_messages" },
    ],
  },
  {
    section: "sectionSite",
    items: [
      { to: "dashboard/services/", label: "services", icon: ServicesIcon, capability: "manage_services" },
      { to: "dashboard/content/", label: "contentBlocks", icon: TextIcon, capability: "manage_content" },
      { to: "dashboard/principles/", label: "principles", icon: BadgeIcon, capability: "manage_content" },
      { to: "dashboard/settings/", label: "siteSettings", icon: SettingsIcon, capability: "manage_content" },
    ],
  },
  {
    section: "sectionTeam",
    items: [{ to: "dashboard/staff/", label: "staff", icon: TeamIcon, capability: "manage_staff" }],
  },
];

export default function DashboardLayout() {
  const dt = useDT();
  const t = useT();
  const lang = useLang();
  const linkTo = useLinkTo();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const capabilities = new Set(user?.capabilities ?? []);
  const overview = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: api.dashboard.overview,
    enabled: Boolean(user?.isAuthenticated),
    refetchInterval: 60_000,
  });

  // Close the phone drawer whenever a link is followed.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-muted">{dt("loading")}</div>;
  }

  if (!user?.isAuthenticated) {
    return <Navigate to={linkTo("dashboard/login/")} state={{ from: location.pathname }} replace />;
  }

  const handleSignOut = async () => {
    await api.logout();
    queryClient.clear();
    window.location.href = linkTo("dashboard/login/");
  };

  const unread = overview.data?.messages?.unread ?? 0;
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "";

  const sections = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.capability || capabilities.has(item.capability)),
  })).filter((group) => group.items.length > 0);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] font-medium transition-colors ${
      isActive ? "bg-brand-600 text-white shadow-sm" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
    }`;

  const sidebar = (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <Link to={linkTo("dashboard/")} className="flex items-center gap-3 px-2 pt-1">
        <img src={logo} alt="" className="h-10 w-10 rounded-full bg-white p-0.5" />
        <span className="leading-tight">
          <span className="block font-bold text-white">{t("dashboard")}</span>
          <span className="block text-xs text-slate-400">{t("companyName")}</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-5" aria-label={t("dashboard")}>
        {sections.map((group, index) => (
          <div key={group.section ?? index} className="flex flex-col gap-1">
            {group.section && (
              <p className="px-3 pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {dt(group.section)}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink key={item.to} to={linkTo(item.to)} end={item.to === "dashboard/"} className={linkClass}>
                <item.icon className="h-5 w-5 shrink-0 opacity-90" />
                <span className="flex-1">{dt(item.label)}</span>
                {item.badge === "unread" && unread > 0 && (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[0.7rem] font-bold text-brand-950">
                    {unread}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
        <Link
          to={linkTo("")}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <ExternalIcon className="h-5 w-5" />
          {dt("viewSite")}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-start text-[0.92rem] text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <LogoutIcon className="h-5 w-5" />
          {dt("signOut")}
        </button>
        <div className="mt-3 flex items-center gap-3 px-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-700 text-sm font-bold uppercase text-white">
            {displayName.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-slate-300">{displayName}</span>
          <ThemeToggle onDark />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-subtle lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-brand-950 lg:block">{sidebar}</aside>

      {/* Phone top bar + drawer */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-brand-950 px-4 py-3 lg:hidden">
        <Link to={linkTo("dashboard/")} className="flex items-center gap-2">
          <img src={logo} alt="" className="h-8 w-8 rounded-full bg-white p-0.5" />
          <span className="font-bold text-white">{t("dashboard")}</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 text-white hover:bg-white/10"
          aria-label={dt("openMenu")}
          aria-expanded={menuOpen}
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={dt("closeMenu")}
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 start-0 w-72 max-w-[85vw] bg-brand-950 shadow-2xl">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute end-3 top-3 rounded-lg p-2 text-white hover:bg-white/10"
              aria-label={dt("closeMenu")}
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10" lang={lang}>
        <div className="mx-auto max-w-6xl">
          {capabilities.size === 0 && location.pathname.replace(/\/$/, "").endsWith("dashboard") ? (
            <div className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">{dt("noAccess")}</div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}
