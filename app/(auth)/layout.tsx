import type { ReactNode } from "react";
import { PageBackground } from "@/components/backgrounds/PageBackground";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[55%] flex-col items-center justify-center overflow-hidden bg-[#1e1b4b] px-12 lg:flex">
        <PageBackground variant="auth" />
        <div className="relative z-10 text-center">
          <h1 className="font-display text-4xl font-semibold text-white">DJ Ledger</h1>
          <p className="mt-3 text-lg text-indigo-200">Your money. Your car. Your life.</p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-surface-card px-4 lg:w-[45%]">
        <div className="mb-8 text-center lg:hidden">
          <span className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            DJ Ledger
          </span>
          <p className="mt-1 text-sm text-text-muted">Your money. Your car. Your life.</p>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
