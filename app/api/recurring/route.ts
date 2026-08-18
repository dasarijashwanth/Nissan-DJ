import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { getRecurringTransactions } from "@/lib/recurringQueries";
import { validateRecurring, type RecurringFormValues } from "@/lib/recurringValidation";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getRecurringTransactions(user.id));
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<RecurringFormValues>;
  const values: RecurringFormValues = {
    title: body.title ?? "",
    amount: body.amount ?? "",
    type: body.type ?? "",
    category: body.category ?? "",
    frequency: body.frequency ?? "",
    startDate: body.startDate ?? "",
    notes: body.notes ?? "",
  };

  const { valid, errors, amount } = validateRecurring(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const startDate = new Date(values.startDate);

  const recurring = await prisma.recurringTransaction.create({
    data: {
      userId: user.id,
      title: values.title.trim(),
      amount,
      type: values.type,
      category: values.category,
      frequency: values.frequency,
      startDate,
      nextDueDate: startDate,
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(recurring, { status: 201 });
}
