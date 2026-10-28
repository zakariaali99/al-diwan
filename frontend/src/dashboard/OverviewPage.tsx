import { useQuery } from "@tanstack/react-query";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";

import { api } from "@/lib/api";
import { useCurrentUser, useLinkTo } from "@/lib/hooks";
import { CommentsIcon, InboxIcon, PlusIcon, PostsIcon, ServicesIcon, TeamIcon } from "./icons";
import { useDT, type DashboardKey } from "./strings";
import { LoadError, Loading, PageHeader, primaryBtn, smallBtn, useCan } from "./ui";

interface Stat {
  label: DashboardKey;
  value: number;
  to: string;
  highlight?: boolean;
}

function StatGroup({
  title,
  icon: Icon,
  stats,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  stats: Stat[];
}) {
  const dt = useDT();
  const linkTo = useLinkTo();
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-body">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-tint text-brand-600 dark:text-brand-300">
          <Icon className="h-4.5 w-4.5" />
        </span>
        {title}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={linkTo(stat.to)}
            className="rounded-xl bg-subtle p-3 transition-colors hover:bg-brand-tint"
          >
            <span
              className={`block text-2xl font-bold tabular-nums ${
                stat.highlight && stat.value > 0 ? "text-amber-600 dark:text-amber-400" : "text-body"
              }`}
            >
              {stat.value}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-muted">{dt(stat.label)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function OverviewPage() {
  const dt = useDT();
  const can = useCan();
  const linkTo = useLinkTo();
  const { data: user } = useCurrentUser();
  const overview = useQuery({ queryKey: ["dashboard-overview"], queryFn: api.dashboard.overview });

  const name = user?.first_name || user?.username || "";
  const data = overview.data;

  return (
    <>
      <PageHeader
        title={dt("welcome", { name })}
        lede={dt("overviewLede")}
        actions={
          <>
            {can("manage_posts") && (
              <Link to={linkTo("dashboard/posts/new/")} className={primaryBtn}>
                <PlusIcon className="h-4 w-4" />
                {dt("newPost")}
              </Link>
            )}
            {can("reply_messages") && (
              <Link to={linkTo("dashboard/inbox/compose/")} className={smallBtn}>
                {dt("newMessage")}
              </Link>
            )}
            {can("manage_staff") && (
              <Link to={linkTo("dashboard/staff/new/")} className={smallBtn}>
                {dt("addStaff")}
              </Link>
            )}
          </>
        }
      />

      {overview.isLoading ? (
        <Loading />
      ) : overview.isError || !data ? (
        <LoadError />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {data.messages && (
            <StatGroup
              title={dt("inbox")}
              icon={InboxIcon}
              stats={[
                { label: "unreadMessages", value: data.messages.unread, to: "dashboard/inbox/", highlight: true },
                { label: "openThreads", value: data.messages.open, to: "dashboard/inbox/?status=open" },
                { label: "mineThreads", value: data.messages.mine, to: "dashboard/inbox/?mine=1" },
              ]}
            />
          )}
          {data.posts && (
            <StatGroup
              title={dt("posts")}
              icon={PostsIcon}
              stats={[
                { label: "publishedPosts", value: data.posts.published, to: "dashboard/posts/?status=published" },
                { label: "draftPosts", value: data.posts.drafts, to: "dashboard/posts/?status=draft" },
                { label: "scheduledPosts", value: data.posts.scheduled, to: "dashboard/posts/?status=scheduled" },
              ]}
            />
          )}
          {data.comments && (
            <StatGroup
              title={dt("comments")}
              icon={CommentsIcon}
              stats={[
                { label: "commentsThisWeek", value: data.comments.this_week, to: "dashboard/comments/", highlight: true },
                { label: "comments", value: data.comments.total, to: "dashboard/comments/" },
                { label: "hiddenComments", value: data.comments.hidden, to: "dashboard/comments/?visible=0" },
              ]}
            />
          )}
          {data.services && (
            <StatGroup
              title={dt("services")}
              icon={ServicesIcon}
              stats={[
                { label: "serviceCategoriesCount", value: data.services.categories, to: "dashboard/services/" },
                { label: "serviceItemsCount", value: data.services.items, to: "dashboard/services/" },
              ]}
            />
          )}
          {data.staff && (
            <StatGroup
              title={dt("staff")}
              icon={TeamIcon}
              stats={[{ label: "activeStaff", value: data.staff.active, to: "dashboard/staff/" }]}
            />
          )}
        </div>
      )}
    </>
  );
}
