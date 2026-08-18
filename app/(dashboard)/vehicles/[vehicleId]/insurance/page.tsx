import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getVehicleById, getInsurancePolicies } from "@/lib/vehicleQueries";
import { InsuranceCard } from "@/components/vehicles/InsuranceCard";

export default async function InsurancePage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { vehicleId } = await params;
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle || vehicle.userId !== user.id) notFound();

  const policies = await getInsurancePolicies(vehicle.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/vehicles/${vehicle.id}`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ChevronLeft className="size-4" />
          {vehicle.nickname}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-white">Insurance</h1>
        <p className="text-sm text-slate-400">Active policy and renewal history.</p>
      </div>

      <InsuranceCard policies={policies} vehicleId={vehicle.id} />
    </div>
  );
}
