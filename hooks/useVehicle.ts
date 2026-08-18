"use client";

import { useContext } from "react";
import { VehicleContext } from "@/contexts/VehicleContext";

export function useVehicle() {
  return useContext(VehicleContext);
}
