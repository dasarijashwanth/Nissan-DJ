"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatMiles } from "@/lib/utils";

export interface WeeklyMilesDatum {
  week: string;
  milesDriven: number;
}

export function WeeklyMilesChart({ data }: { data: WeeklyMilesDatum[] }) {
  const hasData = data.some((d) => d.milesDriven > 0);
  if (!hasData) return null;

  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-medium text-text-secondary">Weekly Miles Traveled</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              width={50}
              tickFormatter={(value: number) => Math.round(value).toLocaleString()}
            />
            <Tooltip
              cursor={{ fill: "var(--chart-cursor)" }}
              formatter={(value) => formatMiles(Number(value))}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--chart-grid)",
                backgroundColor: "var(--chart-tooltip-bg)",
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--text-primary)" }}
              itemStyle={{ color: "var(--text-secondary)" }}
            />
            <Bar dataKey="milesDriven" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
