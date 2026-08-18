import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getOrCreateCar, getMaintenanceLogs, getCurrentOdometer } from "@/lib/carQueries";
import { MaintenanceTable } from "@/components/car/MaintenanceTable";

export default async function MaintenancePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const car = await getOrCreateCar(user.id);
  const [maintenanceLogs, currentOdometer] = await Promise.all([
    getMaintenanceLogs(car.id),
    getCurrentOdometer(car.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sentra" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="size-4" />
          My Sentra
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Maintenance</h1>
        <p className="text-sm text-slate-500">Service history and upcoming due items.</p>
      </div>

      <MaintenanceTable maintenanceLogs={maintenanceLogs} carId={car.id} currentOdometer={currentOdometer} />
    </div>
  );
}
