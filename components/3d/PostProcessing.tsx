"use client";

import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { Vector2 } from "three";

const CHROMATIC_ABERRATION_OFFSET = new Vector2(0.0005, 0.0005);

export function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.4} intensity={0.8} mipmapBlur />
      <Vignette eskil={false} offset={0.3} darkness={0.6} />
      {/* blendFunction omitted: defaults to BlendFunction.NORMAL, and passing it explicitly hits
          a type-inference bug between this version of @react-three/postprocessing and postprocessing. */}
      <ChromaticAberration offset={CHROMATIC_ABERRATION_OFFSET} />
    </EffectComposer>
  );
}
