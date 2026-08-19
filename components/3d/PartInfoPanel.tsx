"use client";

import Link from "next/link";
import type { CarPart } from "@/lib/vehicle3dParts";

const PART_ACTION_ROUTE: Record<string, string> = {
  engine: "maintenance",
  front_tires: "maintenance",
  rear_tires: "maintenance",
  battery: "maintenance",
  brakes: "maintenance",
  fuel_tank: "fuel",
  odometer: "mileage",
};

export function PartInfoPanel({
  part,
  vehicleId,
  onClose,
}: {
  part: CarPart | null;
  vehicleId: string;
  onClose: () => void;
}) {
  if (!part) return null;
  const actionSegment = PART_ACTION_ROUTE[part.id] ?? "maintenance";

  return (
    <div
      className="animate-slide-in-right"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "320px",
        maxWidth: "85vw",
        height: "100%",
        background: "rgba(5, 8, 16, 0.92)",
        backdropFilter: "blur(24px)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        padding: "80px 24px 24px",
        overflowY: "auto",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px",
          padding: "6px 12px",
          color: "rgba(255,255,255,0.6)",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        ✕ Close
      </button>

      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{part.icon}</div>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 600, color: "#fff", marginBottom: "12px" }}>
        {part.title}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {part.lines.map((line, i) => (
          <div key={i} style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontFamily: "Inter, sans-serif" }}>
            {line}
          </div>
        ))}
      </div>

      <Link
        href={`/vehicles/${vehicleId}/${actionSegment}`}
        style={{
          display: "block",
          width: "100%",
          marginTop: "24px",
          padding: "12px",
          background: "#4f46e5",
          borderRadius: "12px",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Log {part.name} →
      </Link>
    </div>
  );
}
