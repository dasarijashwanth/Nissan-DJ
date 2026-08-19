import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isVehicleOwnedBy } from "@/lib/vehicleQueries";
import { validateRepairLog, type RepairFormValues } from "@/lib/vehicleValidation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string; repairLogId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId, repairLogId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.repairLog.findUnique({ where: { id: repairLogId } });
  if (!existing || existing.vehicleId !== vehicleId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<RepairFormValues>;
  const values: RepairFormValues = {
    date: body.date ?? "",
    description: body.description ?? "",
    shop: body.shop ?? "",
    partsCost: body.partsCost ?? "",
    laborCost: body.laborCost ?? "",
    cost: body.cost ?? "",
    odometer: body.odometer ?? "",
    notes: body.notes ?? "",
  };

  const { valid, errors } = validateRepairLog(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const log = await prisma.repairLog.update({
    where: { id: repairLogId },
    data: {
      date: new Date(values.date),
      description: values.description.trim(),
      cost: Number(values.cost),
      odometer: Number(values.odometer),
      shop: values.shop.trim() || null,
      partsCost: values.partsCost ? Number(values.partsCost) : null,
      laborCost: values.laborCost ? Number(values.laborCost) : null,
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(log);
}
