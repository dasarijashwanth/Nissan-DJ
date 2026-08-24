import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { validateChitFundInput, type ChitFundFormValues } from "@/lib/validation";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contributions = await prisma.chitFund.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(contributions);
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ChitFundFormValues>;
  const values: ChitFundFormValues = {
    amount: body.amount ?? "",
    groupName: body.groupName ?? "",
    type: body.type === "received" ? "received" : "paid",
    date: body.date ?? "",
    notes: body.notes ?? "",
  };

  const { valid, errors, amount } = validateChitFundInput(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const contribution = await prisma.chitFund.create({
    data: {
      userId: user.id,
      amount,
      groupName: values.groupName.trim(),
      type: values.type,
      date: new Date(values.date),
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(contribution, { status: 201 });
}
