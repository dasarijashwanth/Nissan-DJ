import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Fuel, Wrench, Hammer, AlertTriangle, Inbox, ChevronRight } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import {
  getVehicleById,
  getFuelLogs,
  getMaintenanceLogs,
  getRepairLogs,
  getOdometerLogs,
  getInsurancePolicies,
  getCurrentOdometer,
  getStartOdometer,
  getRecentActivity,
} from "@/lib/vehicleQueries";
import {
  calcAvgMPG,
  calcCostPerMile,
  calcTotalVehicleSpend,
  calcMonthVehicleCost,
  isMaintenanceDueSoon,
  isInsuranceRenewalSoon,
  daysUntil,
} from "@/lib/vehicleUtils";
import { formatCurrency, formatDate, formatMiles, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { VehicleHeroCard } from "@/components/vehicles/VehicleHeroCard";
import { CarStatsRow } from "@/components/vehicles/CarStatsRow";
import { QuickLogButtons } from "@/components/vehicles/QuickLogButtons";
import { OdometerChart } from "@/components/vehicles/OdometerChart";
import { DailyOdometerWidget } from "@/components/vehicles/DailyOdometerWidget";
import { EveningOdometerReminder } from "@/components/vehicles/EveningOdometerReminder";

const ACTIVITY_ICON = { fuel: Fuel, maintenance: Wrench, repair: Hammer } as const;

export default async function VehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { vehicleId } = await params;
  const { welcome } = await searchParams;
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle || vehicle.userId !== user.id) notFound();

  const [fuelLogs, maintenanceLogs, repairLogs, odometerLogs, insurancePolicies, currentOdometer, startOdometer, activity] =
    await Promise.all([
      getFuelLogs(vehicle.id),
      getMaintenanceLogs(vehicle.id),
      getRepairLogs(vehicle.id),
      getOdometerLogs(vehicle.id),
      getInsurancePolicies(vehicle.id),
      getCurrentOdometer(vehicle.id),
      getStartOdometer(vehicle.id),
      getRecentActivity(vehicle.id, 8),
    ]);

  const totalSpend = calcTotalVehicleSpend(fuelLogs, maintenanceLogs, repairLogs, insurancePolicies);
  const costPerMile = calcCostPerMile(totalSpend, startOdometer, currentOdometer);
  const avgMPG = calcAvgMPG(fuelLogs);
  const monthCost = calcMonthVehicleCost(fuelLogs, maintenanceLogs, repairLogs, insurancePolicies, new Date());

  const dueMaintenance = maintenanceLogs.filter((l) => isMaintenanceDueSoon(l, currentOdometer));
  const dueInsurance = insurancePolicies.filter((p) => isInsuranceRenewalSoon(p));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{vehicle.nickname}</h1>
        <p className="text-sm text-slate-400">Everything about your car, in one place.</p>
      </div>

      <EveningOdometerReminder vehicleId={vehicle.id} />

      {welcome && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            🎉 <span className="font-medium">{vehicle.nickname}</span> added! Start by logging today&apos;s odometer.
          </p>
        </Card>
      )}

      <VehicleHeroCard vehicle={vehicle} currentOdometer={currentOdometer} />

      <DailyOdometerWidget vehicleId={vehicle.id} />

      <Link
        href={`/vehicles/${vehicle.id}/mileage`}
        className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
      >
        View full mileage history
        <ChevronRight className="size-3.5" />
      </Link>

      <CarStatsRow
        totalSpend={totalSpend}
        costPerMile={costPerMile}
        totalMiles={Math.max(0, currentOdometer - startOdometer)}
        avgMPG={avgMPG}
        monthCost={monthCost}
      />

      <QuickLogButtons vehicleId={vehicle.id} currentOdometer={currentOdometer} />

      {(dueMaintenance.length > 0 || dueInsurance.length > 0) && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-secondary">Upcoming Reminders</p>
          {dueMaintenance.map((l) => (
            <Card key={l.id} className="flex items-center gap-3 border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="size-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                <span className="font-medium">{l.type}</span> due{" "}
                {l.nextDueDate ? `by ${formatDate(l.nextDueDate)}` : ""}
                {l.nextDueMiles ? ` at ${formatMiles(l.nextDueMiles)}` : ""}
              </p>
            </Card>
          ))}
          {dueInsurance.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="size-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                <span className="font-medium">{p.provider}</span> insurance renews in{" "}
                {daysUntil(p.renewalDate)} days ({formatDate(p.renewalDate)})
              </p>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text-secondary">Recent Activity</p>
        {activity.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Inbox className="size-6 text-slate-300" />
            <p className="text-sm text-text-muted">No activity logged yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {activity.map((a) => {
              const Icon = ACTIVITY_ICON[a.kind];
              return (
                <li key={`${a.kind}-${a.id}`} className="flex items-center gap-3 py-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{a.title}</p>
                    <p className="text-xs text-text-muted">{formatDate(a.date)}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      "bg-red-50 text-red-700"
                    )}
                  >
                    -{formatCurrency(a.cost)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <OdometerChart odometerLogs={odometerLogs} />
    </div>
  );
}
