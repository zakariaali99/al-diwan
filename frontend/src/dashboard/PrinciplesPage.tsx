import { api, type DashboardPrinciple } from "@/lib/api";
import InlineList from "./InlineList";
import { useDT } from "./strings";
import { PageHeader, RequireCap } from "./ui";

function Principles() {
  const dt = useDT();
  const principles = api.dashboard.principles;
  return (
    <>
      <PageHeader title={dt("principles")} />
      <InlineList<DashboardPrinciple>
        queryKey="dashboard-principles"
        fields={[
          { key: "order", label: dt("order"), type: "number" },
          { key: "text", label: dt("principleText"), translated: true, wide: true },
        ]}
        list={(language) => principles.list({ language })}
        create={principles.create}
        update={principles.update}
        remove={principles.remove}
        canEdit
        addLabel={dt("newPrinciple")}
      />
    </>
  );
}

export default function PrinciplesPage() {
  return (
    <RequireCap capability="manage_content">
      <Principles />
    </RequireCap>
  );
}
