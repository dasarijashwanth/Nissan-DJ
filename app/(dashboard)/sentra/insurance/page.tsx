import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getOrCreateCar, getInsurancePolicies } from "@/lib/carQueries";
import { InsuranceCard } from "@/components/car/InsuranceCard";

export default async function InsurancePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const car = await getOrCreateCar(user.id);
  const policies = await getInsurancePolicies(car.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sentra" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="size-4" />
          My Sentra
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Insurance</h1>
        <p className="text-sm text-slate-500">Active policy and renewal history.</p>
      </div>

      <InsuranceCard policies={policies} carId={car.id} />
    </div>
  );
}
