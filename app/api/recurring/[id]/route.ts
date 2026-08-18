import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isRecurringOwnedBy, postRecurringTransaction } from "@/lib/recurringQueries";
import { validateRecurring, type RecurringFormValues } from "@/lib/recurringValidation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await isRecurringOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<RecurringFormValues> & { isActive?: boolean };

  // Pause/resume toggle only touches isActive, skipping full field validation.
  if (typeof body.isActive === "boolean" && Object.keys(body).length === 1) {
    const recurring = await prisma.recurringTransaction.update({
      where: { id },
      data: { isActive: body.isActive },
    });
    return NextResponse.json(recurring);
  }

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

  const recurring = await prisma.recurringTransaction.update({
    where: { id },
    data: {
      title: values.title.trim(),
      amount,
      type: values.type,
      category: values.category,
      frequency: values.frequency,
      startDate: new Date(values.startDate),
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(recurring);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await isRecurringOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.recurringTransaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

/** "Post now" — manually trigger this recurring transaction early. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await isRecurringOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const transaction = await postRecurringTransaction(id, { alert: false });
  return NextResponse.json(transaction, { status: 201 });
}
