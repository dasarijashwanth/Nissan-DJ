import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isVehicleOwnedBy, getRepairLogs, createVehicleTransaction } from "@/lib/vehicleQueries";
import { validateRepairLog, type RepairFormValues } from "@/lib/vehicleValidation";

export async function GET(_request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(await getRepairLogs(vehicleId));
}

export async function POST(request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
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

  const date = new Date(values.date);
  const cost = Number(values.cost);

  const log = await prisma.repairLog.create({
    data: {
      vehicleId,
      date,
      description: values.description.trim(),
      cost,
      odometer: Number(values.odometer),
      shop: values.shop.trim() || null,
      partsCost: values.partsCost ? Number(values.partsCost) : null,
      laborCost: values.laborCost ? Number(values.laborCost) : null,
      notes: values.notes.trim() || null,
    },
  });

  await createVehicleTransaction(user.id, "repair", values.description.trim(), cost, date);

  return NextResponse.json(log, { status: 201 });
}
