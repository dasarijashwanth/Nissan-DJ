import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import {
  getVehicleById,
  getFuelLogs,
  getMaintenanceLogs,
  getRepairLogs,
  getOdometerLogs,
} from "@/lib/vehicleQueries";
import { getWeeklyFuelTrend } from "@/lib/vehicleAnalytics";
import { getFuelEfficiencyInsight } from "@/lib/vehicleUtils";
import { FuelLogTable } from "@/components/vehicles/FuelLogTable";
import { FuelTrendChart } from "@/components/vehicles/FuelTrendChart";
import { FuelEfficiencyInsights } from "@/components/vehicles/FuelEfficiencyInsights";

export default async function FuelPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { vehicleId } = await params;
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle || vehicle.userId !== user.id) notFound();

  const [fuelLogs, maintenanceLogs, repairLogs, odometerLogs] = await Promise.all([
    getFuelLogs(vehicle.id),
    getMaintenanceLogs(vehicle.id),
    getRepairLogs(vehicle.id),
    getOdometerLogs(vehicle.id),
  ]);

  const weeklyTrend = getWeeklyFuelTrend(fuelLogs, maintenanceLogs, repairLogs, odometerLogs, 12, new Date());
  const efficiencyInsight = getFuelEfficiencyInsight(fuelLogs);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/vehicles/${vehicle.id}`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ChevronLeft className="size-4" />
          {vehicle.nickname}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-white">Fuel Log</h1>
        <p className="text-sm text-slate-400">Every fill-up, MPG trend, and fuel spend.</p>
      </div>

      <FuelEfficiencyInsights insight={efficiencyInsight} />

      <FuelLogTable fuelLogs={fuelLogs} vehicleId={vehicle.id} />

      <FuelTrendChart data={weeklyTrend} />
    </div>
  );
}
