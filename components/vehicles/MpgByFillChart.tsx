"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { buildSimpleFuelSegments } from "@/lib/vehicleUtils";
import { formatMiles } from "@/lib/utils";
import type { FuelLog } from "@/lib/types";

export function MpgByFillChart({ fuelLogs }: { fuelLogs: FuelLog[] }) {
  const data = buildSimpleFuelSegments(fuelLogs)
    .filter((s) => s.mpg != null)
    .map((s) => ({
      // log.date is a UTC-midnight boundary; pin the formatter to UTC too, or a browser in a
      // timezone behind UTC would display it as the day before.
      date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
        new Date(s.log.date)
      ),
      odometer: s.log.odometer,
      mpg: Number(s.mpg!.toFixed(1)),
      miles: s.miles,
      gallons: s.gallons,
    }));

  if (data.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="mb-4">
        <p className="text-sm font-medium text-text-secondary">MPG per Fill-up</p>
        <p className="text-xs text-text-muted">
          Every fill shown individually, including partial top-offs — may differ from Avg/Best/Worst
          MPG elsewhere, which merge partial fills into the next full tank.
        </p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              width={40}
              tickFormatter={(value: number) => value.toFixed(0)}
            />
            <Tooltip
              cursor={{ fill: "var(--chart-cursor)" }}
              formatter={(value, name, item) => {
                const p = item.payload as { miles: number; gallons: number };
                return [`${value} MPG (${formatMiles(p.miles)} / ${p.gallons.toFixed(2)} gal)`, "MPG"];
              }}
              labelFormatter={(_, payload) => {
                const odometer = (payload?.[0]?.payload as { odometer?: number } | undefined)?.odometer;
                return odometer != null ? `${formatMiles(odometer)} odometer` : "";
              }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--chart-grid)",
                backgroundColor: "var(--chart-tooltip-bg)",
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--text-primary)" }}
              itemStyle={{ color: "var(--text-secondary)" }}
            />
            <Bar dataKey="mpg" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
