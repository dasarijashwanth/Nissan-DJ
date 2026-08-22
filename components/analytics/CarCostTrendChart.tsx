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
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
                width={64}
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value, name) => [formatCurrency(Number(value)), SERIES_LABEL[String(name)] ?? name]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--chart-grid)",
                  backgroundColor: "var(--chart-tooltip-bg)",
                  fontSize: 13,
                }}
                labelStyle={{ color: "var(--text-primary)" }}
                itemStyle={{ color: "var(--text-secondary)" }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} formatter={(value) => SERIES_LABEL[value] ?? value} />
              <Area type="monotone" dataKey="fuel" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
              <Area type="monotone" dataKey="maintenance" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
              <Area type="monotone" dataKey="repair" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
              <Area type="monotone" dataKey="insurance" stackId="1" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text-secondary">Cost per Mile Trend</p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={costPerMileTrend}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
                width={56}
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value) => `${formatCurrency(Number(value))} / mi`}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--chart-grid)",
                  backgroundColor: "var(--chart-tooltip-bg)",
                  fontSize: 13,
                }}
                labelStyle={{ color: "var(--text-primary)" }}
                itemStyle={{ color: "var(--text-secondary)" }}
              />
              <Line type="monotone" dataKey="costPerMile" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
