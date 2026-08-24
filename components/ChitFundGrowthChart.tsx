"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatINR } from "@/lib/utils";

export interface ChitFundGrowthDatum {
  month: string;
  total: number;
}

export function ChitFundGrowthChart({ data }: { data: ChitFundGrowthDatum[] }) {
  const hasData = data.some((d) => d.total > 0);
  if (!hasData) return null;

  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-medium text-text-secondary">Total Saved Over Time</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              tickFormatter={(value: number) => formatINR(value)}
              width={80}
            />
            <Tooltip
              formatter={(value) => [formatINR(Number(value)), "Total saved"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--chart-grid)",
                backgroundColor: "var(--chart-tooltip-bg)",
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--text-primary)" }}
              itemStyle={{ color: "var(--text-secondary)" }}
            />
            <Area type="monotone" dataKey="total" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
