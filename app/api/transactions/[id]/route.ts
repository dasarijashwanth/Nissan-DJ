import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { validateTransactionInput, type TransactionFormValues } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<TransactionFormValues>;
  const values: TransactionFormValues = {
    title: body.title ?? "",
    amount: body.amount ?? "",
    type: body.type ?? "",
    category: body.category ?? "",
    date: body.date ?? "",
    notes: body.notes ?? "",
  };

  const { valid, errors, amount } = validateTransactionInput(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      title: values.title.trim(),
      amount,
      type: values.type,
      category: values.category,
      date: new Date(values.date),
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(transaction);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
