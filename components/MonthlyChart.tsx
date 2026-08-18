"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

export interface MonthlyChartDatum {
  month: string;
  income: number;
  expense: number;
}

export function MonthlyChart({ data }: { data: MonthlyChartDatum[] }) {
  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-medium text-text-secondary">Income vs Expenses (last 6 months)</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(value: number) => formatCurrency(value)}
              width={80}
            />
            <Tooltip
              cursor={{ fill: "#f1f5f9" }}
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 13 }}
              formatter={(value) => (value === "income" ? "Income" : "Expenses")}
            />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
