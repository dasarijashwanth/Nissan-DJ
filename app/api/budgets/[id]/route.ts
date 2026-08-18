import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isBudgetOwnedBy } from "@/lib/budgetQueries";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await isBudgetOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as { amount?: string | number };
  const amount = Number(body.amount);
  if (!body.amount || Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ errors: { amount: "Enter an amount greater than 0." } }, { status: 400 });
  }

  const budget = await prisma.budget.update({ where: { id }, data: { amount } });
  return NextResponse.json(budget);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await isBudgetOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.budget.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
