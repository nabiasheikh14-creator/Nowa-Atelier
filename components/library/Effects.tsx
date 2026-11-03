"use client";

import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";

export function Effects() {
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom intensity={0.38} luminanceThreshold={0.72} luminanceSmoothing={0.28} mipmapBlur />
      <Noise opacity={0.035} premultiply />
      <Vignette eskil={false} offset={0.22} darkness={0.78} />
    </EffectComposer>
  );
}
