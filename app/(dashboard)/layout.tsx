import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import { getOrCreatePrimaryVehicle, getCurrentOdometer } from "@/lib/vehicleQueries";
import { getUnreadCount } from "@/lib/alertQueries";
import { Sidebar } from "@/components/Sidebar";
import { AlertBell } from "@/components/alerts/AlertBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { OfflineBanner } from "@/components/OfflineBanner";
import { InstallPrompt } from "@/components/InstallPrompt";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";
import { PageBackground } from "@/components/backgrounds/PageBackground";
import { VehicleProvider } from "@/contexts/VehicleContext";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const vehicle = user ? await getOrCreatePrimaryVehicle(user.id) : null;
  const currentOdometer = vehicle ? await getCurrentOdometer(vehicle.id) : 0;
  const unreadAlertCount = user ? await getUnreadCount(user.id) : 0;

  return (
    <VehicleProvider>
      <div className="min-h-screen">
        <PageBackground variant="finance" />
        <Sidebar userEmail={user?.email ?? ""} unreadAlertCount={unreadAlertCount} />
        <main className="pb-16 lg:pb-0 lg:pl-[248px]">
          <OfflineBanner />
          <div className="flex h-14 items-center justify-end gap-1 border-b border-black/[0.06] bg-surface-card px-4 sm:px-6 lg:px-8">
            <ThemeToggle />
            <AlertBell />
          </div>
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
        {vehicle && <GlobalShortcuts vehicleId={vehicle.id} currentOdometer={currentOdometer} />}
        <InstallPrompt />
      </div>
    </VehicleProvider>
  );
}
