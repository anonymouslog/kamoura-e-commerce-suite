import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "kamoura-theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function setThemeCookie(theme: "light" | "dark") {
  try {
    if (typeof document === "undefined") return;
    var cookie =
      "kamoura-theme=" +
      encodeURIComponent(theme) +
      "; Path=/; Max-Age=" +
      COOKIE_MAX_AGE +
      "; SameSite=Lax";
    document.cookie = cookie;
  } catch (e) {}
}

function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
    const resolved =
      stored ?? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(resolved);
    applyTheme(resolved);
    try {
      setThemeCookie(resolved);
    } catch (e) {}
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        window.localStorage.setItem(STORAGE_KEY, next);
        setThemeCookie(next);
        applyTheme(next);
      }}
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs uppercase tracking-[0.14em] text-grey transition-colors hover:border-gold hover:text-ivory"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
      <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
