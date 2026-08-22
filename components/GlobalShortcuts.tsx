"use client";

import { useEffect, useState } from "react";
import { CreditCard, Fuel, MapPin, Wrench } from "lucide-react";
import { TransactionForm } from "@/components/TransactionForm";
import { FuelLogForm } from "@/components/vehicles/FuelLogForm";
import { MaintenanceForm } from "@/components/vehicles/MaintenanceForm";
import { OdometerForm } from "@/components/vehicles/OdometerForm";
import { Fab } from "@/components/ui/Fab";
import type { TrackingMode } from "@/lib/trackingMode";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export function GlobalShortcuts({
  vehicleId,
  currentOdometer,
  trackingMode = "life",
}: {
  vehicleId: string;
  currentOdometer: number;
  trackingMode?: TrackingMode;
}) {
  const isVehicleMode = trackingMode === "vehicle";
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [fuelOpen, setFuelOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [odometerOpen, setOdometerOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setTransactionOpen(true);
      } else if (isVehicleMode && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        setFuelOpen(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVehicleMode]);

  return (
    <>
      <Fab
        actions={[
          ...(isVehicleMode
            ? [
                { label: "Fuel", icon: Fuel, onClick: () => setFuelOpen(true) },
                { label: "Odometer", icon: MapPin, onClick: () => setOdometerOpen(true) },
              ]
            : []),
          { label: "Transaction", icon: CreditCard, onClick: () => setTransactionOpen(true) },
          ...(isVehicleMode ? [{ label: "Maintenance", icon: Wrench, onClick: () => setMaintenanceOpen(true) }] : []),
        ]}
      />
      <TransactionForm
        key={transactionOpen ? "transaction-open" : "transaction-closed"}
        open={transactionOpen}
        onClose={() => setTransactionOpen(false)}
      />
      {isVehicleMode && (
        <>
          <FuelLogForm
            key={fuelOpen ? "fuel-open" : "fuel-closed"}
            open={fuelOpen}
            onClose={() => setFuelOpen(false)}
            vehicleId={vehicleId}
            previousOdometer={currentOdometer}
          />
          <MaintenanceForm
            key={maintenanceOpen ? "maintenance-open" : "maintenance-closed"}
            open={maintenanceOpen}
            onClose={() => setMaintenanceOpen(false)}
            vehicleId={vehicleId}
          />
          <OdometerForm
            key={odometerOpen ? "odometer-open" : "odometer-closed"}
            open={odometerOpen}
            onClose={() => setOdometerOpen(false)}
            vehicleId={vehicleId}
            currentOdometer={currentOdometer}
          />
        </>
      )}
    </>
  );
}
