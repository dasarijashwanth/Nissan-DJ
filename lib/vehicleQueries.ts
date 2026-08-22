import { prisma } from "@/lib/prisma";
import type { Vehicle, FuelLog, MaintenanceLog, RepairLog, OdometerLog, Insurance } from "@/lib/types";
import { calcTotalVehicleSpend, calcCostPerMile, calcAvgMPG } from "@/lib/vehicleUtils";
import { getMonthlyVehicleCosts } from "@/lib/vehicleAnalytics";

export function serializeVehicle(vehicle: {
  purchaseDate: Date | null;
  createdAt: Date;
  [key: string]: unknown;
}): Vehicle {
  return {
    ...vehicle,
    purchaseDate: vehicle.purchaseDate?.toISOString() ?? null,
    createdAt: vehicle.createdAt.toISOString(),
  } as Vehicle;
}

/** All of a user's active vehicles, primary first. Empty array if they haven't added one yet. */
export async function getVehiclesForUser(userId: string): Promise<Vehicle[]> {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId, isActive: true },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  return vehicles.map(serializeVehicle);
}

export async function getVehicleById(vehicleId: string): Promise<Vehicle | null> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  return vehicle ? serializeVehicle(vehicle) : null;
}

export type NewVehicleInput = {
  nickname: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate?: string | null;
  purchasePrice?: number | null;
  purchaseDate?: Date | null;
  startOdometer?: number | null;
};

/** The user's first vehicle is automatically primary; later ones are added as secondary. */
export async function createVehicle(userId: string, input: NewVehicleInput): Promise<Vehicle> {
  const hasExisting = await prisma.vehicle.findFirst({ where: { userId, isActive: true } });

  const vehicle = await prisma.vehicle.create({
    data: { userId, isPrimary: !hasExisting, ...input },
  });

  return serializeVehicle(vehicle);
}

/** Marks one vehicle primary and demotes every other active vehicle the user owns. */
export async function setPrimaryVehicle(userId: string, vehicleId: string): Promise<void> {
  await prisma.$transaction([
    prisma.vehicle.updateMany({ where: { userId, isActive: true }, data: { isPrimary: false } }),
    prisma.vehicle.update({ where: { id: vehicleId }, data: { isPrimary: true } }),
  ]);
}

/** The user's primary vehicle (or their oldest active one if none is marked primary) — null if they haven't added one yet. Never fabricates a placeholder; a new user is meant to add their own via /vehicles/new. */
export async function getPrimaryVehicle(userId: string): Promise<Vehicle | null> {
  const vehicle = await prisma.vehicle.findFirst({
    where: { userId, isActive: true },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
  return vehicle ? serializeVehicle(vehicle) : null;
}

export async function isVehicleOwnedBy(vehicleId: string, userId: string): Promise<boolean> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { userId: true } });
  return vehicle?.userId === userId;
}

export async function getFuelLogs(vehicleId: string): Promise<FuelLog[]> {
  const logs = await prisma.fuelLog.findMany({ where: { vehicleId }, orderBy: { date: "desc" } });
  return logs.map((l) => ({ ...l, date: l.date.toISOString(), createdAt: l.createdAt.toISOString() }));
}

export async function getMaintenanceLogs(vehicleId: string): Promise<MaintenanceLog[]> {
  const logs = await prisma.maintenanceLog.findMany({ where: { vehicleId }, orderBy: { date: "desc" } });
  return logs.map((l) => ({
    ...l,
    date: l.date.toISOString(),
    nextDueDate: l.nextDueDate?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
  }));
}

export async function getRepairLogs(vehicleId: string): Promise<RepairLog[]> {
  const logs = await prisma.repairLog.findMany({ where: { vehicleId }, orderBy: { date: "desc" } });
  return logs.map((l) => ({ ...l, date: l.date.toISOString(), createdAt: l.createdAt.toISOString() }));
}

export async function getOdometerLogs(vehicleId: string): Promise<OdometerLog[]> {
  const logs = await prisma.odometerLog.findMany({ where: { vehicleId }, orderBy: { date: "desc" } });
  return logs.map((l) => ({ ...l, date: l.date.toISOString(), createdAt: l.createdAt.toISOString() }));
}

export async function getInsurancePolicies(vehicleId: string): Promise<Insurance[]> {
  const logs = await prisma.insurance.findMany({ where: { vehicleId }, orderBy: { renewalDate: "desc" } });
  return logs.map((l) => ({
    ...l,
    startDate: l.startDate.toISOString(),
    renewalDate: l.renewalDate.toISOString(),
    createdAt: l.createdAt.toISOString(),
  }));
}

/** The vehicle's mileage only ever increases, so the current reading is the max across every log type. */
export async function getCurrentOdometer(vehicleId: string): Promise<number> {
  const [odo, fuel, maintenance, repair] = await Promise.all([
    prisma.odometerLog.aggregate({ where: { vehicleId }, _max: { miles: true } }),
    prisma.fuelLog.aggregate({ where: { vehicleId }, _max: { odometer: true } }),
    prisma.maintenanceLog.aggregate({ where: { vehicleId }, _max: { odometer: true } }),
    prisma.repairLog.aggregate({ where: { vehicleId }, _max: { odometer: true } }),
  ]);

  return Math.max(
    odo._max.miles ?? 0,
    fuel._max.odometer ?? 0,
    maintenance._max.odometer ?? 0,
    repair._max.odometer ?? 0
  );
}

