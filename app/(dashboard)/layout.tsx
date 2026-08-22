import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import { getPrimaryVehicle, getCurrentOdometer } from "@/lib/vehicleQueries";
import { getUnreadCount } from "@/lib/alertQueries";
import { isUserAdmin } from "@/lib/adminQueries";
import { getTrackingMode } from "@/lib/trackingMode";
import { Sidebar } from "@/components/Sidebar";
import { AlertBell } from "@/components/alerts/AlertBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TrackingModeToggle } from "@/components/layout/TrackingModeToggle";
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

  const vehicle = user ? await getPrimaryVehicle(user.id) : null;
  const currentOdometer = vehicle ? await getCurrentOdometer(vehicle.id) : 0;
  const unreadAlertCount = user ? await getUnreadCount(user.id) : 0;
  const isAdmin = user ? await isUserAdmin(user.id) : false;
  const trackingMode = await getTrackingMode();

  return (
    <VehicleProvider>
      <div className="min-h-screen">
        <PageBackground variant="finance" />
        <Sidebar
          userEmail={user?.email ?? ""}
          unreadAlertCount={unreadAlertCount}
          isAdmin={isAdmin}
          trackingMode={trackingMode}
        />
        <main className="pb-20 lg:pb-0 lg:pl-[248px]">
          <OfflineBanner />
          <div className="flex h-14 items-center justify-end gap-2 border-b border-black/[0.06] bg-surface-card px-4 sm:px-6 lg:px-8">
            <TrackingModeToggle mode={trackingMode} />
            <ThemeToggle />
            <AlertBell />
          </div>
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
        {vehicle && (
          <GlobalShortcuts vehicleId={vehicle.id} currentOdometer={currentOdometer} trackingMode={trackingMode} />
        )}
        <InstallPrompt />
      </div>
    </VehicleProvider>
  );
}
