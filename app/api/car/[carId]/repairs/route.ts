import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isCarOwnedBy, getRepairLogs, createCarTransaction } from "@/lib/carQueries";
import { validateRepairLog, type RepairFormValues } from "@/lib/carValidation";

export async function GET(_request: Request, { params }: { params: Promise<{ carId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { carId } = await params;
  if (!(await isCarOwnedBy(carId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(await getRepairLogs(carId));
}

export async function POST(request: Request, { params }: { params: Promise<{ carId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { carId } = await params;
  if (!(await isCarOwnedBy(carId, user.id))) {
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
      carId,
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

  await createCarTransaction(user.id, "repair", values.description.trim(), cost, date);

  return NextResponse.json(log, { status: 201 });
}
