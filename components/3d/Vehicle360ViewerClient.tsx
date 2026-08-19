"use client";

import dynamic from "next/dynamic";
import type { CarPart } from "@/lib/vehicle3dParts";
import { Hero3DSkeleton } from "@/components/3d/Hero3DSkeleton";

const Vehicle360Viewer = dynamic(() => import("@/components/3d/Vehicle360Viewer").then((m) => m.Vehicle360Viewer), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100dvh", background: "#030508", display: "flex", alignItems: "center" }}>
      <Hero3DSkeleton />
    </div>
  ),
});

export function Vehicle360ViewerClient({
  vehicleId,
  vehicleLabel,
  parts,
}: {
  vehicleId: string;
  vehicleLabel: string;
  parts: CarPart[];
}) {
  return <Vehicle360Viewer vehicleId={vehicleId} vehicleLabel={vehicleLabel} parts={parts} />;
}
