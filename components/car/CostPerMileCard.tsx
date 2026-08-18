import { Route } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function CostPerMileCard({ costPerMile, totalMiles }: { costPerMile: number; totalMiles: number }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Route className="size-5" />
        </div>
        <p className="text-sm font-medium text-slate-500">Cost / Mile</p>
      </div>
      <p className="mt-4 text-2xl font-semibold tabular-nums text-amber-600">
        ${costPerMile.toFixed(2)} <span className="text-sm font-normal text-slate-400">/ mile</span>
      </p>
      <p className="mt-1 text-xs text-slate-400">{totalMiles.toLocaleString()} miles driven</p>
    </Card>
  );
}
