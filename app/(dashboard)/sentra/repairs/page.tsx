import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getOrCreateCar, getRepairLogs } from "@/lib/carQueries";
import { RepairTable } from "@/components/car/RepairTable";

export default async function RepairsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const car = await getOrCreateCar(user.id);
  const repairLogs = await getRepairLogs(car.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sentra" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="size-4" />
          My Sentra
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Repairs</h1>
        <p className="text-sm text-slate-500">Parts, labor, and total repair cost.</p>
      </div>

      <RepairTable repairLogs={repairLogs} carId={car.id} />
    </div>
  );
}
