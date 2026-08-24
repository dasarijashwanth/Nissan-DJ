import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { getChitFundPlans } from "@/lib/chitFundQueries";
import { validateChitFundPlan, type ChitFundPlanFormValues } from "@/lib/validation";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getChitFundPlans(user.id));
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ChitFundPlanFormValues>;
  const values: ChitFundPlanFormValues = {
    amount: body.amount ?? "",
    groupName: body.groupName ?? "",
    type: body.type === "received" ? "received" : "paid",
    startDate: body.startDate ?? "",
    periodMonths: body.periodMonths ?? "",
    notes: body.notes ?? "",
  };

  const { valid, errors, amount, periodMonths } = validateChitFundPlan(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const startDate = new Date(values.startDate);

  const plan = await prisma.chitFundPlan.create({
    data: {
      userId: user.id,
      groupName: values.groupName.trim(),
      amount,
      type: values.type,
      startDate,
      periodMonths,
      nextDueDate: startDate,
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(plan, { status: 201 });
}
