"use client";

import { useEffect, useState } from "react";
import { TransactionForm } from "@/components/TransactionForm";
import { FuelLogForm } from "@/components/car/FuelLogForm";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export function GlobalShortcuts({ carId, currentOdometer }: { carId: string; currentOdometer: number }) {
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [fuelOpen, setFuelOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setTransactionOpen(true);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setFuelOpen(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <TransactionForm
        key={transactionOpen ? "transaction-open" : "transaction-closed"}
        open={transactionOpen}
        onClose={() => setTransactionOpen(false)}
      />
      <FuelLogForm
        key={fuelOpen ? "fuel-open" : "fuel-closed"}
        open={fuelOpen}
        onClose={() => setFuelOpen(false)}
        carId={carId}
        previousOdometer={currentOdometer}
      />
    </>
  );
}
