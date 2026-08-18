"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
