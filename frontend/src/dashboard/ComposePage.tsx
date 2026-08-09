import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { api } from "@/lib/api";
import { useLinkTo, useT } from "@/lib/hooks";

interface ComposeValues {
  to_name: string;
  to_email: string;
  subject: string;
  body: string;
}

export default function ComposePage() {
  const t = useT();
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">{t("newMessage")}</h1>
        <Link to={linkTo("dashboard/inbox/")} className="btn-ghost">{t("back")}</Link>
      </div>

      <form
        onSubmit={handleSubmit((values) => send.mutate(values))}
        className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6"
      >
        <div>
          <label htmlFor="to_name" className="mb-2 block text-sm font-semibold">{t("recipientName")}</label>
          <input id="to_name" {...register("to_name")} className="field-input" />
        </div>

        <div>
          <label htmlFor="to_email" className="mb-2 block text-sm font-semibold">
            {t("recipientEmail")} <span className="text-red-600" aria-hidden>*</span>
          </label>
          <input
            id="to_email"
            type="email"
            dir="ltr"
            {...register("to_email", { required: true })}
            className="field-input"
            aria-invalid={Boolean(errors.to_email)}
          />
          {errors.to_email && <p className="mt-1.5 text-sm text-red-600">{t("required")}</p>}
        </div>

        <div>
          <label htmlFor="subject" className="mb-2 block text-sm font-semibold">
            {t("subject")} <span className="text-red-600" aria-hidden>*</span>
          </label>
          <input
            id="subject"
            {...register("subject", { required: true })}
            className="field-input"
            aria-invalid={Boolean(errors.subject)}
          />
          {errors.subject && <p className="mt-1.5 text-sm text-red-600">{t("required")}</p>}
        </div>

        <div>
          <label htmlFor="body" className="mb-2 block text-sm font-semibold">
            {t("messageLabel")} <span className="text-red-600" aria-hidden>*</span>
          </label>
          <textarea
            id="body"
            rows={8}
            {...register("body", { required: true })}
            className="field-input resize-y"
            aria-invalid={Boolean(errors.body)}
          />
          {errors.body && <p className="mt-1.5 text-sm text-red-600">{t("required")}</p>}
        </div>

        <button type="submit" disabled={send.isPending} className="btn-primary self-start disabled:opacity-60">
          {send.isPending ? t("sending") : t("replySend")}
        </button>

        {send.isError && <p role="alert" className="text-sm text-red-600">{t("contactError")}</p>}
      </form>
    </>
  );
}
