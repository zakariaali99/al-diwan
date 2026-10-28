import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { api } from "@/lib/api";
import { useLinkTo, useT } from "@/lib/hooks";
import { useDT } from "./strings";
import { Field, Notice, PageHeader, Panel, RequireCap, primaryBtn, smallBtn } from "./ui";

interface ComposeValues {
  to_name: string;
  to_email: string;
  subject: string;
  body: string;
}

function Compose() {
  const t = useT();
  const dt = useDT();
  const linkTo = useLinkTo();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<ComposeValues>();

  const send = useMutation({
    mutationFn: (values: ComposeValues) => api.dashboard.compose(values),
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-threads"] });
      navigate(linkTo(`dashboard/inbox/${thread.id}/`));
    },
  });

  return (
    <>
      <PageHeader
        title={dt("newMessage")}
        actions={
          <Link to={linkTo("dashboard/inbox/")} className={smallBtn}>
            {dt("back")}
          </Link>
        }
      />
      <Panel>
        <form onSubmit={handleSubmit((values) => send.mutate(values))} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={dt("recipientName")} htmlFor="to_name">
              <input id="to_name" {...register("to_name")} className="field-input" />
            </Field>
            <Field label={`${dt("recipientEmail")} *`} htmlFor="to_email" error={errors.to_email && t("required")}>
              <input
                id="to_email"
                type="email"
                dir="ltr"
                {...register("to_email", { required: true })}
                className="field-input"
                aria-invalid={Boolean(errors.to_email)}
              />
            </Field>
          </div>
          <Field label={`${dt("subject")} *`} htmlFor="subject" error={errors.subject && t("required")}>
            <input id="subject" {...register("subject", { required: true })} className="field-input" />
          </Field>
          <Field label={`${dt("messageBody")} *`} htmlFor="body" error={errors.body && t("required")}>
            <textarea id="body" rows={9} {...register("body", { required: true })} className="field-input resize-y" />
          </Field>
          {send.isError && <Notice tone="error">{dt("sendFailed")}</Notice>}
          <button type="submit" disabled={send.isPending} className={`${primaryBtn} self-start`}>
            {send.isPending ? dt("sending") : dt("send")}
          </button>
        </form>
      </Panel>
    </>
  );
}

export default function ComposePage() {
  return (
    <RequireCap capability="reply_messages">
      <Compose />
    </RequireCap>
  );
}
