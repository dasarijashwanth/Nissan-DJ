"use client";

import type { ReactNode } from "react";

// A template.tsx remounts on every navigation (unlike layout.tsx, which persists), so this fade
// re-triggers per page change. Opacity-only — no translateY — so it doesn't fight with each
// Card's own slide-up-fade entrance animation underneath it.
export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-page-fade">{children}</div>;
}
