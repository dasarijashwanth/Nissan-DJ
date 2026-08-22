import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { validateTransactionInput, type TransactionFormValues } from "@/lib/validation";
import { checkBudgetAlertForTransaction } from "@/lib/alertChecks";
import { getTrackingMode } from "@/lib/trackingMode";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const scope = await getTrackingMode();

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      title: values.title.trim(),
      amount,
      type: values.type,
      category: values.category,
      scope,
      date: new Date(values.date),
      notes: values.notes.trim() || null,
    },
  });

  if (values.type === "expense") {
    await checkBudgetAlertForTransaction(user.id, values.category, transaction.date);
  }

  return NextResponse.json(transaction, { status: 201 });
}
