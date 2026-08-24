import { prisma } from "@/lib/prisma";
import type { LoanGiven } from "@/lib/types";

export async function getLoansGiven(userId: string): Promise<LoanGiven[]> {
  const loans = await prisma.loanGiven.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return loans.map((l) => ({
    ...l,
    startDate: l.startDate.toISOString(),
    createdAt: l.createdAt.toISOString(),
  }));
}

export async function isLoanGivenOwnedBy(id: string, userId: string): Promise<boolean> {
  const l = await prisma.loanGiven.findUnique({ where: { id }, select: { userId: true } });
  return l?.userId === userId;
}
