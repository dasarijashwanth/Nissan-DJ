"use client";

import type { CSSProperties } from "react";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useCountUp } from "@/hooks/useCountUp";
import { cn, formatCurrency } from "@/lib/utils";

export interface SummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

const STATS = [
  {
    key: "income" as const,
    label: "Total Income",
    icon: TrendingUp,
    iconClass: "bg-emerald-50 text-emerald-600",
    valueClass: "text-emerald-600",
    accentColor: "var(--color-income)",
  },
  {
    key: "expenses" as const,
    label: "Total Expenses",
    icon: TrendingDown,
    iconClass: "bg-red-50 text-red-600",
    valueClass: "text-red-600",
    accentColor: "var(--color-expense)",
  },
  {
    key: "net" as const,
    label: "Net Balance",
    icon: Wallet,
    iconClass: "bg-indigo-50 text-indigo-600",
    valueClass: "text-indigo-600",
    accentColor: "var(--color-primary)",
  },
];

export function SummaryCards({ totalIncome, totalExpenses, netBalance }: SummaryCardsProps) {
  const animatedValues = {
    income: useCountUp(totalIncome),
    expenses: useCountUp(totalExpenses),
    net: useCountUp(netBalance),
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STATS.map((stat, i) => (
        <Card
          key={stat.key}
          className="card-stat p-5"
          style={{ "--card-accent-color": stat.accentColor, animationDelay: `${i * 60}ms` } as CSSProperties}
        >
          <div className="flex items-center gap-3">
            <div className={cn("flex size-10 items-center justify-center rounded-lg", stat.iconClass)}>
              <stat.icon className="size-5" />
            </div>
            <p className="text-sm font-medium text-text-muted">{stat.label}</p>
          </div>
          <p className={cn("amount-display mt-4 text-2xl font-semibold tabular-nums", stat.valueClass)}>
            {formatCurrency(animatedValues[stat.key])}
          </p>
        </Card>
      ))}
    </div>
  );
}
