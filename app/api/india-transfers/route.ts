import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { validateIndiaTransferInput, type IndiaTransferFormValues } from "@/lib/validation";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transfers = await prisma.indiaTransfer.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transfers);
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const transfer = await prisma.indiaTransfer.create({
    data: {
      userId: user.id,
      amount,
      recipient: values.recipient.trim(),
      date: new Date(values.date),
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(transfer, { status: 201 });
}
