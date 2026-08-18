import type { FuelLog, MaintenanceLog, RepairLog, Insurance, OdometerLog } from "@/lib/types";
import { monthRange, shortMonthLabel } from "@/lib/utils";

function monthBuckets(months: number) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i;
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  });
}

export function getMonthlyCarCosts(
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[],
  repairLogs: RepairLog[],
  insurancePolicies: Insurance[],
  months: number
) {
  return monthBuckets(months).map(({ year, month }) => {
    const { start, end } = monthRange(year, month);
    const inRange = (date: string) => {
      const d = new Date(date);
      return d >= start && d < end;
    };

    const fuel = fuelLogs.filter((l) => inRange(l.date)).reduce((sum, l) => sum + l.totalCost, 0);
    const maintenance = maintenanceLogs.filter((l) => inRange(l.date)).reduce((sum, l) => sum + l.cost, 0);
    const repair = repairLogs.filter((l) => inRange(l.date)).reduce((sum, l) => sum + l.cost, 0);
    const insurance = insurancePolicies
      .filter((p) => new Date(p.startDate) < end && new Date(p.renewalDate) >= start)
      .reduce((sum, p) => sum + p.monthlyCost, 0);

    return { month: shortMonthLabel(year, month), fuel, maintenance, repair, insurance };
  });
}

/** Approximates miles-driven-per-month from whichever log type reported the highest odometer that month. */
export function getCostPerMileTrend(
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[],
  repairLogs: RepairLog[],
  odometerLogs: OdometerLog[],
  monthlyCosts: { month: string; fuel: number; maintenance: number; repair: number; insurance: number }[],
  months: number
) {
  const allReadings = [
    ...fuelLogs.map((l) => ({ date: l.date, odometer: l.odometer })),
    ...maintenanceLogs.map((l) => ({ date: l.date, odometer: l.odometer })),
    ...repairLogs.map((l) => ({ date: l.date, odometer: l.odometer })),
    ...odometerLogs.map((l) => ({ date: l.date, odometer: l.miles })),
  ];

  function maxOdometerBefore(date: Date) {
    const readings = allReadings.filter((r) => new Date(r.date) < date).map((r) => r.odometer);
    return readings.length > 0 ? Math.max(...readings) : 0;
  }

  return monthBuckets(months).map(({ year, month }, i) => {
    const { start, end } = monthRange(year, month);
    const milesDriven = Math.max(0, maxOdometerBefore(end) - maxOdometerBefore(start));
    const cost = monthlyCosts[i];
    const total = cost.fuel + cost.maintenance + cost.repair + cost.insurance;
    return { month: shortMonthLabel(year, month), costPerMile: milesDriven > 0 ? total / milesDriven : 0 };
  });
}
