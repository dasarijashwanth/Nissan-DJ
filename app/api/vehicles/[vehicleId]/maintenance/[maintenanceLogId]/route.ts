import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isVehicleOwnedBy } from "@/lib/vehicleQueries";
import { validateMaintenanceLog, type MaintenanceFormValues } from "@/lib/vehicleValidation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string; maintenanceLogId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId, maintenanceLogId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.maintenanceLog.findUnique({ where: { id: maintenanceLogId } });
  if (!existing || existing.vehicleId !== vehicleId) {
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

  const log = await prisma.maintenanceLog.update({
    where: { id: maintenanceLogId },
    data: {
      date: new Date(values.date),
      type: values.type,
      cost: Number(values.cost),
      odometer: Number(values.odometer),
      shop: values.shop.trim() || null,
      notes: values.notes.trim() || null,
      nextDueDate: values.nextDueDate ? new Date(values.nextDueDate) : null,
      nextDueMiles: values.nextDueMiles ? Number(values.nextDueMiles) : null,
    },
  });

  return NextResponse.json(log);
}
