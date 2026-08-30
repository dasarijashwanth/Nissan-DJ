import { Card } from "@/components/ui/Card";
import { buildFuelSegments } from "@/lib/vehicleUtils";
import { formatDate, formatMiles } from "@/lib/utils";
import type { FuelLog } from "@/lib/types";

/** Read-only list of every per-fill odometer reading — including partial top-offs, which don't get their own bar on the MPG chart. */
export function FuelOdometerList({ fuelLogs }: { fuelLogs: FuelLog[] }) {
  const sorted = [...fuelLogs]
    .filter((l) => l.type === "per_fill")
    .sort((a, b) => a.odometer - b.odometer);

  if (sorted.length === 0) return null;

  const mpgById = new Map<string, number>();
  for (const s of buildFuelSegments(fuelLogs)) {
    if (s.mpg != null) mpgById.set(s.log.id, s.mpg);
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-black/[0.08] p-4">
        <p className="text-sm font-medium text-text-secondary">Odometer at Every Fill-up</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.08] text-left text-xs font-medium uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Odometer</th>
              <th className="px-4 py-3 text-right">Gallons</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">MPG</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((l) => (
              <tr key={l.id} className="border-b border-black/[0.08] last:border-0 hover:bg-black/[0.04]">
                <td className="px-4 py-3 text-text-muted">{formatDate(l.date)}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-text-primary">
                  {formatMiles(l.odometer)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text-muted">{l.gallons.toFixed(2)}</td>
                <td className="px-4 py-3">
                  {l.isFullTank ? (
                    <span className="rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                      Full
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">
                      Partial
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text-muted">
                  {mpgById.has(l.id) ? mpgById.get(l.id)!.toFixed(1) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
