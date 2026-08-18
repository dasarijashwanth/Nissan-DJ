import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { getBudgetsWithSpending } from "@/lib/budgetQueries";
import { validateBudget, type BudgetFormValues } from "@/lib/budgetValidation";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;
  const year = Number(searchParams.get("year")) || now.getUTCFullYear();

  const budgets = await getBudgetsWithSpending(user.id, month, year);
  return NextResponse.json(budgets);
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<BudgetFormValues>;
  const now = new Date();
  const values: BudgetFormValues = {
    category: body.category ?? "",
    amount: body.amount ?? "",
    month: body.month ?? String(now.getUTCMonth() + 1),
    year: body.year ?? String(now.getUTCFullYear()),
  };

  const { valid, errors } = validateBudget(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const budget = await prisma.budget.upsert({
    where: {
      userId_category_month_year: {
        userId: user.id,
        category: values.category,
        month: Number(values.month),
        year: Number(values.year),
      },
    },
    update: { amount: Number(values.amount) },
    create: {
      userId: user.id,
      category: values.category,
      amount: Number(values.amount),
      month: Number(values.month),
      year: Number(values.year),
    },
  });

  return NextResponse.json(budget, { status: 201 });
}
