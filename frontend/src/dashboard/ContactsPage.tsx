import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type DashboardContact } from "@/lib/api";
import { useLang } from "@/lib/hooks";
import { useDT } from "./strings";
import { DeleteButton, Empty, LoadError, Loading, PageHeader, RequireCap, Table, formatDate, smallBtn, td, th, useCan } from "./ui";

function ContactRow({ contact, canEdit, onChanged }: { contact: DashboardContact; canEdit: boolean; onChanged: () => void }) {
  const dt = useDT();
  const lang = useLang();
  const [name, setName] = useState(contact.name);
  const [phone, setPhone] = useState(contact.phone);
  const dirty = name !== contact.name || phone !== contact.phone;

  const save = useMutation({ mutationFn: () => api.dashboard.contacts.update(contact.id, { name, phone }), onSuccess: onChanged });
  const remove = useMutation({ mutationFn: () => api.dashboard.contacts.remove(contact.id), onSuccess: onChanged });

  return (
    <tr>
      <td className={td}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={!canEdit}
          aria-label={dt("name")}
          className="field-input min-w-[10rem] py-1.5"
        />
      </td>
      <td className={td}>
        <a href={`mailto:${contact.email}`} dir="ltr" className="text-brand-600 hover:underline dark:text-brand-300">
          {contact.email}
        </a>
      </td>
      <td className={td}>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={!canEdit}
          aria-label={dt("phone")}
          dir="ltr"
          className="field-input min-w-[9rem] py-1.5"
        />
      </td>
      <td className={`${td} text-center text-muted`}>{contact.thread_count}</td>
      <td className={`${td} whitespace-nowrap text-muted`}>{formatDate(contact.created_at, lang)}</td>
      <td className={`${td} whitespace-nowrap text-end`}>
        {canEdit && (
          <>
            <button type="button" className={smallBtn} disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? dt("saving") : dt("save")}
            </button>
            <DeleteButton
              confirmText={`${dt("confirmDelete")}\n${dt("contactDeleteNote")}`}
              pending={remove.isPending}
              onConfirm={() => remove.mutate()}
            />
          </>
        )}
      </td>
    </tr>
  );
}

function Contacts() {
  const dt = useDT();
  const can = useCan();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const contacts = useQuery({
    queryKey: ["dashboard-contacts", search],
    queryFn: () => api.dashboard.contacts.list({ q: search }),
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-contacts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-threads"] });
  };

  return (
    <>
      <PageHeader
        title={dt("contacts")}
        actions={
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={dt("search")}
            aria-label={dt("search")}
            className="field-input max-w-xs py-2"
          />
        }
      />
      {contacts.isLoading ? (
        <Loading />
      ) : contacts.isError ? (
        <LoadError />
      ) : (contacts.data?.length ?? 0) === 0 ? (
        <Empty />
      ) : (
        <Table
          head={
            <>
              <th className={th}>{dt("name")}</th>
              <th className={th}>{dt("email")}</th>
              <th className={th}>{dt("phone")}</th>
              <th className={th}>{dt("conversations")}</th>
              <th className={th}>{dt("created")}</th>
              <th className={th} />
            </>
          }
        >
          {contacts.data?.map((contact) => (
            <ContactRow key={`${contact.id}-${contact.name}-${contact.phone}`} contact={contact} canEdit={can("reply_messages")} onChanged={refresh} />
          ))}
        </Table>
      )}
    </>
  );
}

export default function ContactsPage() {
  return (
    <RequireCap capability="view_messages">
      <Contacts />
    </RequireCap>
  );
}
