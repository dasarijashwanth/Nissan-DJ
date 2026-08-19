import { redirect, notFound } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import {
  getVehicleById,
  getFuelLogs,
  getMaintenanceLogs,
  getRepairLogs,
  getInsurancePolicies,
  getStartOdometer,
} from "@/lib/vehicleQueries";
import { getDailyOdometerStats } from "@/lib/dailyOdometerQueries";
import { buildVehicle3DStats } from "@/lib/vehicleAnalytics";
import { buildCarParts } from "@/lib/vehicle3dParts";
import { Vehicle360ViewerClient } from "@/components/3d/Vehicle360ViewerClient";

// Deliberately outside the (dashboard) route group/layout — this is a full-bleed, full-viewport
// immersive page with no sidebar or page chrome, not a normal dashboard content area.
export default async function Vehicle360Page({ params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { vehicleId } = await params;
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle || vehicle.userId !== user.id) notFound();

  const [fuelLogs, maintenanceLogs, repairLogs, insurancePolicies, startOdometer, dailyStats] = await Promise.all([
    getFuelLogs(vehicle.id),
    getMaintenanceLogs(vehicle.id),
    getRepairLogs(vehicle.id),
    getInsurancePolicies(vehicle.id),
    getStartOdometer(vehicle.id),
    getDailyOdometerStats(vehicle.id, new Date()),
  ]);

  const stats = buildVehicle3DStats(
    fuelLogs,
    maintenanceLogs,
    repairLogs,
    insurancePolicies,
    startOdometer,
    dailyStats,
    new Date()
  );
  const parts = buildCarParts(vehicle, maintenanceLogs, fuelLogs, stats);

  return (
    <Vehicle360ViewerClient
      vehicleId={vehicle.id}
      vehicleLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      parts={parts}
    />
  );
}
