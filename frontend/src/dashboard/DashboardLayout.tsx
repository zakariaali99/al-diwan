import { useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";

import logo from "@/assets/logo.png";
import { api } from "@/lib/api";
import { useCurrentUser, useLang, useLinkTo, useT } from "@/lib/hooks";

export default function DashboardLayout() {
  const t = useT();
  const lang = useLang();
  const linkTo = useLinkTo();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-ink-muted">{t("loading")}</div>;
  }

  if (!user?.isAuthenticated) {
    return <Navigate to={linkTo("dashboard/login/")} state={{ from: location.pathname }} replace />;
  }

  const perms = user.permissions;

  const handleSignOut = async () => {
    await api.logout();
    queryClient.clear();
    window.location.href = linkTo("dashboard/login/");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2.5 text-[0.95rem] transition-colors ${
      isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <nav
        className="flex shrink-0 flex-col gap-6 bg-brand-950 p-5 lg:w-60"
        aria-label={t("dashboard")}
      >
        <Link to={linkTo("dashboard/")} className="flex items-center gap-3">
          <img src={logo} alt="" className="h-9 w-9 rounded-full bg-white/95 p-0.5" />
          <span className="font-bold text-white">{t("dashboard")}</span>
        </Link>

        <div className="flex flex-1 flex-row flex-wrap gap-1 lg:flex-col">
          {perms?.canViewPosts && (
            <NavLink to={linkTo("dashboard/posts/")} className={navLinkClass}>
              {t("posts")}
            </NavLink>
          )}
          {perms?.canViewThreads && (
            <NavLink to={linkTo("dashboard/inbox/")} className={navLinkClass}>
              {t("messages")}
            </NavLink>
          )}
          <Link
            to={linkTo("")}
            className="rounded-lg px-3 py-2.5 text-[0.95rem] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            {t("viewSite")}
          </Link>
          {user.is_superuser && (
            <a
              href="/admin/"
              className="rounded-lg px-3 py-2.5 text-[0.95rem] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              {t("fullAdmin")}
            </a>
          )}
        </div>

        <div className="flex items-center gap-3 lg:flex-col lg:items-stretch">
          <span className="px-3 text-xs text-slate-400">{user.username}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-white/30 hover:text-white"
          >
            {t("signOut")}
          </button>
        </div>
      </nav>

      <main className="min-w-0 flex-1 p-5 lg:p-8" lang={lang}>
        <div className="mx-auto max-w-5xl">
          {!perms?.canViewPosts && !perms?.canViewThreads ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-ink-muted">
              {t("noAccess")}
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}
