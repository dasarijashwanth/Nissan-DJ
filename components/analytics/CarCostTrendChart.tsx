"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

export interface CarCostMonthDatum {
  month: string;
  fuel: number;
  maintenance: number;
  repair: number;
  insurance: number;
}

export interface CostPerMileDatum {
  month: string;
  costPerMile: number;
}

const SERIES_LABEL: Record<string, string> = {
  fuel: "Fuel",
  maintenance: "Maintenance",
  repair: "Repair",
  insurance: "Insurance",
};

export function CarCostTrendChart({
  monthlyCosts,
  costPerMileTrend,
}: {
  monthlyCosts: CarCostMonthDatum[];
  costPerMileTrend: CostPerMileDatum[];
}) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text-secondary">Car Cost by Category</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyCosts}>
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
                formatter={(value, name) => [formatCurrency(Number(value)), SERIES_LABEL[String(name)] ?? name]}
                contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} formatter={(value) => SERIES_LABEL[value] ?? value} />
              <Area type="monotone" dataKey="fuel" stackId="1" stroke="#f59e0b" fill="#fde68a" />
              <Area type="monotone" dataKey="maintenance" stackId="1" stroke="#10b981" fill="#a7f3d0" />
              <Area type="monotone" dataKey="repair" stackId="1" stroke="#ef4444" fill="#fecaca" />
              <Area type="monotone" dataKey="insurance" stackId="1" stroke="#4f46e5" fill="#c7d2fe" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text-secondary">Cost per Mile Trend</p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={costPerMileTrend}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                width={56}
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value) => `${formatCurrency(Number(value))} / mi`}
                contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
              />
              <Line type="monotone" dataKey="costPerMile" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
