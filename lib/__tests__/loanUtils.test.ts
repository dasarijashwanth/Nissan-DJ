import { describe, it, expect, vi, afterEach } from "vitest";
import { calcLoanOutstanding } from "@/lib/loanUtils";
import type { LoanGiven, ChitFund } from "@/lib/types";

function makeLoan(overrides: Partial<LoanGiven>): LoanGiven {
  return {
    id: "loan1",
    userId: "u1",
    borrowerName: "Alex",
    principal: 10000,
    interestRatePercent: 1, // 1%/month
    startDate: "2026-01-15T00:00:00.000Z",
    notes: null,
    isActive: true,
    createdAt: "2026-01-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("calcLoanOutstanding", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts zero months elapsed before the first monthly anniversary", () => {
    vi.setSystemTime(new Date("2026-02-10T12:00:00.000Z")); // before the 15th
    const loan = makeLoan({});
    const result = calcLoanOutstanding(loan, []);
    expect(result.monthsElapsed).toBe(0);
    expect(result.outstanding).toBe(10000);
  });

  it("counts a full month only once the day-of-month anniversary has passed", () => {
    vi.setSystemTime(new Date("2026-02-20T12:00:00.000Z")); // after the 15th
    const loan = makeLoan({});
    const result = calcLoanOutstanding(loan, []);
    expect(result.monthsElapsed).toBe(1);
    expect(result.accruedInterest).toBeCloseTo(100, 2); // 10000 * 1% * 1 month
    expect(result.outstanding).toBeCloseTo(10100, 2);
  });

  it("subtracts received interest payments logged under the borrower's name", () => {
    vi.setSystemTime(new Date("2026-04-20T12:00:00.000Z")); // 3 full months elapsed
    const loan = makeLoan({});
    const received: ChitFund[] = [
      {
        id: "c1",
        userId: "u1",
        groupName: "Alex",
        amount: 200,
        type: "received",
        notes: null,
        date: "2026-03-01T00:00:00.000Z",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
    ];
    const result = calcLoanOutstanding(loan, received);
    expect(result.accruedInterest).toBeCloseTo(300, 2); // 10000 * 1% * 3
    expect(result.receivedInterest).toBe(200);
    expect(result.unpaidInterest).toBeCloseTo(100, 2);
    expect(result.outstanding).toBeCloseTo(10100, 2);
  });

  it("ignores received payments logged under a different borrower/group name", () => {
    vi.setSystemTime(new Date("2026-04-20T12:00:00.000Z"));
    const loan = makeLoan({});
    const received: ChitFund[] = [
      {
        id: "c1",
        userId: "u1",
        groupName: "SomeoneElse",
        amount: 500,
        type: "received",
        notes: null,
        date: "2026-03-01T00:00:00.000Z",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
    ];
    const result = calcLoanOutstanding(loan, received);
    expect(result.receivedInterest).toBe(0);
  });
});
