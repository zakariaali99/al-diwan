import { Suspense, lazy, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";

import SiteLayout from "./components/SiteLayout";
import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
import { DEFAULT_LANG, dirFor, isLang } from "./lib/i18n";

// The dashboard is staff-only, so it is split into its own chunk rather than
// shipped to every visitor of the public site. The rich-text editor in
// particular has no business loading on the home page.
const DashboardLayout = lazy(() => import("./dashboard/DashboardLayout"));
const LoginPage = lazy(() => import("./dashboard/LoginPage"));
const OverviewPage = lazy(() => import("./dashboard/OverviewPage"));
const PostsPage = lazy(() => import("./dashboard/PostsPage"));
const PostEditPage = lazy(() => import("./dashboard/PostEditPage"));
const CommentsPage = lazy(() => import("./dashboard/CommentsPage"));
const CategoriesPage = lazy(() => import("./dashboard/CategoriesPage"));
const InboxPage = lazy(() => import("./dashboard/InboxPage"));
const ThreadPage = lazy(() => import("./dashboard/ThreadPage"));
const ComposePage = lazy(() => import("./dashboard/ComposePage"));
const ContactsPage = lazy(() => import("./dashboard/ContactsPage"));
const ServicesAdminPage = lazy(() => import("./dashboard/ServicesAdminPage"));
const ContentBlocksPage = lazy(() => import("./dashboard/ContentBlocksPage"));
const PrinciplesPage = lazy(() => import("./dashboard/PrinciplesPage"));
const SiteSettingsPage = lazy(() => import("./dashboard/SiteSettingsPage"));
const StaffPage = lazy(() => import("./dashboard/StaffPage"));
const StaffEditPage = lazy(() => import("./dashboard/StaffEditPage"));

/** Shown for the moment it takes to fetch the dashboard chunk. */
function DashboardFallback() {
  return <div className="grid min-h-screen place-items-center text-muted">…</div>;
}

/** Each dashboard screen is its own chunk; keep the sidebar up while one loads. */
function Page({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="py-10 text-center text-muted">…</div>}>{children}</Suspense>;
}

/** Keeps <html lang>/<dir> in sync so RTL and screen readers work per route. */
function LangShell() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();

  useEffect(() => {
    if (!isLang(lang)) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dirFor(lang);
  }, [lang]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!isLang(lang)) return <Navigate to={`/${DEFAULT_LANG}/`} replace />;

  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="services/" element={<ServicesPage />} />
        <Route path="about-us/" element={<AboutPage />} />
        <Route path="posts/" element={<BlogPage />} />
        <Route path="posts/:id/" element={<BlogPostPage />} />
        <Route path="contact-us/" element={<ContactPage />} />
      </Route>

      <Route
        path="dashboard/login/"
        element={
          <Suspense fallback={<DashboardFallback />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="dashboard/"
        element={
          <Suspense fallback={<DashboardFallback />}>
            <DashboardLayout />
          </Suspense>
        }
      >
        <Route index element={<Page><OverviewPage /></Page>} />
        <Route path="posts/" element={<Page><PostsPage /></Page>} />
        <Route path="posts/new/" element={<Page><PostEditPage /></Page>} />
        <Route path="posts/:id/" element={<Page><PostEditPage /></Page>} />
        <Route path="comments/" element={<Page><CommentsPage /></Page>} />
        <Route path="categories/" element={<Page><CategoriesPage /></Page>} />
        <Route path="inbox/" element={<Page><InboxPage /></Page>} />
        <Route path="inbox/compose/" element={<Page><ComposePage /></Page>} />
        <Route path="contacts/" element={<Page><ContactsPage /></Page>} />
        <Route path="services/" element={<Page><ServicesAdminPage /></Page>} />
        <Route path="content/" element={<Page><ContentBlocksPage /></Page>} />
        <Route path="principles/" element={<Page><PrinciplesPage /></Page>} />
        <Route path="settings/" element={<Page><SiteSettingsPage /></Page>} />
        <Route path="staff/" element={<Page><StaffPage /></Page>} />
        <Route path="staff/new/" element={<Page><StaffEditPage /></Page>} />
        <Route path="staff/:id/" element={<Page><StaffEditPage /></Page>} />
        <Route path="inbox/:id/" element={<Page><ThreadPage /></Page>} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${DEFAULT_LANG}/`} replace />} />
      <Route path="/:lang/*" element={<LangShell />} />
    </Routes>
  );
}
