import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getVehicleById, getMaintenanceLogs, getCurrentOdometer } from "@/lib/vehicleQueries";
import { MaintenanceTable } from "@/components/vehicles/MaintenanceTable";

export default async function MaintenancePage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { vehicleId } = await params;
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle || vehicle.userId !== user.id) notFound();

  const [maintenanceLogs, currentOdometer] = await Promise.all([
    getMaintenanceLogs(vehicle.id),
    getCurrentOdometer(vehicle.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/vehicles/${vehicle.id}`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ChevronLeft className="size-4" />
          {vehicle.nickname}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-white">Maintenance</h1>
        <p className="text-sm text-slate-400">Service history and upcoming due items.</p>
      </div>

      <MaintenanceTable maintenanceLogs={maintenanceLogs} vehicleId={vehicle.id} currentOdometer={currentOdometer} />
    </div>
  );
}
