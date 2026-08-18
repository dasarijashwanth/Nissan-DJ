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
  const sorted = [...fuelLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

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
