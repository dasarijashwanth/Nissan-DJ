import type { CSSProperties } from "react";
import { Car } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AnimatedAmount } from "@/components/ui/AnimatedAmount";

export interface WeeklyMileageCardProps {
  milesThisWeek: number;
  avgPerDay: number;
  fuelCostThisWeek: number;
  style?: CSSProperties;
}

export function WeeklyMileageCard({ milesThisWeek, avgPerDay, fuelCostThisWeek, style }: WeeklyMileageCardProps) {
  return (
    <Card
      className="card-stat p-5"
      style={{ "--card-accent-color": "var(--color-accent)", ...style } as CSSProperties}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
        <Car className="size-4 text-accent" />
        This week
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-text-primary">
        <AnimatedAmount value={milesThisWeek} formatType="integer" />{" "}
        <span className="text-sm font-normal text-text-muted">mi</span>
      </p>
      <p className="mt-1 text-xs text-text-muted">
        Avg: <AnimatedAmount value={avgPerDay} formatType="decimal1" /> mi/day
      </p>
      <p className="text-xs text-text-muted">
        Fuel cost: <AnimatedAmount value={fuelCostThisWeek} formatType="usd" />
      </p>
    </Card>
  );
}
