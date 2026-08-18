import * as XLSX from "xlsx";
import { formatDate } from "@/lib/utils";
import type { MonthlyReport } from "@/lib/types";

export function generateXlsxReport(report: MonthlyReport) {
  const wb = XLSX.utils.book_new();

  const allTransactions = [...report.income.transactions, ...report.expenses.transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const transactionsSheet = XLSX.utils.json_to_sheet(
    allTransactions.map((t) => ({
      Date: formatDate(t.date),
      Title: t.title,
      Type: t.type,
      Category: t.category,
      Amount: t.amount,
      Notes: t.notes ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, transactionsSheet, "All Transactions");

  const incomeSheet = XLSX.utils.json_to_sheet(
    Object.entries(report.income.byCategory).map(([Category, Amount]) => ({ Category, Amount }))
  );
  XLSX.utils.book_append_sheet(wb, incomeSheet, "Income by Category");

  const expenseSheet = XLSX.utils.json_to_sheet(
    Object.entries(report.expenses.byCategory).map(([Category, Amount]) => ({ Category, Amount }))
  );
  XLSX.utils.book_append_sheet(wb, expenseSheet, "Expenses by Category");

  const carLogRows = [
    ...report.carLogEntries.fuel.map((l) => ({
      Date: formatDate(l.date),
      Type: "Fuel",
      Description: l.station ?? "",
      Cost: l.totalCost,
    })),
    ...report.carLogEntries.maintenance.map((l) => ({
      Date: formatDate(l.date),
      Type: l.type,
      Description: l.shop ?? "",
      Cost: l.cost,
    })),
    ...report.carLogEntries.repair.map((l) => ({
      Date: formatDate(l.date),
      Type: "Repair",
      Description: l.description,
      Cost: l.cost,
    })),
  ];
  const carLogSheet = XLSX.utils.json_to_sheet(carLogRows);
  XLSX.utils.book_append_sheet(wb, carLogSheet, "Car Logs");

  const budgetSheet = XLSX.utils.json_to_sheet(
    report.budgets.map((b) => ({
      Category: b.category,
      Budgeted: b.budgeted,
      Spent: b.spent,
      Remaining: b.remaining,
      Status: b.status,
    }))
  );
  XLSX.utils.book_append_sheet(wb, budgetSheet, "Budget Performance");

  XLSX.writeFile(wb, `SentraTrack-${report.month.replace(" ", "-")}.xlsx`);
}
