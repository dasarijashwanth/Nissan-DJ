import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isLoanGivenOwnedBy } from "@/lib/loanQueries";
import { validateLoanGiven, type LoanGivenFormValues } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await isLoanGivenOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<LoanGivenFormValues> & { isActive?: boolean };

  // Close/reopen toggle only touches isActive, skipping full field validation.
  if (typeof body.isActive === "boolean" && Object.keys(body).length === 1) {
    const loan = await prisma.loanGiven.update({ where: { id }, data: { isActive: body.isActive } });
    return NextResponse.json(loan);
  }

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

  const loan = await prisma.loanGiven.update({
    where: { id },
    data: {
      borrowerName: values.borrowerName.trim(),
      principal,
      interestRatePercent,
      startDate: new Date(values.startDate),
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(loan);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await isLoanGivenOwnedBy(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.loanGiven.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
