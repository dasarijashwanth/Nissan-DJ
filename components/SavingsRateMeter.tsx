import { Card } from "@/components/ui/Card";

const SIZE = 96;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function SavingsRateMeter({ rate }: { rate: number }) {
  const color = rate > 20 ? "#10b981" : rate >= 10 ? "#f59e0b" : "#ef4444";
  const clamped = Math.max(0, Math.min(100, rate));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <Card className="flex items-center gap-4 p-5">
      <svg width={SIZE} height={SIZE} className="shrink-0 -rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--chart-grid)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        <text
          x={SIZE / 2}
          y={SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90"
          style={{ transformOrigin: "center", fontSize: 18, fontWeight: 600, fill: "#0f172a" }}
        >
          {rate.toFixed(0)}%
        </text>
      </svg>
      <div>
        <p className="text-sm font-medium text-text-muted">Savings Rate</p>
        <p className="text-xs text-text-muted">This month</p>
      </div>
    </Card>
  );
}
