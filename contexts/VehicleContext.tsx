"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { Vehicle } from "@/lib/types";

const ACTIVE_VEHICLE_STORAGE_KEY = "dj-ledger-active-vehicle";

type VehicleContextType = {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  setActiveVehicle: (vehicle: Vehicle) => void;
  isLoading: boolean;
  refetch: () => void;
};

export const VehicleContext = createContext<VehicleContextType>({
  vehicles: [],
  activeVehicle: null,
  setActiveVehicle: () => {},
  isLoading: true,
  refetch: () => {},
});

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicle, setActiveVehicleState] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/vehicles");
      if (!res.ok) return;
      const data = (await res.json()) as Vehicle[];
      setVehicles(data);

      const storedId = localStorage.getItem(ACTIVE_VEHICLE_STORAGE_KEY);
      const stored = storedId ? data.find((v) => v.id === storedId) : undefined;
      const primary = data.find((v) => v.isPrimary);
      setActiveVehicleState((current) => {
        const stillValid = current && data.find((v) => v.id === current.id);
        return stillValid ?? stored ?? primary ?? data[0] ?? null;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      load();
    });
    return () => cancelAnimationFrame(raf);
  }, [load]);

  function setActiveVehicle(vehicle: Vehicle) {
    setActiveVehicleState(vehicle);
    localStorage.setItem(ACTIVE_VEHICLE_STORAGE_KEY, vehicle.id);
  }

  return (
    <VehicleContext.Provider value={{ vehicles, activeVehicle, setActiveVehicle, isLoading, refetch: load }}>
      {children}
    </VehicleContext.Provider>
  );
}
