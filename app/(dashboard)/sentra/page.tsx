import { redirect } from "next/navigation";
import { Fuel, Wrench, Hammer, AlertTriangle, Inbox } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import {
  getOrCreateCar,
  getFuelLogs,
  getMaintenanceLogs,
  getRepairLogs,
  getOdometerLogs,
  getInsurancePolicies,
  getCurrentOdometer,
  getStartOdometer,
  getRecentActivity,
} from "@/lib/carQueries";
import {
  calcAvgMPG,
  calcCostPerMile,
  calcTotalCarSpend,
  calcMonthCarCost,
  isMaintenanceDueSoon,
  isInsuranceRenewalSoon,
  daysUntil,
} from "@/lib/carUtils";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SentraHeroCard } from "@/components/car/SentraHeroCard";
import { CarStatsRow } from "@/components/car/CarStatsRow";
import { QuickLogButtons } from "@/components/car/QuickLogButtons";
import { OdometerChart } from "@/components/car/OdometerChart";

const ACTIVITY_ICON = { fuel: Fuel, maintenance: Wrench, repair: Hammer } as const;

export default async function SentraPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const car = await getOrCreateCar(user.id);

  const [fuelLogs, maintenanceLogs, repairLogs, odometerLogs, insurancePolicies, currentOdometer, startOdometer, activity] =
    await Promise.all([
      getFuelLogs(car.id),
      getMaintenanceLogs(car.id),
      getRepairLogs(car.id),
      getOdometerLogs(car.id),
      getInsurancePolicies(car.id),
      getCurrentOdometer(car.id),
      getStartOdometer(car.id),
      getRecentActivity(car.id, 8),
    ]);

  const totalSpend = calcTotalCarSpend(fuelLogs, maintenanceLogs, repairLogs, insurancePolicies);
  const costPerMile = calcCostPerMile(totalSpend, startOdometer, currentOdometer);
  const avgMPG = calcAvgMPG(fuelLogs);
  const monthCost = calcMonthCarCost(fuelLogs, maintenanceLogs, repairLogs, insurancePolicies, new Date());

  const dueMaintenance = maintenanceLogs.filter((l) => isMaintenanceDueSoon(l, currentOdometer));
  const dueInsurance = insurancePolicies.filter((p) => isInsuranceRenewalSoon(p));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My Sentra</h1>
        <p className="text-sm text-slate-500">Everything about your car, in one place.</p>
      </div>

      <SentraHeroCard car={car} currentOdometer={currentOdometer} />

      <CarStatsRow
        totalSpend={totalSpend}
        costPerMile={costPerMile}
        totalMiles={Math.max(0, currentOdometer - startOdometer)}
        avgMPG={avgMPG}
        monthCost={monthCost}
      />

      <QuickLogButtons carId={car.id} currentOdometer={currentOdometer} />

      {(dueMaintenance.length > 0 || dueInsurance.length > 0) && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Upcoming Reminders</p>
          {dueMaintenance.map((l) => (
            <Card key={l.id} className="flex items-center gap-3 border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="size-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                <span className="font-medium">{l.type}</span> due{" "}
                {l.nextDueDate ? `by ${formatDate(l.nextDueDate)}` : ""}
                {l.nextDueMiles ? ` at ${l.nextDueMiles.toLocaleString()} mi` : ""}
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
        <p className="mb-4 text-sm font-medium text-slate-700">Recent Activity</p>
        {activity.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Inbox className="size-6 text-slate-300" />
            <p className="text-sm text-slate-500">No activity logged yet.</p>
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
                    <p className="truncate text-sm font-medium text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(a.date)}</p>
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
