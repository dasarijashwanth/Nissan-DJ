import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getVehicleById, getRepairLogs } from "@/lib/vehicleQueries";
import { RepairTable } from "@/components/vehicles/RepairTable";

export default async function RepairsPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { vehicleId } = await params;
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle || vehicle.userId !== user.id) notFound();

  const repairLogs = await getRepairLogs(vehicle.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/vehicles/${vehicle.id}`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ChevronLeft className="size-4" />
          {vehicle.nickname}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-white">Repairs</h1>
        <p className="text-sm text-slate-400">Parts, labor, and total repair cost.</p>
      </div>

      <RepairTable repairLogs={repairLogs} vehicleId={vehicle.id} />
    </div>
  );
}
