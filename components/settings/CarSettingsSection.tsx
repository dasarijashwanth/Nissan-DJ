"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CarDetailsForm } from "@/components/car/CarDetailsForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Car } from "@/lib/types";

export function CarSettingsSection({ car }: { car: Car }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Car Settings</p>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-slate-500">Vehicle</p>
          <p className="mt-0.5 text-slate-900">
            {car.year} {car.make} {car.model}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Color</p>
          <p className="mt-0.5 text-slate-900">{car.color}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">License Plate</p>
          <p className="mt-0.5 text-slate-900">{car.licensePlate || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Purchase Price</p>
          <p className="mt-0.5 text-slate-900">{car.purchasePrice != null ? formatCurrency(car.purchasePrice) : "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Purchase Date</p>
          <p className="mt-0.5 text-slate-900">{car.purchaseDate ? formatDate(car.purchaseDate) : "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Starting Odometer</p>
          <p className="mt-0.5 text-slate-900">
            {car.startOdometer != null ? `${car.startOdometer.toLocaleString()} mi` : "—"}
          </p>
        </div>
      </div>

      <CarDetailsForm open={open} onClose={() => setOpen(false)} car={car} />
    </Card>
  );
}
