import { Lightbulb, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { FuelEfficiencyInsight } from "@/lib/vehicleUtils";

const DROP_TIPS = [
  "Check tire pressure — under-inflated tires can cost 1-3% MPG per 1 psi low.",
  "Stay current on oil changes and air filter swaps — a clogged filter makes the engine work harder.",
  "Ease off aggressive acceleration and braking — smooth, gradual driving uses noticeably less fuel.",
];

const STEADY_TIPS = [
  "Use cruise control on the highway to hold a steady speed instead of speeding up and slowing down.",
  "Remove unused roof racks, cargo boxes, or excess trunk weight — both add drag and weight.",
  "Avoid long idling — restarting the engine uses less fuel than idling more than ~30 seconds.",
];

export function FuelEfficiencyInsights({ insight }: { insight: FuelEfficiencyInsight }) {
  if (insight.latestMPG == null) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <Lightbulb className="size-4 text-amber-500" />
          Efficiency Insights
        </div>
        <p className="mt-3 text-sm text-text-muted">
          Log a couple more fill-ups to start seeing MPG trends and tips here.
        </p>
      </Card>
    );
  }

  if (insight.avgMPG == null) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <Lightbulb className="size-4 text-amber-500" />
          Efficiency Insights
        </div>
        <p className="mt-3 text-sm font-medium text-text-primary">
          Your last fill got {insight.latestMPG.toFixed(1)} MPG.
        </p>
        <p className="mt-1 text-sm text-text-muted">Log one more fill-up to see how this compares to your average.</p>
      </Card>
    );
  }

  const delta = insight.deltaPercent;
  const isUp = delta != null && delta >= 5;
  const isDown = delta != null && delta <= -10;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const tips = isDown ? DROP_TIPS : STEADY_TIPS;

  const headline = isUp
    ? `Your last fill got ${insight.latestMPG.toFixed(1)} MPG — ${Math.abs(delta!).toFixed(0)}% above your ${insight.avgMPG.toFixed(1)} MPG average. Nice.`
    : isDown
      ? `Your last fill got ${insight.latestMPG.toFixed(1)} MPG — ${Math.abs(delta!).toFixed(0)}% below your ${insight.avgMPG.toFixed(1)} MPG average.`
      : `Your last fill got ${insight.latestMPG.toFixed(1)} MPG — right around your ${insight.avgMPG.toFixed(1)} MPG average.`;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
        <Lightbulb className="size-4 text-amber-500" />
        Efficiency Insights
      </div>

      <div
        className={cn(
          "mt-3 flex items-start gap-2 text-sm font-medium",
          isUp ? "text-emerald-600" : isDown ? "text-red-600" : "text-text-primary"
        )}
      >
        <Icon className="mt-0.5 size-4 shrink-0" />
        <p>{headline}</p>
      </div>

      <div className="mt-4 border-t border-black/[0.08] pt-4">
        <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
          {isDown ? "Ways to bring it back up" : "Keep it up with these habits"}
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="text-amber-500">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
