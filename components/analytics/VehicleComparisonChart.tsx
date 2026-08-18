"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, Legend } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import type { VehicleComparisonDatum } from "@/lib/vehicleQueries";

const PALETTE = ["#f59e0b", "#4f46e5", "#10b981", "#ef4444", "#0ea5e9", "#a855f7"];

export function VehicleComparisonChart({ data }: { data: VehicleComparisonDatum[] }) {
  const spendData = useMemo(
    () => data.map((v) => ({ nickname: v.nickname, spend: v.totalSpend })),
    [data]
  );

  const mpgData = useMemo(
    () => data.filter((v) => v.avgMPG != null).map((v) => ({ nickname: v.nickname, mpg: Number(v.avgMPG!.toFixed(1)) })),
    [data]
  );

  const monthlyData = useMemo(() => {
    if (data.length === 0) return [];
    return data[0].monthlyCosts.map((_, i) => {
      const row: Record<string, string | number> = { month: data[0].monthlyCosts[i].month };
      data.forEach((v) => {
        row[v.nickname] = v.monthlyCosts[i]?.cost ?? 0;
      });
      return row;
    });
  }, [data]);

  if (data.length < 2) {
    return (
      <Card className="p-5">
        <p className="text-sm font-medium text-text-secondary">Compare Vehicles</p>
        <p className="mt-2 text-sm text-text-muted">Add another vehicle to see cost and efficiency comparisons.</p>
      </Card>
    );
  }

  const cheapest = [...data].sort((a, b) => a.costPerMile - b.costPerMile)[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((v, i) => (
          <Card key={v.vehicleId} className="p-4" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
              <p className="truncate text-sm font-medium text-text-primary">{v.nickname}</p>
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums text-text-primary">
              {v.costPerMile > 0 ? `${(v.costPerMile * 100).toFixed(1)}¢` : "—"}
              <span className="text-xs font-normal text-text-muted"> / mile</span>
            </p>
            {v.vehicleId === cheapest.vehicleId && v.costPerMile > 0 && (
              <p className="mt-1 text-xs font-medium text-emerald-600">Cheapest to run</p>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text-secondary">Total Spend by Vehicle</p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendData}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="nickname" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                width={64}
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
              />
              <Bar dataKey="spend" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {spendData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {mpgData.length > 0 && (
        <Card className="p-5">
          <p className="mb-4 text-sm font-medium text-text-secondary">Avg MPG by Vehicle</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mpgData}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="nickname" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} width={40} />
                <Tooltip
                  formatter={(value) => `${value} MPG`}
                  contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
                />
                <Bar dataKey="mpg" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {mpgData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text-secondary">Monthly Cost by Vehicle</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                width={64}
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              {data.map((v, i) => (
                <Area
                  key={v.vehicleId}
                  type="monotone"
                  dataKey={v.nickname}
                  stackId="1"
                  stroke={PALETTE[i % PALETTE.length]}
                  fill={PALETTE[i % PALETTE.length]}
                  fillOpacity={0.5}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
