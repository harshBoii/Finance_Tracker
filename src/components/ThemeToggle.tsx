"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  // Only rendered after sign-in (client-side), so reading the DOM here is safe.
  const [theme, setTheme] = useState(() =>
    typeof document === "undefined" ? "light" : (document.documentElement.dataset.theme ?? "light"),
  );

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  return (
    <button className={`btn bg-panel p-2 ${className ?? ""}`} onClick={toggle} aria-label="Toggle dark mode">
      {theme === "dark" ? <Sun size={16} strokeWidth={2.5} /> : <Moon size={16} strokeWidth={2.5} />}
    </button>
  );
}
