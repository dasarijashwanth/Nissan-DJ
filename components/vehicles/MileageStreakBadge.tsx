import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function MileageStreakBadge({ streak, className }: { streak: number; className?: string }) {
  if (streak <= 0) {
    return <span className={cn("text-xs font-medium text-text-muted", className)}>Start a new streak today!</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold text-amber-600", className)}>
      <Flame className="size-3.5 fill-amber-500 text-amber-500" />
      {streak} day logging streak
    </span>
  );
}
