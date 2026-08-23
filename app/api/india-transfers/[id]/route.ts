import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { validateIndiaTransferInput, type IndiaTransferFormValues } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.indiaTransfer.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<IndiaTransferFormValues>;
  const values: IndiaTransferFormValues = {
    amount: body.amount ?? "",
    recipient: body.recipient ?? "",
    date: body.date ?? "",
    notes: body.notes ?? "",
  };

  const { valid, errors, amount } = validateIndiaTransferInput(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const transfer = await prisma.indiaTransfer.update({
    where: { id },
    data: {
      amount,
      recipient: values.recipient.trim(),
      date: new Date(values.date),
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(transfer);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.indiaTransfer.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.indiaTransfer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
