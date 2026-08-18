import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  Car,
  FuelLog,
  MaintenanceLog,
  RepairLog,
  OdometerLog,
  Insurance,
} from "@/lib/types";

function serializeCar(car: {
  purchaseDate: Date | null;
  createdAt: Date;
  [key: string]: unknown;
}): Car {
  return {
    ...car,
    purchaseDate: car.purchaseDate?.toISOString() ?? null,
    createdAt: car.createdAt.toISOString(),
  } as Car;
}

/**
 * The layout and page both call this on first render, so two concurrent requests can both see
 * "no car yet" and race to create one — Postgres's unique constraint on userId rejects the
 * loser. Recover by just fetching the row the winner created instead of failing the request.
 */
export async function getOrCreateCar(userId: string): Promise<Car> {
  try {
    const car = await prisma.car.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return serializeCar(car);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const car = await prisma.car.findUniqueOrThrow({ where: { userId } });
      return serializeCar(car);
    }
    throw error;
  }
}

export async function isCarOwnedBy(carId: string, userId: string): Promise<boolean> {
  const car = await prisma.car.findUnique({ where: { id: carId }, select: { userId: true } });
  return car?.userId === userId;
}

export async function getFuelLogs(carId: string): Promise<FuelLog[]> {
  const logs = await prisma.fuelLog.findMany({ where: { carId }, orderBy: { date: "desc" } });
  return logs.map((l) => ({ ...l, date: l.date.toISOString(), createdAt: l.createdAt.toISOString() }));
}

export async function getMaintenanceLogs(carId: string): Promise<MaintenanceLog[]> {
  const logs = await prisma.maintenanceLog.findMany({ where: { carId }, orderBy: { date: "desc" } });
  return logs.map((l) => ({
    ...l,
    date: l.date.toISOString(),
    nextDueDate: l.nextDueDate?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
  }));
}

export async function getRepairLogs(carId: string): Promise<RepairLog[]> {
  const logs = await prisma.repairLog.findMany({ where: { carId }, orderBy: { date: "desc" } });
  return logs.map((l) => ({ ...l, date: l.date.toISOString(), createdAt: l.createdAt.toISOString() }));
}

export async function getOdometerLogs(carId: string): Promise<OdometerLog[]> {
  const logs = await prisma.odometerLog.findMany({ where: { carId }, orderBy: { date: "desc" } });
  return logs.map((l) => ({ ...l, date: l.date.toISOString(), createdAt: l.createdAt.toISOString() }));
}

export async function getInsurancePolicies(carId: string): Promise<Insurance[]> {
  const logs = await prisma.insurance.findMany({ where: { carId }, orderBy: { renewalDate: "desc" } });
  return logs.map((l) => ({
    ...l,
    startDate: l.startDate.toISOString(),
    renewalDate: l.renewalDate.toISOString(),
    createdAt: l.createdAt.toISOString(),
  }));
}

/** The car's mileage only ever increases, so the current reading is the max across every log type. */
export async function getCurrentOdometer(carId: string): Promise<number> {
  const [odo, fuel, maintenance, repair] = await Promise.all([
    prisma.odometerLog.aggregate({ where: { carId }, _max: { miles: true } }),
    prisma.fuelLog.aggregate({ where: { carId }, _max: { odometer: true } }),
    prisma.maintenanceLog.aggregate({ where: { carId }, _max: { odometer: true } }),
    prisma.repairLog.aggregate({ where: { carId }, _max: { odometer: true } }),
  ]);

  return Math.max(
    odo._max.miles ?? 0,
    fuel._max.odometer ?? 0,
    maintenance._max.odometer ?? 0,
    repair._max.odometer ?? 0
  );
}

/** No purchase-odometer field exists on Car, so the earliest logged reading anchors cost-per-mile. */
/** Prefers the user-set Car.startOdometer (Settings); falls back to the earliest logged reading. */
export async function getStartOdometer(carId: string): Promise<number> {
  const car = await prisma.car.findUnique({ where: { id: carId }, select: { startOdometer: true } });
  if (car?.startOdometer != null) return car.startOdometer;

  const [odo, fuel, maintenance, repair] = await Promise.all([
    prisma.odometerLog.aggregate({ where: { carId }, _min: { miles: true } }),
    prisma.fuelLog.aggregate({ where: { carId }, _min: { odometer: true } }),
    prisma.maintenanceLog.aggregate({ where: { carId }, _min: { odometer: true } }),
    prisma.repairLog.aggregate({ where: { carId }, _min: { odometer: true } }),
  ]);

  const readings = [odo._min.miles, fuel._min.odometer, maintenance._min.odometer, repair._min.odometer].filter(
    (v): v is number => v != null
  );

  return readings.length > 0 ? Math.min(...readings) : 0;
}

export type CarActivity = {
  id: string;
  kind: "fuel" | "maintenance" | "repair";
  title: string;
  date: string;
  cost: number;
};

export async function getRecentActivity(carId: string, limit = 8): Promise<CarActivity[]> {
  const [fuel, maintenance, repair] = await Promise.all([
    prisma.fuelLog.findMany({ where: { carId }, orderBy: { date: "desc" }, take: limit }),
    prisma.maintenanceLog.findMany({ where: { carId }, orderBy: { date: "desc" }, take: limit }),
    prisma.repairLog.findMany({ where: { carId }, orderBy: { date: "desc" }, take: limit }),
  ]);

  const activity: CarActivity[] = [
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

/** Every car cost also lands in the finance Transaction table so it shows up on the main dashboard. */
export async function createCarTransaction(
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
      date,
    },
  });
}
