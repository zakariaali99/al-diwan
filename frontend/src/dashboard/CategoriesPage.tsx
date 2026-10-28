import { api, type DashboardCategory } from "@/lib/api";
import InlineList from "./InlineList";
import { useDT } from "./strings";
import { PageHeader, RequireCap, useCan } from "./ui";

function Categories() {
  const dt = useDT();
  const can = useCan();
  const categories = api.dashboard.categories;
  return (
    <>
      <PageHeader title={dt("postCategories")} />
      <InlineList<DashboardCategory>
        queryKey="dashboard-categories"
        fields={[{ key: "name", label: dt("name"), translated: true, wide: true }]}
        list={(language) => categories.list({ language })}
        create={categories.create}
        update={categories.update}
        remove={categories.remove}
        canEdit={can("manage_posts")}
        addLabel={dt("newCategory")}
        deleteNote={dt("categoryDeleteNote")}
        extra={(row) => `${row.post_count} ${dt("postCount")}`}
      />
    </>
  );
}

export default function CategoriesPage() {
  return (
    <RequireCap capability="manage_posts">
      <Categories />
    </RequireCap>
  );
}
