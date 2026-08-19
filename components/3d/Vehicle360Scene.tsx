"use client";

import { useRef, type ComponentRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, OrbitControls, MeshReflectorMaterial, SpotLight, Html } from "@react-three/drei";
import { SentraMesh } from "@/components/3d/models/SentraMesh";
import type { CarPart } from "@/lib/vehicle3dParts";

export type ViewMode = "exterior" | "engine" | "interior" | "undercarriage";

const VIEW_TARGETS: Record<ViewMode, { position: [number, number, number]; target: [number, number, number] }> = {
  exterior: { position: [5, 2, 7], target: [0, 0.3, 0] },
  engine: { position: [3.3, 1.5, 1.6], target: [2.0, 0.5, 0] },
  interior: { position: [0.6, 1.6, 2.0], target: [0.3, 0.85, 0] },
  undercarriage: { position: [0, 0.15, 4.0], target: [0, -0.35, 0] },
};

function CameraRig({ viewMode, autoRotate }: { viewMode: ViewMode; autoRotate: boolean }) {
  const { camera } = useThree();
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const posVec = useRef(new THREE.Vector3());
  const targetVec = useRef(new THREE.Vector3());

  useFrame(() => {
    const cfg = VIEW_TARGETS[viewMode];
    posVec.current.set(...cfg.position);
    targetVec.current.set(...cfg.target);
    camera.position.lerp(posVec.current, 0.06);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.lerp(targetVec.current, 0.06);
      controls.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={autoRotate}
      autoRotateSpeed={0.6}
      enablePan={false}
      minDistance={1.5}
      maxDistance={12}
      maxPolarAngle={Math.PI / 2.05}
    />
  );
}

function PartHotspots({ parts, onSelect }: { parts: CarPart[]; onSelect: (part: CarPart) => void }) {
  return (
    <>
      {parts.map((part) => (
        <Html key={part.id} position={part.position} distanceFactor={5} occlude>
          <button
            onClick={() => onSelect(part)}
            aria-label={part.name}
            title={part.name}
            className="animate-hotspot-pulse"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(79,70,229,0.25)",
              border: "2px solid rgba(79,70,229,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "14px",
              backdropFilter: "blur(8px)",
              transition: "transform 0.2s ease",
            }}
          >
            {part.icon}
          </button>
        </Html>
      ))}
    </>
  );
}

export function Vehicle360Scene({
  parts,
  viewMode,
  autoRotate,
  onPartClick,
}: {
  parts: CarPart[];
  viewMode: ViewMode;
  autoRotate: boolean;
  onPartClick: (part: CarPart) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.18} />

      <SpotLight
        position={[5, 8, 3]}
        angle={0.4}
        penumbra={0.8}
        intensity={55}
        color="#fff5e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <SpotLight position={[-4, 5, -2]} angle={0.5} penumbra={1} intensity={18} color="#d0e4ff" castShadow={false} />
      <pointLight position={[-3, 2, 3]} intensity={6} color="#6080ff" />

      <Environment preset="city" />

      <SentraMesh onPartClick={() => {}} />
      <PartHotspots parts={parts} onSelect={onPartClick} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.62, 0]}>
        <planeGeometry args={[30, 30]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={12}
          depthScale={1}
          minDepthThreshold={0.85}
          color="#030508"
          metalness={0.8}
          roughness={1}
          mirror={0.5}
        />
      </mesh>

      <ContactShadows position={[0, -0.61, 0]} opacity={0.7} scale={10} blur={2.5} far={4} />

      <CameraRig viewMode={viewMode} autoRotate={autoRotate} />
    </>
  );
}
