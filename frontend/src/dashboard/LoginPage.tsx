import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import logo from "@/assets/logo.png";
import { ApiError, api } from "@/lib/api";
import { useCurrentUser, useLinkTo, useT } from "@/lib/hooks";

interface LoginValues {
  username: string;
  password: string;
}

export default function LoginPage() {
  const t = useT();
  const linkTo = useLinkTo();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();
  const [failed, setFailed] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginValues>();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-muted">{t("loading")}</div>;
  }

  if (user?.isAuthenticated) {
    return <Navigate to={linkTo("dashboard/")} replace />;
  }

  const onSubmit = async (values: LoginValues) => {
    setFailed(false);
    try {
      await api.login(values.username, values.password);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || linkTo("dashboard/"), { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setFailed(true);
      else setFailed(true);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-brand-950 p-6">
      <main className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-2xl">
        <div className="mb-8 flex items-center gap-3">
          <img src={logo} alt="" className="h-12 w-12" />
          <div>
            <strong className="block text-body">{t("companyName")}</strong>
            <span className="text-sm text-muted">{t("staffDashboard")}</span>
          </div>
        </div>

        {failed && (
          <p role="alert" className="mb-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            {t("loginFailed")}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-semibold text-body">
              {t("username")}
            </label>
            <input
              id="username"
              {...register("username", { required: true })}
              className="field-input"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-body">
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              {...register("password", { required: true })}
              className="field-input"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
            {isSubmitting ? t("signingIn") : t("signIn")}
          </button>
        </form>

        <Link to={linkTo("")} className="mt-6 block text-center text-sm text-muted hover:text-brand-600">
          {t("backToSite")}
        </Link>
      </main>
    </div>
  );
}
