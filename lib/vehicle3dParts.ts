import type { Vehicle, FuelLog, MaintenanceLog, Vehicle3DStats } from "@/lib/types";
import { findLatestMaintenanceByType, daysUntil } from "@/lib/vehicleUtils";
import { formatCurrency, formatDate, formatMiles } from "@/lib/utils";

export type CarPart = {
  id: string;
  name: string;
  position: [number, number, number];
  icon: string;
  title: string;
  lines: string[];
};

function maintenanceLine(log: MaintenanceLog | null, verb: string): string {
  if (!log) return `No ${verb} logged yet`;
  return `Last ${verb}: ${formatDate(log.date)} at ${formatMiles(log.odometer)}`;
}

function nextDueLine(log: MaintenanceLog | null): string | null {
  if (!log) return null;
  if (log.nextDueMiles != null) return `Next due at ${formatMiles(log.nextDueMiles)}`;
  if (log.nextDueDate) return `Next due ${formatDate(log.nextDueDate)} (${daysUntil(log.nextDueDate)}d)`;
  return null;
}

/** Builds the clickable-hotspot data for the 360 viewer from data pages already fetch — plain, fully serializable objects (no closures) so a Server Component can pass this straight to a Client Component. */
export function buildCarParts(
  vehicle: Vehicle,
  maintenanceLogs: MaintenanceLog[],
  fuelLogs: FuelLog[],
  stats: Vehicle3DStats
): CarPart[] {
  const oilChange = findLatestMaintenanceByType(maintenanceLogs, "Oil Change");
  const tireRotation = findLatestMaintenanceByType(maintenanceLogs, "Tire Rotation");
  const battery = findLatestMaintenanceByType(maintenanceLogs, "Battery");
  const brakePad = findLatestMaintenanceByType(maintenanceLogs, "Brake Pad");
  const latestFuel = [...fuelLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? null;

  return [
    {
      id: "engine",
      name: "Engine Bay",
      position: [2.0, 0.6, 0],
      icon: "⚙️",
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model} Engine`,
      lines: [maintenanceLine(oilChange, "oil change"), nextDueLine(oilChange)].filter((l): l is string => l != null),
    },
    {
      id: "fuel_tank",
      name: "Fuel System",
      position: [-0.5, -0.2, 1.1],
      icon: "⛽",
      title: "Fuel System",
      lines: [
        stats.avgMPG > 0 ? `Avg ${stats.avgMPG.toFixed(1)} MPG` : "No fuel logs yet",
        latestFuel ? `Last fill: ${formatDate(latestFuel.date)} — ${formatCurrency(latestFuel.totalCost)}` : "",
      ].filter((l) => l.length > 0),
    },
    {
      id: "front_tires",
      name: "Front Tires",
      position: [1.3, -0.06, 1.2],
      icon: "🛞",
      title: "Front Tires",
      lines: [maintenanceLine(tireRotation, "rotation"), nextDueLine(tireRotation)].filter(
        (l): l is string => l != null
      ),
    },
    {
      id: "rear_tires",
      name: "Rear Tires",
      position: [-1.3, -0.06, 1.2],
      icon: "🛞",
      title: "Rear Tires",
      lines: [maintenanceLine(tireRotation, "rotation"), nextDueLine(tireRotation)].filter(
        (l): l is string => l != null
      ),
    },
    {
      id: "odometer",
      name: "Odometer",
      position: [0.3, 0.9, 0.9],
      icon: "📍",
      title: "Mileage Tracker",
      lines: [
        `Current: ${formatMiles(stats.currentOdometer)}`,
        `Today: +${stats.todayMiles} mi`,
        `This month: ${stats.monthMiles} mi`,
      ],
    },
    {
      id: "battery",
      name: "Battery",
      position: [1.6, 0.5, -0.7],
      icon: "🔋",
      title: "Battery",
      lines: [maintenanceLine(battery, "replacement")],
    },
    {
      id: "brakes",
      name: "Brake System",
      position: [1.3, 0.1, 1.0],
      icon: "🛑",
      title: "Brake System",
      lines: [maintenanceLine(brakePad, "service"), nextDueLine(brakePad)].filter((l): l is string => l != null),
    },
  ];
}
