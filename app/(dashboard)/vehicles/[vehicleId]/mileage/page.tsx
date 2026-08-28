import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getVehicleById } from "@/lib/vehicleQueries";
import { getDailyOdometerEntries } from "@/lib/dailyOdometerQueries";
import { OdometerHistoryChart } from "@/components/vehicles/OdometerHistoryChart";
import { DailyOdometerWidget } from "@/components/vehicles/DailyOdometerWidget";

export default async function MileagePage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { vehicleId } = await params;
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle || vehicle.userId !== user.id) notFound();

  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 89);
  const entries = await getDailyOdometerEntries(vehicleId, from, to);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/vehicles/${vehicle.id}`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ChevronLeft className="size-4" />
          {vehicle.nickname}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-white">Mileage Dashboard</h1>
        <p className="text-sm text-slate-400">Log today&apos;s drive and see your last 90 days of odometer readings.</p>
      </div>

      <DailyOdometerWidget vehicleId={vehicle.id} showHistory />

      <OdometerHistoryChart entries={entries} />
    </div>
  );
}
