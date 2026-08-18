import type { CSSProperties } from "react";
import { PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function SavingsRateCard({ rate, style }: { rate: number; style?: CSSProperties }) {
  const color = rate > 20 ? "text-emerald-600" : rate >= 10 ? "text-amber-600" : "text-red-600";
  const iconBg = rate > 20 ? "bg-emerald-50" : rate >= 10 ? "bg-amber-50" : "bg-red-50";

  return (
    <Card className="p-5" style={style}>
      <div className="flex items-center gap-3">
        <div className={cn("flex size-10 items-center justify-center rounded-lg", iconBg, color)}>
          <PiggyBank className="size-5" />
        </div>
        <p className="text-sm font-medium text-text-muted">Savings Rate</p>
      </div>
      <p className={cn("mt-4 text-2xl font-semibold tabular-nums", color)}>{rate.toFixed(1)}%</p>
    </Card>
  );
}
