import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import logo from "@/assets/logo.png";
import { ApiError, api } from "@/lib/api";
import { useCurrentUser, useLinkTo, useT } from "@/lib/hooks";
import { EyeIcon, EyeOffIcon } from "./icons";
import { useDT } from "./strings";

interface LoginValues {
  username: string;
  password: string;
}

export default function LoginPage() {
  const t = useT();
  const dt = useDT();
  const linkTo = useLinkTo();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginValues>();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-muted">{t("loading")}</div>;
  }

  if (user?.isAuthenticated) {
    return <Navigate to={linkTo("dashboard/")} replace />;
  }

  const onSubmit = async (values: LoginValues) => {
    setError(null);
    try {
      await api.login(values.username, values.password);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || linkTo("dashboard/"), { replace: true });
    } catch (failure) {
      setError(failure instanceof ApiError && failure.status === 429 ? dt("tooManyAttempts") : t("loginFailed"));
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-brand-950 bg-[radial-gradient(120%_80%_at_50%_0%,#0B4577_0%,#051F35_60%)] p-5">
      <main className="w-full max-w-sm rounded-3xl bg-surface p-7 shadow-2xl sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <img src={logo} alt="" className="h-12 w-12" />
          <div>
            <strong className="block text-body">{t("companyName")}</strong>
            <span className="text-sm text-muted">{t("staffDashboard")}</span>
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            {error}
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
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-body">
              {t("password")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password", { required: true })}
                className="field-input pe-12"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 end-0 grid w-12 place-items-center rounded-e-lg text-muted transition-colors hover:text-brand-600"
                aria-label={showPassword ? dt("hidePassword") : dt("showPassword")}
                aria-pressed={showPassword}
                aria-controls="password"
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
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
