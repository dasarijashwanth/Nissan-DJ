"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  // The blocking inline script in the root layout already set data-theme before hydration —
  // but reading it straight into the initial state still mismatches, because the server always
  // renders with no `document` at all, so its first pass is unconditionally "light" while the
  // client's first pass already sees the real value. Start at the same default as the server,
  // then sync from the DOM right after mount so both hydration passes agree.
  const [theme, setTheme] = useState<Theme>("light");
  const hasSynced = useRef(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      hasSynced.current = true;
      setTheme((document.documentElement.getAttribute("data-theme") as Theme | null) ?? "light");
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    // Skip the write while `theme` still holds the SSR-matching placeholder — persisting it here
    // would clobber the real stored preference before the sync effect above ever restores it.
    if (!hasSynced.current) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sentratrack-theme", theme);
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}
