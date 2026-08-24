import type { CSSProperties } from "react";
import { PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AnimatedAmount } from "@/components/ui/AnimatedAmount";
import { cn } from "@/lib/utils";

export function SavingsRateCard({ rate, style }: { rate: number; style?: CSSProperties }) {
  const color =
    rate > 20
      ? "text-emerald-600 dark:text-emerald-400"
      : rate >= 10
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
  const iconBg = rate > 20 ? "bg-emerald-500/12" : rate >= 10 ? "bg-amber-500/12" : "bg-red-500/12";

  return (
    <Card className="p-5" style={style}>
      <div className="flex items-center gap-3">
        <div className={cn("flex size-10 items-center justify-center rounded-lg", iconBg, color)}>
          <PiggyBank className="size-5" />
        </div>
        <p className="text-sm font-medium text-text-muted">Savings Rate</p>
      </div>
      <p className={cn("mt-4 text-2xl font-semibold tabular-nums", color)}>
        <AnimatedAmount value={rate} formatType="percent1" />
      </p>
    </Card>
  );
}
