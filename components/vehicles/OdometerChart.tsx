"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatDate, formatMiles } from "@/lib/utils";
import type { OdometerLog } from "@/lib/types";

export function OdometerChart({ odometerLogs }: { odometerLogs: OdometerLog[] }) {
  if (odometerLogs.length < 2) return null;

  const data = [...odometerLogs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((l) => ({ date: formatDate(l.date), miles: l.miles }));

  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-medium text-text-secondary">Odometer History</p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              width={56}
              tickFormatter={(value: number) => value.toLocaleString()}
            />
            <Tooltip
              formatter={(value) => formatMiles(Number(value))}
              contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
            />
            <Line type="monotone" dataKey="miles" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
