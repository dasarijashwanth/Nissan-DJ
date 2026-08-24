"use client";

import { useMemo } from "react";
import { Bar, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { useCountUp } from "@/hooks/useCountUp";
import { formatCurrency } from "@/lib/utils";

export type WeeklyFuelTrendDatum = {
  week: string;
  cost: number;
  mpg: number;
  rollingAvgMpg: number;
};

export function FuelTrendChart({ data }: { data: WeeklyFuelTrendDatum[] }) {
  const { bestWeek, worstWeek } = useMemo(() => {
    const withMpg = data.filter((d) => d.mpg > 0);
    if (withMpg.length === 0) return { bestWeek: null, worstWeek: null };
    return {
      bestWeek: withMpg.reduce((a, b) => (b.mpg > a.mpg ? b : a)),
      worstWeek: withMpg.reduce((a, b) => (b.mpg < a.mpg ? b : a)),
    };
  }, [data]);

  const animatedBestMpg = useCountUp(bestWeek?.mpg ?? 0);
  const animatedWorstMpg = useCountUp(worstWeek?.mpg ?? 0);

  const hasData = data.some((d) => d.mpg > 0 || d.cost > 0);
  if (!hasData) return null;

  return (
    <div className="space-y-4">
      {(bestWeek || worstWeek) && (
        <div className="grid grid-cols-2 gap-4">
          {bestWeek && (
            <Card className="p-4">
              <p className="text-xs font-medium text-text-muted">Best week</p>
              <p className="mt-1 text-lg font-semibold text-emerald-600 tabular-nums">{animatedBestMpg.toFixed(1)} MPG</p>
              <p className="text-xs text-text-muted">Week of {bestWeek.week}</p>
            </Card>
          )}
          {worstWeek && (
            <Card className="p-4">
              <p className="text-xs font-medium text-text-muted">Worst week</p>
              <p className="mt-1 text-lg font-semibold text-red-500 tabular-nums">{animatedWorstMpg.toFixed(1)} MPG</p>
              <p className="text-xs text-text-muted">Week of {worstWeek.week}</p>
            </Card>
          )}
        </div>
      )}

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text-secondary">Weekly MPG Trend</p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} width={40} />
              <Tooltip
                formatter={(value, name) => [`${value} MPG`, name === "rollingAvgMpg" ? "4-week avg" : "MPG"]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--chart-grid)",
                  backgroundColor: "var(--chart-tooltip-bg)",
                  fontSize: 13,
                }}
                labelStyle={{ color: "var(--text-primary)" }}
                itemStyle={{ color: "var(--text-secondary)" }}
              />
              <Bar dataKey="mpg" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Line type="monotone" dataKey="rollingAvgMpg" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text-secondary">Weekly Fuel Cost</p>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
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
              <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
