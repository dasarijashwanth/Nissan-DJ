import { monthRange } from "@/lib/utils";
import type { FuelLog, Insurance, MaintenanceLog, RepairLog } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * DAY_MS;

/** Miles per gallon for a single fill, given the odometer reading of the previous fill. */
export function calcFillMPG(
  currentOdometer: number,
  previousOdometer: number,
  gallons: number
): number {
  const miles = currentOdometer - previousOdometer;
  if (miles <= 0 || gallons <= 0) return 0;
  return miles / gallons;
}

/** Average MPG across all fills: total miles driven between fills / total gallons used. */
export function calcAvgMPG(fuelLogs: FuelLog[]): number {
  // Sorted by odometer, not date: two fills logged on the same calendar day have no time
  // component to order them by, but odometer only ever increases, so it's the reliable sequence.
  const sorted = [...fuelLogs].sort((a, b) => a.odometer - b.odometer);

  let milesSum = 0;
  let gallonsSum = 0;

  for (let i = 1; i < sorted.length; i++) {
    const miles = sorted[i].odometer - sorted[i - 1].odometer;
    if (miles > 0) {
      milesSum += miles;
      gallonsSum += sorted[i].gallons;
    }
  }

  return gallonsSum > 0 ? milesSum / gallonsSum : 0;
}

export type FuelEfficiencyInsight = {
  latestMPG: number | null;
  avgMPG: number | null;
  deltaPercent: number | null;
};

/**
 * Compares the most recent fill's MPG against the average of every fill *before* it, for the "how
 * am I doing" prompt shown right after logging fuel. Deliberately excludes the latest fill from
 * that average — comparing a fill against a number that already includes itself mutes the delta
 * and makes it mathematically impossible to differ at exactly 2 logs. avgMPG is null until there's
 * at least one prior MPG data point to average (i.e. at least 3 total fills).
 */
export function getFuelEfficiencyInsight(fuelLogs: FuelLog[]): FuelEfficiencyInsight {
  const sorted = [...fuelLogs].sort((a, b) => a.odometer - b.odometer);

  if (sorted.length < 2) {
    return { latestMPG: null, avgMPG: null, deltaPercent: null };
  }

  const last = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const fillMPG = calcFillMPG(last.odometer, previous.odometer, last.gallons);
  const latestMPG = fillMPG > 0 ? fillMPG : null;

  const priorMPG = calcAvgMPG(sorted.slice(0, -1));
  const avgMPG = priorMPG > 0 ? priorMPG : null;
  const deltaPercent = latestMPG != null && avgMPG != null ? ((latestMPG - avgMPG) / avgMPG) * 100 : null;

  return { latestMPG, avgMPG, deltaPercent };
}

export function calcCostPerMile(
  totalSpend: number,
  startOdometer: number,
  currentOdometer: number
): number {
  const miles = currentOdometer - startOdometer;
  return miles > 0 ? totalSpend / miles : 0;
}

/** Insurance has no per-entry cost, only a recurring monthlyCost — prorate by elapsed months. */
function calcInsuranceSpend(policy: Insurance, asOf: Date): number {
  const start = new Date(policy.startDate);
  const end = new Date(policy.renewalDate) < asOf ? new Date(policy.renewalDate) : asOf;
  if (end <= start) return 0;
  const months = (end.getTime() - start.getTime()) / MONTH_MS;
  return months * policy.monthlyCost;
}

export function calcTotalVehicleSpend(
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[],
  repairLogs: RepairLog[],
  insuranceLogs: Insurance[]
): number {
  const now = new Date();
  const fuelTotal = fuelLogs.reduce((sum, l) => sum + l.totalCost, 0);
  const maintenanceTotal = maintenanceLogs.reduce((sum, l) => sum + l.cost, 0);
  const repairTotal = repairLogs.reduce((sum, l) => sum + l.cost, 0);
  const insuranceTotal = insuranceLogs.reduce((sum, l) => sum + calcInsuranceSpend(l, now), 0);
  return fuelTotal + maintenanceTotal + repairTotal + insuranceTotal;
}

export function calcMonthVehicleCost(
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[],
  repairLogs: RepairLog[],
  insuranceLogs: Insurance[],
  month: Date
): number {
  const { start, end } = monthRange(month.getUTCFullYear(), month.getUTCMonth());
  const inMonth = (date: string) => {
    const d = new Date(date);
    return d >= start && d < end;
  };

  const fuelTotal = fuelLogs.filter((l) => inMonth(l.date)).reduce((sum, l) => sum + l.totalCost, 0);
  const maintenanceTotal = maintenanceLogs
    .filter((l) => inMonth(l.date))
    .reduce((sum, l) => sum + l.cost, 0);
  const repairTotal = repairLogs.filter((l) => inMonth(l.date)).reduce((sum, l) => sum + l.cost, 0);
  const insuranceTotal = insuranceLogs
    .filter((p) => new Date(p.startDate) < end && new Date(p.renewalDate) >= start)
    .reduce((sum, p) => sum + p.monthlyCost, 0);

  return fuelTotal + maintenanceTotal + repairTotal + insuranceTotal;
}

export function isMaintenanceDueSoon(log: MaintenanceLog, currentOdometer: number): boolean {
  const dueByDate = log.nextDueDate
    ? new Date(log.nextDueDate).getTime() <= Date.now() + 30 * DAY_MS
    : false;
  const dueByMiles = log.nextDueMiles != null ? currentOdometer >= log.nextDueMiles - 500 : false;
  return dueByDate || dueByMiles;
}

export function isInsuranceRenewalSoon(policy: Insurance): boolean {
  return new Date(policy.renewalDate).getTime() <= Date.now() + 30 * DAY_MS;
}

export function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS);
}

/** Most recent maintenance log of a given type — older due-date/due-mileage fields for that type are stale. */
export function findLatestMaintenanceByType(logs: MaintenanceLog[], type: string): MaintenanceLog | null {
  const matches = logs
    .filter((l) => l.type === type)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return matches[0] ?? null;
}

/** Same miles-per-gallon-per-fill math as calcAvgMPG, but only counting fills that landed in [start, end) — the odometer delta still comes from each fill's actual previous fill, even if that prior fill was outside the range. */
export function calcAvgMPGInRange(fuelLogs: FuelLog[], start: Date, end: Date): number {
  const sorted = [...fuelLogs].sort((a, b) => a.odometer - b.odometer);

  let milesSum = 0;
  let gallonsSum = 0;

  for (let i = 1; i < sorted.length; i++) {
    const fillDate = new Date(sorted[i].date);
    if (fillDate < start || fillDate >= end) continue;

    const miles = sorted[i].odometer - sorted[i - 1].odometer;
    if (miles > 0) {
      milesSum += miles;
      gallonsSum += sorted[i].gallons;
    }
  }

  return gallonsSum > 0 ? milesSum / gallonsSum : 0;
}

export function calcAvgPricePerGallonInRange(fuelLogs: FuelLog[], start: Date, end: Date): number {
  const inRange = fuelLogs.filter((l) => {
    const d = new Date(l.date);
    return d >= start && d < end;
  });
  if (inRange.length === 0) return 0;
  return inRange.reduce((sum, l) => sum + l.pricePerGallon, 0) / inRange.length;
}
