import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isVehicleOwnedBy, getMaintenanceLogs, createVehicleTransaction } from "@/lib/vehicleQueries";
import { validateMaintenanceLog, type MaintenanceFormValues } from "@/lib/vehicleValidation";

export async function GET(_request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(await getMaintenanceLogs(vehicleId));
}

export async function POST(request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<MaintenanceFormValues>;
  const values: MaintenanceFormValues = {
    date: body.date ?? "",
    type: body.type ?? "",
    cost: body.cost ?? "",
    odometer: body.odometer ?? "",
    shop: body.shop ?? "",
    nextDueDate: body.nextDueDate ?? "",
    nextDueMiles: body.nextDueMiles ?? "",
    notes: body.notes ?? "",
  };

  const { valid, errors } = validateMaintenanceLog(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const date = new Date(values.date);
  const cost = Number(values.cost);

  const log = await prisma.maintenanceLog.create({
    data: {
      vehicleId,
      date,
      type: values.type,
      cost,
      odometer: Number(values.odometer),
      shop: values.shop.trim() || null,
      notes: values.notes.trim() || null,
      nextDueDate: values.nextDueDate ? new Date(values.nextDueDate) : null,
      nextDueMiles: values.nextDueMiles ? Number(values.nextDueMiles) : null,
    },
  });

  await createVehicleTransaction(user.id, "maintenance", values.type, cost, date);

  return NextResponse.json(log, { status: 201 });
}
