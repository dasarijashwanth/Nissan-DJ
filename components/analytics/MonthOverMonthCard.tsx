"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { calcMoMChange } from "@/lib/analyticsUtils";

export interface MonthOverMonthDatum {
  category: string;
  current: number;
  previous: number;
}

export function MonthOverMonthCard({ data }: { data: MonthOverMonthDatum[] }) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => {
    const { percentage } = calcMoMChange(d.current, d.previous);
    const rounded = Math.round(percentage);
    return { ...d, changeLabel: `${rounded > 0 ? "+" : ""}${rounded}%` };
  });

  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-medium text-text-secondary">Month over Month by Category</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              width={64}
              tickFormatter={(value: number) => formatCurrency(value)}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--chart-grid)",
                backgroundColor: "var(--chart-tooltip-bg)",
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--text-primary)" }}
              itemStyle={{ color: "var(--text-secondary)" }}
            />
            <Bar dataKey="previous" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={24} name="Previous month" />
            <Bar dataKey="current" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={24} name="Current month">
              <LabelList dataKey="changeLabel" position="top" style={{ fontSize: 11, fill: "var(--chart-axis)" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
