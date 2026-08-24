import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { getLoansGiven } from "@/lib/loanQueries";
import { validateLoanGiven, type LoanGivenFormValues } from "@/lib/validation";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getLoansGiven(user.id));
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<LoanGivenFormValues>;
  const values: LoanGivenFormValues = {
    borrowerName: body.borrowerName ?? "",
    principal: body.principal ?? "",
    interestRatePercent: body.interestRatePercent ?? "",
    startDate: body.startDate ?? "",
    notes: body.notes ?? "",
  };

  const { valid, errors, principal, interestRatePercent } = validateLoanGiven(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const loan = await prisma.loanGiven.create({
    data: {
      userId: user.id,
      borrowerName: values.borrowerName.trim(),
      principal,
      interestRatePercent,
      startDate: new Date(values.startDate),
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(loan, { status: 201 });
}
