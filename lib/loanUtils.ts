import type { ChitFund, LoanGiven } from "@/lib/types";

/** Number of full calendar months between two dates — a month only counts once its "day of month" anniversary has passed. */
function fullMonthsElapsed(start: Date, now: Date): number {
  let months = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + (now.getUTCMonth() - start.getUTCMonth());
  if (now.getUTCDate() < start.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

export type LoanOutstanding = {
  monthsElapsed: number;
  accruedInterest: number;
  receivedInterest: number;
  unpaidInterest: number;
  outstanding: number;
};

/**
 * Outstanding Amount = principal + any interest that should have accrued by now (principal x
 * monthly rate x full months elapsed) but hasn't shown up as a "received" ChitFund entry logged
 * under this borrower's name. Matching by borrowerName == groupName, the same field the user
 * already fills in when logging a received payment — no separate linking step required.
 */
export function calcLoanOutstanding(loan: LoanGiven, allContributions: ChitFund[]): LoanOutstanding {
  const monthsElapsed = fullMonthsElapsed(new Date(loan.startDate), new Date());
  const accruedInterest = loan.principal * (loan.interestRatePercent / 100) * monthsElapsed;

  const receivedInterest = allContributions
    .filter((c) => c.type === "received" && c.groupName === loan.borrowerName)
    .reduce((sum, c) => sum + c.amount, 0);

  const unpaidInterest = Math.max(0, accruedInterest - receivedInterest);
  const outstanding = loan.principal + unpaidInterest;

  return { monthsElapsed, accruedInterest, receivedInterest, unpaidInterest, outstanding };
}
