"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

export interface TrendDatum {
  month: string;
  income: number;
  expenses: number;
}

export function IncomeExpenseTrend({ data }: { data: TrendDatum[] }) {
  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-medium text-text-secondary">Income vs Expense Trend</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              width={80}
              tickFormatter={(value: number) => formatCurrency(value)}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 13 }}
              formatter={(value) => (value === "income" ? "Income" : "Expenses")}
            />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
