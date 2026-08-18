"use client";

import { useMemo, useState } from "react";
import { Fuel, Plus } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FuelLogForm } from "@/components/car/FuelLogForm";
import { calcAvgMPG, calcFillMPG } from "@/lib/carUtils";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { FuelLog } from "@/lib/types";

export function FuelLogTable({ fuelLogs, carId }: { fuelLogs: FuelLog[]; carId: string }) {
  const [formOpen, setFormOpen] = useState(false);

  const chronological = useMemo(
    () => [...fuelLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [fuelLogs]
  );

  const mpgById = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 1; i < chronological.length; i++) {
      map.set(
        chronological[i].id,
        calcFillMPG(chronological[i].odometer, chronological[i - 1].odometer, chronological[i].gallons)
      );
    }
    return map;
  }, [chronological]);

  const previousOdometer = fuelLogs.length > 0 ? Math.max(...fuelLogs.map((l) => l.odometer)) : 0;
  const avgMPG = calcAvgMPG(fuelLogs);
  const fillMPGs = [...mpgById.values()].filter((v) => v > 0);
  const bestMPG = fillMPGs.length > 0 ? Math.max(...fillMPGs) : 0;
  const worstMPG = fillMPGs.length > 0 ? Math.min(...fillMPGs) : 0;
  const totalSpent = fuelLogs.reduce((sum, l) => sum + l.totalCost, 0);

  const chartData = chronological
    .filter((l) => mpgById.has(l.id))
    .map((l) => ({ date: formatDate(l.date), mpg: Number(mpgById.get(l.id)!.toFixed(1)) }));

  if (fuelLogs.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-50">
            <Fuel className="size-6 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-slate-700">No fuel logs yet</p>
          <p className="max-w-xs text-sm text-slate-500">
            Log your first fill-up to start tracking MPG and fuel spend.
          </p>
          <Button onClick={() => setFormOpen(true)} className="mt-2 bg-amber-500 hover:bg-amber-600">
            <Plus className="size-4" />
            Log Fuel
          </Button>
        </Card>
        <FuelLogForm
          key={formOpen ? "open" : "closed"}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          carId={carId}
          previousOdometer={previousOdometer}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryStat label="Avg MPG" value={avgMPG > 0 ? avgMPG.toFixed(1) : "—"} />
        <SummaryStat label="Best MPG" value={bestMPG > 0 ? bestMPG.toFixed(1) : "—"} />
        <SummaryStat label="Worst MPG" value={worstMPG > 0 ? worstMPG.toFixed(1) : "—"} />
        <SummaryStat label="Total Spent" value={formatCurrency(totalSpent)} />
      </div>

      {chartData.length > 0 && (
        <Card className="p-5">
          <p className="mb-4 text-sm font-medium text-slate-700">MPG Trend</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} width={40} />
                <Tooltip
                  formatter={(value) => `${value} MPG`}
                  contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
                />
                <Line type="monotone" dataKey="mpg" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="size-4" />
          Log Fuel
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Station</th>
                <th className="px-4 py-3 text-right">Gallons</th>
                <th className="px-4 py-3 text-right">Price/gal</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Odometer</th>
                <th className="px-4 py-3 text-right">MPG</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{formatDate(l.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{l.station || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.gallons.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">${l.pricePerGallon.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatCurrency(l.totalCost)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                    {l.odometer.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                    {mpgById.has(l.id) ? mpgById.get(l.id)!.toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <FuelLogForm
        key={formOpen ? "open" : "closed"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        carId={carId}
        previousOdometer={previousOdometer}
      />
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-amber-600 tabular-nums">{value}</p>
    </Card>
  );
}
