"use client";

import { useMemo, useState } from "react";
import * as THREE from "three";

type WheelProps = {
  position: [number, number, number];
  rotation: [number, number, number];
};

function Wheel({ position, rotation }: WheelProps) {
  const rimMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#B8C0C8", metalness: 0.95, roughness: 0.1 }),
    []
  );
  const tireMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#111", metalness: 0, roughness: 0.95 }), []);
  const lugMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#888", metalness: 0.9, roughness: 0.2 }), []);
  const spokes = [0, 1, 2, 3, 4];

  return (
    <group position={position} rotation={rotation}>
      <mesh material={tireMat} castShadow>
        <torusGeometry args={[0.36, 0.13, 16, 40]} />
      </mesh>
      <mesh material={rimMat}>
        <cylinderGeometry args={[0.26, 0.26, 0.06, 32]} />
      </mesh>
      {spokes.map((i) => (
        <mesh
          key={i}
          material={rimMat}
          rotation={[0, (i * Math.PI * 2) / 5, 0]}
          position={[0.13 * Math.sin((i * Math.PI * 2) / 5), 0, 0.13 * Math.cos((i * Math.PI * 2) / 5)]}
        >
          <boxGeometry args={[0.05, 0.05, 0.26]} />
        </mesh>
      ))}
      {spokes.map((i) => (
        <mesh
          key={i}
          material={lugMat}
          position={[0.15 * Math.sin((i * Math.PI * 2) / 5), 0.04, 0.15 * Math.cos((i * Math.PI * 2) / 5)]}
        >
          <cylinderGeometry args={[0.025, 0.025, 0.04, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function SedanCabin({ material }: { material: THREE.Material }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.1, 0);
    s.bezierCurveTo(-0.9, 0.52, -0.3, 0.72, 0, 0.76);
    s.bezierCurveTo(0.3, 0.8, 0.65, 0.78, 0.85, 0.68);
    s.bezierCurveTo(1.05, 0.58, 1.1, 0.28, 1.1, 0);
    s.lineTo(-1.1, 0);
    return s;
  }, []);

  return (
    <mesh material={material} castShadow position={[-0.05, 0.58, -0.88]}>
      <extrudeGeometry args={[shape, { steps: 1, depth: 1.76, bevelEnabled: false }]} />
    </mesh>
  );
}

export type SentraMeshProps = {
  onPartClick?: (part: string) => void;
};

export function SentraMesh({ onPartClick }: SentraMeshProps) {
  const [, setHoveredPart] = useState<string | null>(null);

  const silverPaint = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#C0C8D0"),
        metalness: 0.92,
        roughness: 0.15,
        envMapIntensity: 1.4,
      }),
    []
  );
  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1a2030"),
        metalness: 0.1,
        roughness: 0.0,
        transparent: true,
        opacity: 0.75,
        envMapIntensity: 2.0,
      }),
    []
  );
  const chromeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#E8EDF2"), metalness: 1.0, roughness: 0.05 }),
    []
  );
  const tailLightMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#ff2200"),
        emissive: new THREE.Color("#ff2200"),
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.9,
      }),
    []
  );
  const headLightMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#ffffff"),
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.9,
      }),
    []
  );

  return (
    <group position={[0, 0, 0]}>
      {/* Body */}
      <mesh material={silverPaint} castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[4.2, 0.55, 1.85]} />
      </mesh>

      <SedanCabin material={silverPaint} />

      <mesh material={silverPaint} castShadow position={[1.35, 0.58, 0]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[1.45, 0.06, 1.82]} />
      </mesh>

      <mesh material={silverPaint} castShadow position={[-1.32, 0.62, 0]} rotation={[0, 0, 0.05]}>
        <boxGeometry args={[1.1, 0.06, 1.82]} />
      </mesh>

      <mesh material={silverPaint} castShadow position={[2.12, 0.18, 0]}>
        <boxGeometry args={[0.18, 0.36, 1.86]} />
      </mesh>

      <mesh material={silverPaint} castShadow position={[-2.12, 0.18, 0]}>
        <boxGeometry args={[0.18, 0.36, 1.86]} />
      </mesh>

      <mesh material={chromeMat} position={[2.18, 0.26, 0]}>
        <boxGeometry args={[0.04, 0.18, 1.2]} />
      </mesh>

      {/* Windows */}
      <mesh material={glassMat} castShadow position={[0.56, 0.92, 0]} rotation={[0, 0, -0.42]}>
        <planeGeometry args={[0.85, 1.78]} />
      </mesh>

      <mesh material={glassMat} castShadow position={[-0.52, 0.92, 0]} rotation={[0, 0, 0.38]}>
        <planeGeometry args={[0.72, 1.78]} />
      </mesh>

      <mesh material={glassMat} position={[0.12, 0.92, 0.93]}>
        <boxGeometry args={[1.1, 0.38, 0.02]} />
      </mesh>
      <mesh material={glassMat} position={[0.12, 0.92, -0.93]}>
        <boxGeometry args={[1.1, 0.38, 0.02]} />
      </mesh>

      {/* Lights */}
      <mesh material={headLightMat} position={[2.1, 0.38, 0.7]}>
        <boxGeometry args={[0.06, 0.18, 0.45]} />
      </mesh>
      <mesh material={headLightMat} position={[2.1, 0.38, -0.7]}>
        <boxGeometry args={[0.06, 0.18, 0.45]} />
      </mesh>

      <mesh
        material={tailLightMat}
        position={[-2.1, 0.42, 0.72]}
        onClick={(e) => {
          e.stopPropagation();
          onPartClick?.("tail_lights");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart("tail_lights");
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        <boxGeometry args={[0.06, 0.22, 0.5]} />
      </mesh>
      <mesh material={tailLightMat} position={[-2.1, 0.42, -0.72]}>
        <boxGeometry args={[0.06, 0.22, 0.5]} />
      </mesh>

      {/* Wheels */}
      <Wheel position={[1.3, -0.06, 1.0]} rotation={[0, 0, Math.PI / 2]} />
      <Wheel position={[1.3, -0.06, -1.0]} rotation={[0, 0, Math.PI / 2]} />
      <Wheel position={[-1.3, -0.06, 1.0]} rotation={[0, 0, Math.PI / 2]} />
      <Wheel position={[-1.3, -0.06, -1.0]} rotation={[0, 0, Math.PI / 2]} />

      {/* Mirrors */}
      <mesh material={silverPaint} position={[0.82, 0.72, 1.0]}>
        <boxGeometry args={[0.22, 0.12, 0.08]} />
      </mesh>
      <mesh material={silverPaint} position={[0.82, 0.72, -1.0]}>
        <boxGeometry args={[0.22, 0.12, 0.08]} />
      </mesh>

      {/* Door handles */}
      <mesh material={chromeMat} position={[0.18, 0.52, 0.95]}>
        <boxGeometry args={[0.18, 0.04, 0.03]} />
      </mesh>
      <mesh material={chromeMat} position={[-0.42, 0.52, 0.95]}>
        <boxGeometry args={[0.18, 0.04, 0.03]} />
      </mesh>
    </group>
  );
}
