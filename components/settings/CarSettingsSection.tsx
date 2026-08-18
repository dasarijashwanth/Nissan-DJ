"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { formatCurrency, formatDate, formatMiles } from "@/lib/utils";
import type { Vehicle } from "@/lib/types";

export function CarSettingsSection({ car }: { car: Vehicle }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">Car Settings</p>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-text-muted">Vehicle</p>
          <p className="mt-0.5 text-text-primary">
            {car.year} {car.make} {car.model}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted">Color</p>
          <p className="mt-0.5 text-text-primary">{car.color}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted">License Plate</p>
          <p className="mt-0.5 text-text-primary">{car.licensePlate || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted">Purchase Price</p>
          <p className="mt-0.5 text-text-primary">{car.purchasePrice != null ? formatCurrency(car.purchasePrice) : "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted">Purchase Date</p>
          <p className="mt-0.5 text-text-primary">{car.purchaseDate ? formatDate(car.purchaseDate) : "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted">Starting Odometer</p>
          <p className="mt-0.5 text-text-primary">
            {car.startOdometer != null ? formatMiles(car.startOdometer) : "—"}
          </p>
        </div>
      </div>

      <VehicleForm open={open} onClose={() => setOpen(false)} vehicle={car} />
    </Card>
  );
}
