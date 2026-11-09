"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { Book } from "@/lib/types";
import { placeCollection } from "@/lib/placement";
import { Books } from "./Books";
import { CameraRig, type FocusRequest } from "./CameraRig";
import { Dust } from "./Dust";
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
  const dust = useMemo(
    () => ({
      min: [-layout.room.width * 0.35, 0.8, layout.room.home.z - 1.4] as [number, number, number],
      max: [layout.room.width * 0.35, 2.1, layout.room.home.z] as [number, number, number],
    }),
    [layout.room],
  );

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 60, near: 0.08, far: 30, position: [0, 1.36, 2] }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.12,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#12110f");
      }}
    >
      <color attach="background" args={["#12110f"]} />
      <ambientLight intensity={0.55} color={"#f4e7d4"} />
      <hemisphereLight args={["#6d7e92", "#3a2618", 0.72]} />
      <directionalLight position={[-2.2, 3.4, 2.4]} intensity={1.15} color={"#d5e1f2"} />
      <pointLight position={[0, 2.1, 0.4]} intensity={6} distance={9} decay={2} color={"#ffe1c2"} />
      <Room room={layout.room} frames={layout.frames} />
      <Books placed={layout.placed} plaques={layout.plaques} focusId={focus?.id ?? null} onOpen={onOpen} />
      <Dust count={48} bounds={dust} color={"#efe2cc"} size={0.018} />
      <CameraRig
        placed={layout.placed}
        focus={focus}
        popup={popup}
        reducedMotion={reducedMotion}
        skipIntro={skipIntro}
        room={layout.room}
        onArrive={onArrive}
        onIntroDone={onIntroDone}
        onInteract={onInteract}
      />
    </Canvas>
  );
}