/** Prefers the user-set Vehicle.startOdometer (Settings); falls back to the earliest logged reading. */
export async function getStartOdometer(vehicleId: string): Promise<number> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { startOdometer: true } });
  if (vehicle?.startOdometer != null) return vehicle.startOdometer;

  const [odo, fuel, maintenance, repair] = await Promise.all([
    prisma.odometerLog.aggregate({ where: { vehicleId }, _min: { miles: true } }),
    prisma.fuelLog.aggregate({ where: { vehicleId }, _min: { odometer: true } }),
    prisma.maintenanceLog.aggregate({ where: { vehicleId }, _min: { odometer: true } }),
    prisma.repairLog.aggregate({ where: { vehicleId }, _min: { odometer: true } }),
  ]);

  const readings = [odo._min.miles, fuel._min.odometer, maintenance._min.odometer, repair._min.odometer].filter(
    (v): v is number => v != null
  );

  return readings.length > 0 ? Math.min(...readings) : 0;
}

export type VehicleActivity = {
  id: string;
  kind: "fuel" | "maintenance" | "repair";
  title: string;
  date: string;
  cost: number;
};

export async function getRecentActivity(vehicleId: string, limit = 8): Promise<VehicleActivity[]> {
  const [fuel, maintenance, repair] = await Promise.all([
    prisma.fuelLog.findMany({ where: { vehicleId }, orderBy: { date: "desc" }, take: limit }),
    prisma.maintenanceLog.findMany({ where: { vehicleId }, orderBy: { date: "desc" }, take: limit }),
    prisma.repairLog.findMany({ where: { vehicleId }, orderBy: { date: "desc" }, take: limit }),
  ]);

  const activity: VehicleActivity[] = [
    ...fuel.map((l) => ({
      id: l.id,
      kind: "fuel" as const,
      title: l.station ? `Fuel at ${l.station}` : "Fuel fill-up",
      date: l.date.toISOString(),
      cost: l.totalCost,
    })),
    ...maintenance.map((l) => ({
      id: l.id,
      kind: "maintenance" as const,
      title: l.type,
      date: l.date.toISOString(),
      cost: l.cost,
    })),
    ...repair.map((l) => ({
      id: l.id,
      kind: "repair" as const,
      title: l.description,
      date: l.date.toISOString(),
      cost: l.cost,
    })),
  ];

  return activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
}

const CATEGORY_BY_KIND = {
  fuel: "Fuel",
  maintenance: "Maintenance",
  repair: "Repair",
  insurance: "Insurance",
} as const;

/** Every vehicle cost also lands in the finance Transaction table so it shows up on the main dashboard. */
export async function createVehicleTransaction(
  userId: string,
  kind: keyof typeof CATEGORY_BY_KIND,
  title: string,
  amount: number,
  date: Date
) {
  await prisma.transaction.create({
    data: {
      userId,
      title,
      amount,
      type: "expense",
      category: CATEGORY_BY_KIND[kind],
      scope: "vehicle",
      date,
    },
  });
}

export type VehicleComparisonDatum = {
  vehicleId: string;
  nickname: string;
  totalSpend: number;
  costPerMile: number;
  avgMPG: number | null;
  monthlyCosts: { month: string; cost: number }[];
};

export async function getVehicleComparisonData(vehicles: Vehicle[], months: number): Promise<VehicleComparisonDatum[]> {
  return Promise.all(
    vehicles.map(async (vehicle) => {
      const [fuelLogs, maintenanceLogs, repairLogs, insurancePolicies, currentOdometer, startOdometer] =
        await Promise.all([
          getFuelLogs(vehicle.id),
          getMaintenanceLogs(vehicle.id),
          getRepairLogs(vehicle.id),
          getInsurancePolicies(vehicle.id),
          getCurrentOdometer(vehicle.id),
          getStartOdometer(vehicle.id),
        ]);

      const totalSpend = calcTotalVehicleSpend(fuelLogs, maintenanceLogs, repairLogs, insurancePolicies);
      const monthlyBuckets = getMonthlyVehicleCosts(fuelLogs, maintenanceLogs, repairLogs, insurancePolicies, months);

      return {
        vehicleId: vehicle.id,
        nickname: vehicle.nickname,
        totalSpend,
        costPerMile: calcCostPerMile(totalSpend, startOdometer, currentOdometer),
        avgMPG: fuelLogs.length >= 2 ? calcAvgMPG(fuelLogs) : null,
        monthlyCosts: monthlyBuckets.map((m) => ({
          month: m.month,
          cost: m.fuel + m.maintenance + m.repair + m.insurance,
        })),
      };
    })
  );
}
