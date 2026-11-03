"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { Book } from "@/lib/types";
import { placeCollection } from "@/lib/placement";
import { Books } from "./Books";
import { CameraRig, type FocusRequest } from "./CameraRig";
import { Dust } from "./Dust";
import { Effects } from "./Effects";
import { Room } from "./Room";

export function LibraryScene({
  books,
  focus,
  popup,
  reducedMotion,
  skipIntro,
  onOpen,
  onArrive,
  onIntroDone,
  onInteract,
}: {
  books: Book[];
  focus: FocusRequest;
  popup: boolean;
  reducedMotion: boolean;
  skipIntro: boolean;
  onOpen: (id: string) => void;
  onArrive: () => void;
  onIntroDone: () => void;
  onInteract: () => void;
}) {
  const layout = useMemo(() => placeCollection(books), [books]);
  const moonDust = useMemo(
    () => ({ min: [-0.8, 0.6, -0.4] as [number, number, number], max: [1.3, 3.4, 3.4] as [number, number, number] }),
    [],
  );
  const lampDust = useMemo(
    () => ({ min: [1.2, 0.4, 0.2] as [number, number, number], max: [2.4, 1.6, 1.5] as [number, number, number] }),
    [],
  );

  return (
    <Canvas
      shadows="basic"
      dpr={[1, 1.5]}
      camera={{ fov: 40, near: 0.08, far: 40, position: [0.15, 1.98, 3.05] }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0c0e11");
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
    >
      <color attach="background" args={["#0c0e11"]} />
      <fog attach="fog" args={["#141311", 9, 18]} />
      <ambientLight intensity={0.28} color={"#f3e6d4"} />
      <hemisphereLight args={["#31445c", "#3a2618", 0.55]} />
      <directionalLight
        position={[0.8, 6.2, 7.4]}
        intensity={1.45}
        color={"#d5e1f2"}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0008}
      />
      <pointLight position={[0, 3.1, 0.2]} intensity={4} distance={12} decay={2} color={"#ffe1c2"} />
      <Room />
      <Books placed={layout.placed} plaques={layout.plaques} focusId={focus?.id ?? null} onOpen={onOpen} />
      <mesh raycast={() => null} position={[0.25, 2.35, 1.15]} rotation={[1.05, 0, 0.04]}>
        <boxGeometry args={[1.35, 5.2, 1.15]} />
        <meshBasicMaterial color={"#d7e4f6"} transparent opacity={0.045} depthWrite={false} />
      </mesh>
      <Dust count={280} bounds={moonDust} color={"#d5e4f6"} size={0.02} />
      <Dust count={120} bounds={lampDust} color={"#ffd7a8"} size={0.016} />
      <CameraRig
        placed={layout.placed}
        focus={focus}
        popup={popup}
        reducedMotion={reducedMotion}
        skipIntro={skipIntro}
        onArrive={onArrive}
        onIntroDone={onIntroDone}
        onInteract={onInteract}
      />
      <Effects />
    </Canvas>
  );
}
