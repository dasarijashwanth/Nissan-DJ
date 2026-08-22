import type { FuelLog, MaintenanceLog, RepairLog, Insurance, OdometerLog } from "@/lib/types";
import { monthRange, shortMonthLabel } from "@/lib/utils";

function maxOdometerBeforeFn(
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[],
  repairLogs: RepairLog[],
  odometerLogs: OdometerLog[]
) {
  const allReadings = [
    ...fuelLogs.map((l) => ({ date: l.date, odometer: l.odometer })),
    ...maintenanceLogs.map((l) => ({ date: l.date, odometer: l.odometer })),
    ...repairLogs.map((l) => ({ date: l.date, odometer: l.odometer })),
    ...odometerLogs.map((l) => ({ date: l.date, odometer: l.miles })),
  ];

  return (date: Date) => {
    const readings = allReadings.filter((r) => new Date(r.date) < date).map((r) => r.odometer);
    return readings.length > 0 ? Math.max(...readings) : 0;
  };
}

function monthBuckets(months: number) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i;
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  });
}

export function getMonthlyVehicleCosts(
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
  const maxOdometerBefore = maxOdometerBeforeFn(fuelLogs, maintenanceLogs, repairLogs, odometerLogs);

  return monthBuckets(months).map(({ year, month }, i) => {
    const { start, end } = monthRange(year, month);
    const milesDriven = Math.max(0, maxOdometerBefore(end) - maxOdometerBefore(start));
    const cost = monthlyCosts[i];
    const total = cost.fuel + cost.maintenance + cost.repair + cost.insurance;
    return { month: shortMonthLabel(year, month), costPerMile: milesDriven > 0 ? total / milesDriven : 0 };
  });
}

export function getWeeklyStats(
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[],
  repairLogs: RepairLog[],
  odometerLogs: OdometerLog[],
  now: Date
) {
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOfWeek));
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const maxOdometerBefore = maxOdometerBeforeFn(fuelLogs, maintenanceLogs, repairLogs, odometerLogs);
  const milesThisWeek = Math.max(0, maxOdometerBefore(weekEnd) - maxOdometerBefore(weekStart));
  const daysElapsed = dayOfWeek + 1; // days so far this week, including today
  const avgPerDay = milesThisWeek / daysElapsed;

  const fuelCostThisWeek = fuelLogs
    .filter((l) => {
      const d = new Date(l.date);
      return d >= weekStart && d < weekEnd;
    })
    .reduce((sum, l) => sum + l.totalCost, 0);

  return { milesThisWeek, avgPerDay, fuelCostThisWeek };
}

// Monday-start, to match the weekly-fuel-summary form's own week convention (getWeekRange in
// FuelLogForm.tsx) — a summary's `date` is stored as that week's Sunday, so bucket boundaries
// here must agree with the form's, or a summary row silently falls outside every bucket.
function weekBuckets(weeks: number, now: Date) {
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisWeekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday)
  );
  return Array.from({ length: weeks }, (_, i) => {
    const offset = weeks - 1 - i;
    const start = new Date(thisWeekStart.getTime() - offset * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    return { start, end };
  });
}

/** Weekly MPG (last N weeks), cost per week, and a 4-week rolling MPG average — mixes per-fill and weekly-summary FuelLog rows and reconstructs mileage the same way getWeeklyStats does. */
export function getWeeklyFuelTrend(
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[],
  repairLogs: RepairLog[],
  odometerLogs: OdometerLog[],
  weeks: number,
  now: Date
) {
  const maxOdometerBefore = maxOdometerBeforeFn(fuelLogs, maintenanceLogs, repairLogs, odometerLogs);

  const raw = weekBuckets(weeks, now).map(({ start, end }) => {
    const weekFuelLogs = fuelLogs.filter((l) => {
      const d = new Date(l.date);
      return d >= start && d < end;
    });
    const cost = weekFuelLogs.reduce((sum, l) => sum + l.totalCost, 0);
    const gallons = weekFuelLogs.reduce((sum, l) => sum + l.gallons, 0);
    const milesDriven = Math.max(0, maxOdometerBefore(end) - maxOdometerBefore(start));
    const mpg = gallons > 0 ? milesDriven / gallons : 0;
    return {
      // start is a UTC-constructed boundary; pin the formatter to UTC too, or a server in a
      // timezone behind UTC would display it as the day before.
      week: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(start),
      cost,
      mpg,
    };
  });

  return raw.map((w, i) => {
    const window = raw.slice(Math.max(0, i - 3), i + 1).filter((r) => r.mpg > 0);
    const rollingAvgMpg = window.length > 0 ? window.reduce((sum, r) => sum + r.mpg, 0) / window.length : 0;
    return { ...w, rollingAvgMpg: Number(rollingAvgMpg.toFixed(1)) };
  });
}

