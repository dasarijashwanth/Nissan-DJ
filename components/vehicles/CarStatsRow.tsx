import type { CSSProperties } from "react";
import { Wallet, Fuel, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CostPerMileCard } from "@/components/vehicles/CostPerMileCard";
import { formatCurrency } from "@/lib/utils";

export interface CarStatsRowProps {
  totalSpend: number;
  costPerMile: number;
  totalMiles: number;
  avgMPG: number;
  monthCost: number;
}

export function CarStatsRow({ totalSpend, costPerMile, totalMiles, avgMPG, monthCost }: CarStatsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-5" style={{ animationDelay: "0ms" } as CSSProperties}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Wallet className="size-5" />
          </div>
          <p className="text-sm font-medium text-text-muted">Total Car Spend</p>
        </div>
        <p className="mt-4 text-2xl font-semibold tabular-nums text-amber-600">
          {formatCurrency(totalSpend)}
        </p>
      </Card>

      <CostPerMileCard
        costPerMile={costPerMile}
        totalMiles={totalMiles}
        style={{ animationDelay: "60ms" } as CSSProperties}
      />

      <Card className="p-5" style={{ animationDelay: "120ms" } as CSSProperties}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Fuel className="size-5" />
          </div>
          <p className="text-sm font-medium text-text-muted">Avg MPG</p>
        </div>
        <p className="mt-4 text-2xl font-semibold tabular-nums text-amber-600">
          {avgMPG > 0 ? avgMPG.toFixed(1) : "—"}
        </p>
      </Card>

      <Card className="p-5" style={{ animationDelay: "180ms" } as CSSProperties}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <CalendarClock className="size-5" />
          </div>
          <p className="text-sm font-medium text-text-muted">This Month</p>
        </div>
        <p className="mt-4 text-2xl font-semibold tabular-nums text-amber-600">
          {formatCurrency(monthCost)}
        </p>
      </Card>
    </div>
  );
}
