import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn, formatCurrency } from "@/lib/utils";
import { calcMoMChange } from "@/lib/analyticsUtils";

export interface CategoryBreakdownRow {
  category: string;
  amount: number;
  percentage: number;
  previousAmount: number;
}

export function CategoryBreakdownTable({ rows }: { rows: CategoryBreakdownRow[] }) {
  if (rows.length === 0) {
    return (
      <Card className="flex h-72 items-center justify-center p-5 text-sm text-slate-500">
        No spending data for this period.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">% of Total</th>
              <th className="px-4 py-3 text-right">vs Last Month</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const { percentage: change, direction } = calcMoMChange(row.amount, row.previousAmount);
              return (
                <tr
                  key={row.category}
                  className={cn(
                    "border-b border-slate-100 last:border-0 hover:bg-slate-50",
                    i < 3 && "bg-amber-50/40"
                  )}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{row.category}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                    {row.percentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 tabular-nums",
                        direction === "up" ? "text-red-600" : direction === "down" ? "text-emerald-600" : "text-slate-400"
                      )}
                    >
                      {direction === "up" && <ArrowUp className="size-3" />}
                      {direction === "down" && <ArrowDown className="size-3" />}
                      {direction === "flat" && <Minus className="size-3" />}
                      {Math.abs(change).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
