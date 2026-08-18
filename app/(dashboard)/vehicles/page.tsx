import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import {
  getVehiclesForUser,
  getFuelLogs,
  getMaintenanceLogs,
  getRepairLogs,
  getInsurancePolicies,
  getCurrentOdometer,
} from "@/lib/vehicleQueries";
import { calcTotalVehicleSpend } from "@/lib/vehicleUtils";
import { VehicleCard } from "@/components/vehicles/VehicleCard";

export default async function VehiclesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const vehicles = await getVehiclesForUser(user.id);

  const cards = await Promise.all(
    vehicles.map(async (vehicle) => {
      const [fuelLogs, maintenanceLogs, repairLogs, insurancePolicies, currentOdometer] = await Promise.all([
        getFuelLogs(vehicle.id),
        getMaintenanceLogs(vehicle.id),
        getRepairLogs(vehicle.id),
        getInsurancePolicies(vehicle.id),
        getCurrentOdometer(vehicle.id),
      ]);

      return {
        vehicle,
        currentOdometer,
        totalSpend: calcTotalVehicleSpend(fuelLogs, maintenanceLogs, repairLogs, insurancePolicies),
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">My Vehicles</h1>
        <p className="text-sm text-slate-400">Track and compare every vehicle you own.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ vehicle, currentOdometer, totalSpend }, i) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            currentOdometer={currentOdometer}
            totalSpend={totalSpend}
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}

        <Link
          href="/vehicles/new"
          className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 transition-colors hover:border-amber-500 hover:text-amber-500"
        >
          <Plus className="size-6" />
          <span className="text-sm font-medium">Add another vehicle</span>
        </Link>
      </div>
    </div>
  );
}
