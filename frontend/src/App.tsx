import { Suspense, lazy, useEffect } from "react";
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
const PostsPage = lazy(() => import("./dashboard/PostsPage"));
const PostEditPage = lazy(() => import("./dashboard/PostEditPage"));
const InboxPage = lazy(() => import("./dashboard/InboxPage"));
const ThreadPage = lazy(() => import("./dashboard/ThreadPage"));
const ComposePage = lazy(() => import("./dashboard/ComposePage"));

/** Shown for the moment it takes to fetch the dashboard chunk. */
function DashboardFallback() {
  return <div className="grid min-h-screen place-items-center text-muted">…</div>;
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
        <Route path="posts/:slug/" element={<BlogPostPage />} />
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
        <Route index element={<Navigate to="posts/" replace />} />
        <Route path="posts/" element={<PostsPage />} />
        <Route path="posts/new/" element={<PostEditPage />} />
        <Route path="posts/:id/" element={<PostEditPage />} />
        <Route path="inbox/" element={<InboxPage />} />
        <Route path="inbox/compose/" element={<ComposePage />} />
        <Route path="inbox/:id/" element={<ThreadPage />} />
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
