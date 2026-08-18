"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

export function SpendingDonutChart({ data }: { data: { category: string; amount: number }[] }) {
  if (data.length === 0) {
    return (
      <Card className="flex h-72 items-center justify-center p-5 text-sm text-slate-500">
        No spending data for this period.
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-medium text-slate-700">Spending by Category</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [formatCurrency(Number(value)), name]}
              contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
        {data.map((d, i) => (
          <li key={d.category} className="flex items-center gap-1.5 truncate">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="truncate">{d.category}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
