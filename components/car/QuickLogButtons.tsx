"use client";

import { useState } from "react";
import { Fuel, Wrench, Hammer, MapPin } from "lucide-react";
import { FuelLogForm } from "@/components/car/FuelLogForm";
import { MaintenanceForm } from "@/components/car/MaintenanceForm";
import { RepairForm } from "@/components/car/RepairForm";
import { OdometerForm } from "@/components/car/OdometerForm";

type LogKind = "fuel" | "maintenance" | "repair" | "odometer" | null;

const BUTTONS: { kind: Exclude<LogKind, null>; label: string; icon: typeof Fuel }[] = [
  { kind: "fuel", label: "Log Fuel", icon: Fuel },
  { kind: "maintenance", label: "Log Maintenance", icon: Wrench },
  { kind: "repair", label: "Log Repair", icon: Hammer },
  { kind: "odometer", label: "Log Odometer", icon: MapPin },
];

export function QuickLogButtons({
  carId,
  currentOdometer,
}: {
  carId: string;
  currentOdometer: number;
}) {
  const [open, setOpen] = useState<LogKind>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {BUTTONS.map((btn) => (
          <button
            key={btn.kind}
            onClick={() => setOpen(btn.kind)}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50"
          >
            <btn.icon className="size-6 text-amber-500" />
            {btn.label}
          </button>
        ))}
      </div>

      <FuelLogForm
        key={open === "fuel" ? "fuel-open" : "fuel-closed"}
        open={open === "fuel"}
        onClose={() => setOpen(null)}
        carId={carId}
        previousOdometer={currentOdometer}
      />
      <MaintenanceForm
        key={open === "maintenance" ? "maintenance-open" : "maintenance-closed"}
        open={open === "maintenance"}
        onClose={() => setOpen(null)}
        carId={carId}
      />
      <RepairForm
        key={open === "repair" ? "repair-open" : "repair-closed"}
        open={open === "repair"}
        onClose={() => setOpen(null)}
        carId={carId}
      />
      <OdometerForm
        key={open === "odometer" ? "odometer-open" : "odometer-closed"}
        open={open === "odometer"}
        onClose={() => setOpen(null)}
        carId={carId}
        currentOdometer={currentOdometer}
      />
    </>
  );
}
