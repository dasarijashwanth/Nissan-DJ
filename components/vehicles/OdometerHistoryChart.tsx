"use client";

import { useMemo } from "react";
import { Bar, ComposedChart, CartesianGrid, Cell, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatDate, formatMiles } from "@/lib/utils";
import type { DailyOdometer } from "@/lib/types";

function isWeekend(dateStr: string): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const dow = new Date(year, month - 1, day).getDay();
  return dow === 0 || dow === 6;
}

export function OdometerHistoryChart({ entries }: { entries: DailyOdometer[] }) {
  const data = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((entry, i) => {
      const window = sorted.slice(Math.max(0, i - 6), i + 1);
      const rollingAvg = window.reduce((sum, e) => sum + e.driven, 0) / window.length;
      return {
        rawDate: entry.date,
        date: formatDate(entry.date),
        odometer: entry.miles,
        driven: entry.driven,
        rollingAvg: Number(rollingAvg.toFixed(1)),
        weekend: isWeekend(entry.date),
      };
    });
  }, [entries]);

  if (data.length < 2) {
    return (
      <Card className="p-5">
        <p className="text-sm font-medium text-text-secondary">Mileage History</p>
        <p className="mt-2 text-sm text-text-muted">Log a few days to see your mileage trend here.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-medium text-text-secondary">Daily Mileage</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} width={40} />
            <Tooltip
              formatter={(value, name) =>
                name === "rollingAvg" ? [`${value} mi`, "7-day avg"] : [formatMiles(Number(value)), "Driven"]
              }
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--chart-grid)",
                backgroundColor: "var(--chart-tooltip-bg)",
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--text-primary)" }}
              itemStyle={{ color: "var(--text-secondary)" }}
            />
            <Bar dataKey="driven" radius={[4, 4, 0, 0]} maxBarSize={24}>
              {data.map((d) => (
                <Cell key={d.rawDate} fill={d.weekend ? "#fde68a" : "#f59e0b"} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="rollingAvg" stroke="#4f46e5" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-6 mb-2 text-sm font-medium text-text-secondary">Odometer Reading</p>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              width={56}
              tickFormatter={(value: number) => value.toLocaleString()}
            />
            <Tooltip
              formatter={(value) => [formatMiles(Number(value)), "Odometer"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--chart-grid)",
                backgroundColor: "var(--chart-tooltip-bg)",
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--text-primary)" }}
              itemStyle={{ color: "var(--text-secondary)" }}
            />
            <Line type="monotone" dataKey="odometer" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
