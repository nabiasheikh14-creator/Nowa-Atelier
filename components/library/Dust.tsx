"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "@/lib/random";

export function Dust({
  count,
  bounds,
  color,
  size = 0.018,
}: {
  count: number;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  color: string;
  size?: number;
}) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const rng = mulberry32(count * 997 + bounds.min[0] * 1000 + bounds.max[2] * 100);
    for (let index = 0; index < count; index++) {
      positions[index * 3] = THREE.MathUtils.lerp(bounds.min[0], bounds.max[0], rng());
      positions[index * 3 + 1] = THREE.MathUtils.lerp(bounds.min[1], bounds.max[1], rng());
      positions[index * 3 + 2] = THREE.MathUtils.lerp(bounds.min[2], bounds.max[2], rng());
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [bounds.max, bounds.min, count]);

  const points = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    const attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;
    for (let index = 0; index < count; index++) {
      array[index * 3 + 1] += delta * 0.045;
      array[index * 3] += Math.sin(array[index * 3 + 1] * 6 + index) * delta * 0.01;
      if (array[index * 3 + 1] > bounds.max[1]) {
        array[index * 3 + 1] = bounds.min[1];
        array[index * 3] = THREE.MathUtils.lerp(bounds.min[0], bounds.max[0], Math.random());
        array[index * 3 + 2] = THREE.MathUtils.lerp(bounds.min[2], bounds.max[2], Math.random());
      }
    }
    attribute.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={geometry} raycast={() => null}>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.45}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
