import type { ReactNode } from "react";
import { PageBackground } from "@/components/backgrounds/PageBackground";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageBackground variant="settings" />
      {children}
    </>
  );
}
