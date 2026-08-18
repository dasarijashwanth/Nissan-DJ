import type { ReactNode } from "react";
import { PageBackground } from "@/components/backgrounds/PageBackground";

export default function SentraLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageBackground variant="car" />
      {children}
    </>
  );
}
