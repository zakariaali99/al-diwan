import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "al-diwan-theme";

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStored(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* private mode — fall through to system */
  }
  return "system";
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle("dark", resolveTheme(theme) === "dark");
}

/**
 * Theme state, persisted to localStorage. The initial class is set by an
 * inline script in index.html before first paint, so this hook only has to
 * keep things in sync afterwards — it never causes a flash of the wrong theme.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof window === "undefined" ? "system" : readStored(),
  );

  useEffect(() => {
    apply(theme);
  }, [theme]);

  // Follow the OS while the preference is "system".
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* preference just won't persist */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolveTheme(theme) === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return {
    theme,
    resolved: typeof window === "undefined" ? "light" : resolveTheme(theme),
    setTheme,
    toggle,
  };
}
