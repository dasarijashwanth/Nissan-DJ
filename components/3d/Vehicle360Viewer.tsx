"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { Loader } from "@react-three/drei";
import * as THREE from "three";
import { ChevronLeft, RotateCw, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CarPart } from "@/lib/vehicle3dParts";
import { Vehicle360Scene, type ViewMode } from "@/components/3d/Vehicle360Scene";
import { PostProcessing } from "@/components/3d/PostProcessing";
import { PartInfoPanel } from "@/components/3d/PartInfoPanel";

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "exterior", label: "Exterior" },
  { key: "engine", label: "Engine" },
  { key: "interior", label: "Interior" },
  { key: "undercarriage", label: "Undercarriage" },
];

function ViewModeTabs({ current, onChange }: { current: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    // Pushed below the back link on mobile — the 4-label pill needs enough width that, centered,
    // its left edge would otherwise sit under the back link on narrow screens.
    <div className="absolute inset-x-0 top-16 flex justify-center px-4 sm:top-4">
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-md">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => onChange(mode.key)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
              current === mode.key ? "bg-indigo-600 text-white" : "text-white/50 hover:text-white/80"
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function IconOverlayButton({
  icon: Icon,
  active,
  onClick,
  label,
}: {
  icon: typeof RotateCw;
  active?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-10 items-center justify-center rounded-full border backdrop-blur-md transition-colors",
        active
          ? "border-indigo-400/60 bg-indigo-500/30 text-indigo-200"
          : "border-white/10 bg-black/40 text-white/60 hover:text-white/90"
      )}
    >
      <Icon className="size-4.5" />
    </button>
  );
}

export function Vehicle360Viewer({
  vehicleId,
  vehicleLabel,
  parts,
}: {
  vehicleId: string;
  vehicleLabel: string;
  parts: CarPart[];
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("exterior");
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedPart, setSelectedPart] = useState<CarPart | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function handleScreenshot() {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${vehicleLabel.trim().replace(/\s+/g, "-").toLowerCase()}-360.png`;
    link.click();
  }

  return (
    <div ref={wrapRef} style={{ width: "100%", height: "100dvh", background: "#030508", position: "relative" }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [5, 2, 7], fov: 40 }}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Suspense fallback={null}>
          <Vehicle360Scene parts={parts} viewMode={viewMode} autoRotate={autoRotate} onPartClick={setSelectedPart} />
          <PostProcessing />
        </Suspense>
      </Canvas>

      <Loader
        containerStyles={{ background: "#030508" }}
        innerStyles={{ background: "#1a1f2e" }}
        barStyles={{ background: "#4f46e5" }}
        dataStyles={{ color: "#94a3b8", fontSize: "13px" }}
        dataInterpolation={(p) => `Loading ${vehicleLabel}... ${p.toFixed(0)}%`}
      />

      <Link
        href={`/vehicles/${vehicleId}`}
        aria-label={`Back to ${vehicleLabel}`}
        className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-sm font-medium text-white/80 backdrop-blur-md hover:text-white"
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">{vehicleLabel}</span>
      </Link>

      <ViewModeTabs current={viewMode} onChange={setViewMode} />

      <div className="absolute right-4 bottom-4 flex flex-col gap-2">
        <IconOverlayButton icon={RotateCw} active={autoRotate} onClick={() => setAutoRotate((r) => !r)} label="Toggle auto-rotate" />
        <IconOverlayButton icon={Camera} onClick={handleScreenshot} label="Save photo" />
      </div>

      <div
        className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 text-xs tracking-wide text-white/25 sm:block"
        style={{ pointerEvents: "none" }}
      >
        Drag to rotate · Scroll to zoom · Tap a hotspot for details
      </div>

      <PartInfoPanel part={selectedPart} vehicleId={vehicleId} onClose={() => setSelectedPart(null)} />
    </div>
  );
}
