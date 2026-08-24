import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { validateChitFundInput, type ChitFundFormValues } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.chitFund.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<ChitFundFormValues>;
  const values: ChitFundFormValues = {
    amount: body.amount ?? "",
    groupName: body.groupName ?? "",
    date: body.date ?? "",
    notes: body.notes ?? "",
  };

  const { valid, errors, amount } = validateChitFundInput(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const contribution = await prisma.chitFund.update({
    where: { id },
    data: {
      amount,
      groupName: values.groupName.trim(),
      date: new Date(values.date),
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(contribution);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.chitFund.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.chitFund.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
