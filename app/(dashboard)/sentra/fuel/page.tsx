import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getOrCreateCar, getFuelLogs } from "@/lib/carQueries";
import { FuelLogTable } from "@/components/car/FuelLogTable";

export default async function FuelPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const car = await getOrCreateCar(user.id);
  const fuelLogs = await getFuelLogs(car.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sentra" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="size-4" />
          My Sentra
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Fuel Log</h1>
        <p className="text-sm text-slate-500">Every fill-up, MPG trend, and fuel spend.</p>
      </div>

      <FuelLogTable fuelLogs={fuelLogs} carId={car.id} />
    </div>
  );
}
