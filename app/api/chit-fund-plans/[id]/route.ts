import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isChitFundPlanOwnedBy, postChitFundPlan } from "@/lib/chitFundQueries";
import { validateChitFundPlan, type ChitFundPlanFormValues } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await isChitFundPlanOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<ChitFundPlanFormValues> & { isActive?: boolean };

  // Pause/resume toggle only touches isActive, skipping full field validation.
  if (typeof body.isActive === "boolean" && Object.keys(body).length === 1) {
    const plan = await prisma.chitFundPlan.update({ where: { id }, data: { isActive: body.isActive } });
    return NextResponse.json(plan);
  }

  const values: ChitFundPlanFormValues = {
    amount: body.amount ?? "",
    groupName: body.groupName ?? "",
    startDate: body.startDate ?? "",
    periodMonths: body.periodMonths ?? "",
    notes: body.notes ?? "",
  };

  const { valid, errors, amount, periodMonths } = validateChitFundPlan(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const plan = await prisma.chitFundPlan.update({
    where: { id },
    data: {
      groupName: values.groupName.trim(),
      amount,
      startDate: new Date(values.startDate),
      periodMonths,
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(plan);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await isChitFundPlanOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.chitFundPlan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

/** "Post now" — manually trigger this plan's next contribution early. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await isChitFundPlanOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contribution = await postChitFundPlan(id);
  return NextResponse.json(contribution, { status: 201 });
}
