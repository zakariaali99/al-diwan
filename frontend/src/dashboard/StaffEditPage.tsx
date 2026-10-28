import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api, type Capability, type RolesInfo, type StaffMember } from "@/lib/api";
import { useCurrentUser, useLinkTo } from "@/lib/hooks";
import { EyeIcon, EyeOffIcon } from "./icons";
import { roleKey } from "./StaffPage";
import { useDT, type DashboardKey } from "./strings";
import {
  Field,
  LoadError,
  Loading,
  Notice,
  PageHeader,
  Panel,
  RequireCap,
  Toggle,
  fieldErrors,
  primaryBtn,
  smallBtn,
  useFlash,
} from "./ui";

const GROUPS: { title: DashboardKey; capabilities: Capability[] }[] = [
  { title: "sectionBlog", capabilities: ["view_posts", "manage_posts", "publish_posts", "delete_posts", "view_comments", "moderate_comments"] },
  { title: "sectionInbox", capabilities: ["view_messages", "reply_messages"] },
  { title: "sectionSite", capabilities: ["manage_services", "manage_content"] },
  { title: "sectionTeam", capabilities: ["manage_staff"] },
];

interface Account {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  is_active: boolean;
}

const EMPTY: Account = { username: "", first_name: "", last_name: "", email: "", password: "", is_active: true };

/** Adds everything the chosen capabilities depend on. */
function withImplied(selected: Set<Capability>, info: RolesInfo) {
  const result = new Set(selected);
  const pending = [...result];
  while (pending.length) {
    for (const needed of info.implies[pending.pop()!] ?? []) {
      if (!result.has(needed)) {
        result.add(needed);
        pending.push(needed);
      }
    }
  }
  return result;
}

/** Removes a capability and everything that can't work without it. */
function without(selected: Set<Capability>, removed: Capability, info: RolesInfo) {
  const result = new Set(selected);
  result.delete(removed);
  let changed = true;
  while (changed) {
    changed = false;
    for (const capability of [...result]) {
      if ((info.implies[capability] ?? []).some((needed) => !result.has(needed))) {
        result.delete(capability);
        changed = true;
      }
    }
  }
  return result;
}

function roleOf(selected: Set<Capability>, info: RolesInfo) {
  for (const [role, preset] of Object.entries(info.roles)) {
    if (preset.length === selected.size && preset.every((capability) => selected.has(capability))) return role;
  }
  return "custom";
}

