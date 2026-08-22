"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Fuel, Plus, Pencil } from "lucide-react";
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
import { Input } from "@/components/ui/Input";
import { FuelLogForm } from "@/components/vehicles/FuelLogForm";
import { calcAvgMPG, calcFillMPG } from "@/lib/vehicleUtils";
import { formatCurrency, formatDate, formatMiles } from "@/lib/utils";
import type { FuelLog } from "@/lib/types";

const PAGE_SIZE = 10;

export function FuelLogTable({ fuelLogs, vehicleId }: { fuelLogs: FuelLog[]; vehicleId: string }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FuelLog | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(log: FuelLog) {
    setEditing(log);
    setFormOpen(true);
  }

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

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query === "") return fuelLogs;
    return fuelLogs.filter(
      (l) => (l.station ?? "").toLowerCase().includes(query) || (l.notes ?? "").toLowerCase().includes(query)
    );
  }, [fuelLogs, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (fuelLogs.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/12">
            <Fuel className="size-6 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No fuel logs yet</p>
          <p className="max-w-xs text-sm text-text-muted">
            Log your first fill-up to start tracking MPG and fuel spend.
          </p>
          <Button onClick={openAdd} className="mt-2 bg-amber-500 hover:bg-amber-600">
            <Plus className="size-4" />
            Log Fuel
          </Button>
        </Card>
        <FuelLogForm
          key={formOpen ? (editing?.id ?? "new") : "closed"}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          vehicleId={vehicleId}
          previousOdometer={previousOdometer}
          log={editing}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryStat label="Avg MPG" value={avgMPG > 0 ? avgMPG.toFixed(1) : "—"} delayMs={0} />
        <SummaryStat label="Best MPG" value={bestMPG > 0 ? bestMPG.toFixed(1) : "—"} delayMs={60} />
        <SummaryStat label="Worst MPG" value={worstMPG > 0 ? worstMPG.toFixed(1) : "—"} delayMs={120} />
        <SummaryStat label="Total Spent" value={formatCurrency(totalSpent)} delayMs={180} />
      </div>

      {chartData.length > 0 && (
        <Card className="p-5">
          <p className="mb-4 text-sm font-medium text-text-secondary">MPG Trend</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} width={40} />
                <Tooltip
                  formatter={(value) => `${value} MPG`}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--chart-grid)",
                    backgroundColor: "var(--chart-tooltip-bg)",
                    fontSize: 13,
                  }}
                  labelStyle={{ color: "var(--text-primary)" }}
                  itemStyle={{ color: "var(--text-secondary)" }}
                />
                <Line type="monotone" dataKey="mpg" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          type="search"
          placeholder="Search station or notes..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-56"
        />
        <Button onClick={openAdd} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="size-4" />
          Log Fuel
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-muted">No fuel logs match your search.</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.08] text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Station</th>
                <th className="px-4 py-3 text-right">Gallons</th>
                <th className="px-4 py-3 text-right">Price/gal</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Odometer</th>
                <th className="px-4 py-3 text-right">MPG</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((l) => {
                const isWeekly = l.type === "weekly_summary";
                return (
                  <tr key={l.id} className="border-b border-black/[0.08] last:border-0 hover:bg-black/[0.04]">
                    <td className="px-4 py-3 text-text-muted">
                      <div className="flex items-center gap-2">
                        {formatDate(l.date)}
                        {isWeekly && (
                          <span className="rounded-full bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
                            Weekly
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">{l.station || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {isWeekly && "~"}
                      {l.gallons.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {isWeekly && "~"}${l.pricePerGallon.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatCurrency(l.totalCost)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-muted">
                      {formatMiles(l.odometer)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-muted">
                      {mpgById.has(l.id) ? mpgById.get(l.id)!.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(l)}
                        aria-label="Edit fuel log"
                        className="rounded-md p-1.5 text-text-muted hover:bg-black/[0.06] hover:text-text-secondary"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.08] px-4 py-3">
            <p className="text-sm text-text-muted">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <FuelLogForm
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        vehicleId={vehicleId}
        previousOdometer={previousOdometer}
        log={editing}
      />
    </div>
  );
}

function SummaryStat({ label, value, delayMs }: { label: string; value: string; delayMs: number }) {
  return (
    <Card className="p-4" style={{ animationDelay: `${delayMs}ms` } as CSSProperties}>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-amber-600 tabular-nums">{value}</p>
    </Card>
  );
}
