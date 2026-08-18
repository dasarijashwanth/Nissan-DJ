import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { MonthlyReport } from "@/lib/types";

const INDIGO: [number, number, number] = [79, 70, 229];
const AMBER: [number, number, number] = [245, 158, 11];

export function generatePdfReport(report: MonthlyReport, userEmail: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Page 1 — Cover
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("SentraTrack", pageWidth / 2, 80, { align: "center" });
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("Monthly Financial Report", pageWidth / 2, 95, { align: "center" });
  doc.setFontSize(14);
  doc.text(report.month, pageWidth / 2, 110, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${formatDate(new Date())}`, pageWidth / 2, 130, { align: "center" });
  doc.text(userEmail, pageWidth / 2, 137, { align: "center" });
  doc.setTextColor(0);

  // Page 2 — Financial Summary
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Summary", 14, 20);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Income: ${formatCurrency(report.income.total)}`, 14, 32);
  doc.text(`Expenses: ${formatCurrency(report.expenses.total)}`, 14, 39);
  doc.text(`Net Savings: ${formatCurrency(report.netSavings)}`, 14, 46);
  doc.text(`Savings Rate: ${report.savingsRate.toFixed(1)}%`, 14, 53);

  const categories = [
    ...new Set([...Object.keys(report.income.byCategory), ...Object.keys(report.expenses.byCategory)]),
  ];
  const categoryRows = categories.map((category) => {
    const income = report.income.byCategory[category] ?? 0;
    const expense = report.expenses.byCategory[category] ?? 0;
    return [category, formatCurrency(income), formatCurrency(expense), formatCurrency(income - expense)];
  });

  autoTable(doc, {
    startY: 62,
    head: [["Category", "Income", "Expense", "Net"]],
    body: categoryRows,
    headStyles: { fillColor: INDIGO },
  });

  // Page 3 — Expense Breakdown
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Expense Breakdown", 14, 20);

  const sortedExpenses = [...report.expenses.transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  autoTable(doc, {
    startY: 28,
    head: [["Date", "Title", "Category", "Amount"]],
    body: sortedExpenses.map((t) => [formatDate(t.date), t.title, t.category, formatCurrency(t.amount)]),
    headStyles: { fillColor: INDIGO },
  });

  // Page 4 — Car Report
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Car Report (2015 Nissan Sentra)", 14, 20);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Fuel: ${formatCurrency(report.carCosts.fuel)}`, 14, 32);
  doc.text(`Maintenance: ${formatCurrency(report.carCosts.maintenance)}`, 14, 39);
  doc.text(`Repairs: ${formatCurrency(report.carCosts.repairs)}`, 14, 46);
  doc.text(`Insurance: ${formatCurrency(report.carCosts.insurance)}`, 14, 53);
  doc.text(`Cost per Mile: $${report.carCosts.costPerMile.toFixed(2)}`, 14, 60);

  const carLogRows = [
    ...report.carLogEntries.fuel.map((l) => ({
      date: l.date,
      row: [formatDate(l.date), "Fuel", l.station ?? "—", formatCurrency(l.totalCost)],
    })),
    ...report.carLogEntries.maintenance.map((l) => ({
      date: l.date,
      row: [formatDate(l.date), l.type, l.shop ?? "—", formatCurrency(l.cost)],
    })),
    ...report.carLogEntries.repair.map((l) => ({
      date: l.date,
      row: [formatDate(l.date), l.description, l.shop ?? "—", formatCurrency(l.cost)],
    })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((r) => r.row);

  autoTable(doc, {
    startY: 68,
    head: [["Date", "Type", "Shop / Station", "Cost"]],
    body: carLogRows,
    headStyles: { fillColor: AMBER },
  });

  // Page 5 — Budget Performance
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Budget Performance", 14, 20);

  autoTable(doc, {
    startY: 28,
    head: [["Category", "Budgeted", "Spent", "Remaining", "Status"]],
    body: report.budgets.map((b) => [
      b.category,
      formatCurrency(b.budgeted),
      formatCurrency(b.spent),
      formatCurrency(b.remaining),
      b.status.replace("_", " "),
    ]),
    headStyles: { fillColor: INDIGO },
  });

  doc.save(`SentraTrack-${report.month.replace(" ", "-")}.pdf`);
}
