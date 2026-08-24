"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatINR } from "@/lib/utils";

const COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

export function IndiaTransferByRecipientChart({ data }: { data: { recipient: string; amount: number }[] }) {
  // A single recipient renders as one full circle — not informative, so only show once there's
  // something to actually compare.
  if (data.length < 2) return null;

  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-medium text-text-secondary">By Recipient</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="amount" nameKey="recipient" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={entry.recipient} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [formatINR(Number(value)), name]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--chart-grid)",
                backgroundColor: "var(--chart-tooltip-bg)",
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--text-primary)" }}
              itemStyle={{ color: "var(--text-secondary)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-text-secondary">
        {data.map((d, i) => (
          <li key={d.recipient} className="flex items-center gap-1.5 truncate">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="truncate">{d.recipient}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
