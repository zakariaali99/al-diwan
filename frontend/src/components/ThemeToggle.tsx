import { useT } from "@/lib/hooks";
import { useTheme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./Icons";

/** Light/dark switch. Shows the theme you'd get by clicking, not the current one. */
export default function ThemeToggle({
  onDark = false,
  className = "",
}: {
  onDark?: boolean;
  className?: string;
}) {
  const t = useT();
  const { resolved, toggle } = useTheme();
  const goingDark = resolved === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={goingDark ? t("switchToDark") : t("switchToLight")}
      title={goingDark ? t("switchToDark") : t("switchToLight")}
      className={`grid h-11 w-11 place-items-center rounded-full border transition-colors ${
        onDark
          ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
          : "border-line bg-surface text-body hover:border-brand-600 hover:text-brand-600"
      } ${className}`}
    >
      {goingDark ? <MoonIcon className="h-[18px] w-[18px]" /> : <SunIcon className="h-[18px] w-[18px]" />}
    </button>
  );
}
