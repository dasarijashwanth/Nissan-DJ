"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatINR, formatCurrency } from "@/lib/utils";

const COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

export function ChitFundByGroupChart({
  data,
  usdRate,
}: {
  data: { groupName: string; amount: number }[];
  usdRate: number;
}) {
  // A single chit group renders as one full circle — not informative, so only show once there's
  // something to actually compare.
  if (data.length < 2) return null;

  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-medium text-text-secondary">Total Paid per Member</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="amount" nameKey="groupName" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={entry.groupName} fill={COLORS[i % COLORS.length]} />
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
      <ul className="mt-3 divide-y divide-black/[0.08]">
        {data.map((d, i) => (
          <li key={d.groupName} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="truncate font-medium text-text-primary">{d.groupName}</span>
            </span>
            <span className="shrink-0 text-right tabular-nums">
              <span className="block font-medium text-text-primary">{formatINR(d.amount)}</span>
              <span className="block text-xs text-text-muted">≈ {formatCurrency(d.amount / usdRate)}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
