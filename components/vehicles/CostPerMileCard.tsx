import type { CSSProperties } from "react";
import { Route } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AnimatedAmount } from "@/components/ui/AnimatedAmount";

export function CostPerMileCard({
  costPerMile,
  totalMiles,
  style,
}: {
  costPerMile: number;
  totalMiles: number;
  style?: CSSProperties;
}) {
  return (
    <Card className="p-5" style={style}>
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/12 text-amber-600 dark:text-amber-400">
          <Route className="size-5" />
        </div>
        <p className="text-sm font-medium text-text-muted">Cost / Mile</p>
      </div>
      <p className="mt-4 text-2xl font-semibold tabular-nums text-amber-600">
        <AnimatedAmount value={costPerMile} formatType="usd" />{" "}
        <span className="text-sm font-normal text-text-muted">/ mile</span>
      </p>
      <p className="mt-1 text-xs text-text-muted">
        <AnimatedAmount value={totalMiles} formatType="miles" /> driven
      </p>
    </Card>
  );
}
