import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import { getOrCreateCar, getCurrentOdometer } from "@/lib/carQueries";
import { Sidebar } from "@/components/Sidebar";
import { AlertBell } from "@/components/alerts/AlertBell";
import { OfflineBanner } from "@/components/OfflineBanner";
import { InstallPrompt } from "@/components/InstallPrompt";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const car = user ? await getOrCreateCar(user.id) : null;
  const currentOdometer = car ? await getCurrentOdometer(car.id) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar userEmail={user?.email ?? ""} />
      <main className="pb-16 lg:pb-0 lg:pl-60">
        <OfflineBanner />
        <div className="flex h-14 items-center justify-end border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <AlertBell />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
      {car && <GlobalShortcuts carId={car.id} currentOdometer={currentOdometer} />}
      <InstallPrompt />
    </div>
  );
}
