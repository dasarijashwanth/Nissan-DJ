import { cn } from "@/lib/utils";

function getProgressColor(spent: number, budget: number) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  if (pct >= 100) return "bg-red-600";
  if (pct >= 90) return "bg-red-400";
  if (pct >= 70) return "bg-amber-400";
  return "bg-green-500";
}

export function BudgetProgressBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn("h-full rounded-full transition-all", getProgressColor(spent, budget))}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}