function StaffEditor({ member, info }: { member: StaffMember | null; info: RolesInfo }) {
  const dt = useDT();
  const linkTo = useLinkTo();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const [flash, setFlash] = useFlash();
  const [showPassword, setShowPassword] = useState(false);
  const [account, setAccount] = useState<Account>(EMPTY);
  const [selected, setSelected] = useState<Set<Capability>>(new Set(info.roles.editor ?? []));

  useEffect(() => {
    if (!member) return;
    setAccount({ ...member, password: "" });
    setSelected(new Set(member.capabilities));
  }, [member]);

  const isNew = member === null;
  const isMe = member?.id === me?.id;
  const isOwner = Boolean(member?.is_superuser);
  const role = roleOf(selected, info);

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = { ...account, capabilities: [...selected], role };
      if (!account.password) delete payload.password;
      if (isOwner) delete payload.capabilities;
      return isNew ? api.dashboard.staff.create(payload) : api.dashboard.staff.update(member.id, payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-staff"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setFlash(dt("saved"));
      if (isNew) navigate(linkTo(`dashboard/staff/${saved.id}/`), { replace: true });
      else setAccount((previous) => ({ ...previous, password: "" }));
    },
  });
  const errors = fieldErrors(save.error);
  const set = <K extends keyof Account>(key: K, value: Account[K]) => setAccount((previous) => ({ ...previous, [key]: value }));

  const toggle = (capability: Capability, on: boolean) =>
    setSelected((current) => (on ? withImplied(new Set([...current, capability]), info) : without(current, capability, info)));

  return (
    <>
      <PageHeader
        title={isNew ? dt("addStaff") : dt("editStaff")}
        actions={
          <Link to={linkTo("dashboard/staff/")} className={smallBtn}>
            {dt("back")}
          </Link>
        }
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
      >
        <Panel title={dt("account")} className="h-fit">
          <div className="flex flex-col gap-4">
            <Field label={dt("username")} htmlFor="username" error={errors.username}>
              <input
                id="username"
                value={account.username}
                onChange={(event) => set("username", event.target.value)}
                required
                autoCapitalize="none"
                spellCheck={false}
                dir="ltr"
                className="field-input"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={dt("firstName")} htmlFor="first_name" error={errors.first_name}>
                <input id="first_name" value={account.first_name} onChange={(event) => set("first_name", event.target.value)} className="field-input" />
              </Field>
              <Field label={dt("lastName")} htmlFor="last_name" error={errors.last_name}>
                <input id="last_name" value={account.last_name} onChange={(event) => set("last_name", event.target.value)} className="field-input" />
              </Field>
            </div>
            <Field label={dt("email")} htmlFor="email" error={errors.email}>
              <input id="email" type="email" value={account.email} onChange={(event) => set("email", event.target.value)} dir="ltr" className="field-input" />
            </Field>
            <Field
              label={dt("password")}
              htmlFor="new-password"
              hint={isNew ? dt("passwordHint") : `${dt("newPasswordHint")} ${dt("passwordHint")}`}
              error={errors.password}
            >
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={account.password}
                  onChange={(event) => set("password", event.target.value)}
                  required={isNew}
                  autoComplete="new-password"
                  dir="ltr"
                  className="field-input pe-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 end-0 grid w-12 place-items-center text-muted hover:text-brand-600"
                  aria-label={showPassword ? dt("hidePassword") : dt("showPassword")}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </Field>
            <div>
              <Toggle
                id="is_active"
                checked={account.is_active}
                onChange={(value) => set("is_active", value)}
                label={dt("accountActive")}
                disabled={isMe}
              />
              <p className="mt-1.5 text-xs text-muted">{dt("accountActiveHint")}</p>
            </div>
          </div>
        </Panel>

        <Panel title={dt("permissions")}>
          {isOwner ? (
            <Notice>{dt("superuserNote")}</Notice>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">{dt("permissionsHint")}</p>
              <div className="mb-6 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={dt("role")}>
                {[...Object.keys(info.roles), "custom"].map((name) => {
                  const active = role === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={name === "custom"}
                      onClick={() => name !== "custom" && setSelected(new Set(info.roles[name]))}
                      className={`rounded-xl border p-3 text-start transition-colors ${
                        active ? "border-brand-600 bg-brand-tint ring-1 ring-brand-600" : "border-line hover:border-brand-400"
                      } ${name === "custom" && !active ? "opacity-50" : ""}`}
                    >
                      <span className="block text-sm font-bold text-body">{dt(roleKey(name))}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">{dt(`roleDesc_${name}` as DashboardKey)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-5">
                {GROUPS.map((group) => (
                  <fieldset key={group.title}>
                    <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{dt(group.title)}</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.capabilities.map((capability) => {
                        const locked = isMe && capability === "manage_staff";
                        return (
                          <label
                            key={capability}
                            className={`flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-sm ${
                              locked ? "opacity-60" : "cursor-pointer hover:border-brand-400"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(capability)}
                              disabled={locked}
                              onChange={(event) => toggle(capability, event.target.checked)}
                              className="h-4 w-4 accent-brand-600"
                            />
                            <span className="text-body">{dt(`cap_${capability}` as DashboardKey)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            </>
          )}
        </Panel>

        <div className="flex flex-col gap-3 lg:col-span-2">
          {flash && <Notice tone="success">{flash}</Notice>}
          {save.isError && <Notice tone="error">{errors.detail || dt("saveFailed")}</Notice>}
          <button type="submit" disabled={save.isPending} className={`${primaryBtn} self-start`}>
            {save.isPending ? dt("saving") : dt("save")}
          </button>
        </div>
      </form>
    </>
  );
}

function StaffEdit() {
  const { id } = useParams<{ id: string }>();
  const memberId = id ? Number(id) : null;
  const roles = useQuery({ queryKey: ["dashboard-roles"], queryFn: api.dashboard.roles, staleTime: Infinity });
  const member = useQuery({
    queryKey: ["dashboard-staff", memberId],
    queryFn: () => api.dashboard.staff.get(memberId!),
    enabled: memberId !== null,
  });

  if (roles.isLoading || (memberId !== null && member.isLoading)) return <Loading />;
  if (roles.isError || !roles.data || (memberId !== null && (member.isError || !member.data))) return <LoadError />;
  return <StaffEditor member={memberId === null ? null : member.data!} info={roles.data} />;
}

export default function StaffEditPage() {
  return (
    <RequireCap capability="manage_staff">
      <StaffEdit />
    </RequireCap>
  );
}
