import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { api } from "@/lib/api";
import { useCurrentUser, useLang, useLinkTo } from "@/lib/hooks";
import { PlusIcon } from "./icons";
import { useDT, type DashboardKey } from "./strings";
import {
  DeleteButton,
  Empty,
  LoadError,
  Loading,
  PageHeader,
  Pill,
  RequireCap,
  Table,
  formatDate,
  primaryBtn,
  smallBtn,
  td,
  th,
} from "./ui";

export function roleKey(role: string) {
  return `role_${role || "custom"}` as DashboardKey;
}

function Staff() {
  const dt = useDT();
  const lang = useLang();
  const linkTo = useLinkTo();
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const staff = useQuery({ queryKey: ["dashboard-staff"], queryFn: () => api.dashboard.staff.list() });
  const remove = useMutation({
    mutationFn: (id: number) => api.dashboard.staff.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-staff"] }),
  });

  return (
    <>
      <PageHeader
        title={dt("staff")}
        lede={dt("permissionsHint")}
        actions={
          <Link to={linkTo("dashboard/staff/new/")} className={primaryBtn}>
            <PlusIcon className="h-4 w-4" />
            {dt("addStaff")}
          </Link>
        }
      />
      {staff.isLoading ? (
        <Loading />
      ) : staff.isError ? (
        <LoadError />
      ) : (staff.data?.length ?? 0) === 0 ? (
        <Empty />
      ) : (
        <Table
          head={
            <>
              <th className={th}>{dt("name")}</th>
              <th className={th}>{dt("role")}</th>
              <th className={th}>{dt("status")}</th>
              <th className={th}>{dt("lastLogin")}</th>
              <th className={th} />
            </>
          }
        >
          {staff.data?.map((member) => {
            const name = [member.first_name, member.last_name].filter(Boolean).join(" ");
            const isMe = member.id === me?.id;
            const editable = !member.is_superuser || me?.is_superuser;
            return (
              <tr key={member.id} className="hover:bg-subtle/60">
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint font-bold uppercase text-brand-700 dark:text-brand-200">
                      {(name || member.username).slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-body">
                        {name || member.username} {isMe && <span className="text-xs font-normal text-muted">({dt("you")})</span>}
                      </span>
                      <span className="block text-xs text-muted" dir="ltr">
                        @{member.username}
                        {member.email && ` · ${member.email}`}
                      </span>
                    </span>
                  </div>
                </td>
                <td className={td}>
                  <Pill tone={member.is_superuser ? "red" : "blue"}>
                    {member.is_superuser ? dt("superuser") : dt(roleKey(member.role))}
                  </Pill>
                </td>
                <td className={td}>
                  <Pill tone={member.is_active ? "green" : "gray"}>{member.is_active ? dt("active") : dt("inactive")}</Pill>
                </td>
                <td className={`${td} whitespace-nowrap text-muted`}>
                  {member.last_login ? formatDate(member.last_login, lang, true) : dt("never")}
                </td>
                <td className={`${td} whitespace-nowrap text-end`}>
                  {editable && (
                    <Link to={linkTo(`dashboard/staff/${member.id}/`)} className={smallBtn}>
                      {dt("edit")}
                    </Link>
                  )}
                  {editable && !isMe && (
                    <DeleteButton pending={remove.isPending && remove.variables === member.id} onConfirm={() => remove.mutate(member.id)} />
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}

export default function StaffPage() {
  return (
    <RequireCap capability="manage_staff">
      <Staff />
    </RequireCap>
  );
}
