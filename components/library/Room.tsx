"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RoomPlan, ShelfFrame } from "@/lib/room-plan";
import { buildShelfGeometry, buildShellGeometry } from "./build-room";
import { makeFloorTexture, makeGlobeTexture, makeRugTexture } from "./textures";

const wood = "#3c2918";
const woodDark = "#24160f";
const wall = "#1b2c24";
const brass = "#b08d57";
const velvet = "#6c2432";

export function Room({ room, frames }: { room: RoomPlan; frames: ShelfFrame[] }) {
  const floor = useMemo(() => makeFloorTexture(), []);
  const rug = useMemo(() => makeRugTexture(), []);
  const globe = useMemo(() => makeGlobeTexture(), []);
  const shelves = useMemo(() => buildShelfGeometry(frames), [frames]);
  const shell = useMemo(() => buildShellGeometry(room), [room]);
  const beams = useMemo(() => {
    const parts: { position: [number, number, number]; args: [number, number, number] }[] = [];
    const step = room.width / 4;
    for (let x = -room.width / 2 + step; x < room.width / 2; x += step) {
      parts.push({ position: [x, room.height - 0.08, 0], args: [0.08, 0.12, room.depth - 0.3] });
    }
    return parts;
  }, [room]);

  return (
    <group raycast={() => null}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[room.width, room.depth]} />
        <meshStandardMaterial map={floor} roughness={0.78} metalness={0.04} />
      </mesh>
      <mesh geometry={shell.walls}>
        <meshStandardMaterial color={wall} roughness={0.92} />
      </mesh>
      <mesh geometry={shell.front}>
        <meshStandardMaterial color={"#16241e"} roughness={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, room.height, 0]}>
        <planeGeometry args={[room.width, room.depth]} />
        <meshStandardMaterial color={"#121816"} roughness={1} />
      </mesh>
      {beams.map((beam, index) => (
        <mesh key={index} position={beam.position}>
          <boxGeometry args={beam.args} />
          <meshStandardMaterial color={woodDark} roughness={0.7} />
        </mesh>
      ))}
      <mesh geometry={shelves.backs}>
        <meshStandardMaterial color={"#140e0b"} roughness={0.95} />
      </mesh>
      <mesh geometry={shelves.carcass}>
        <meshStandardMaterial color={wood} roughness={0.64} metalness={0.05} />
      </mesh>
      <Window room={room} />
      <Fireplace room={room} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0.2]}>
        <planeGeometry args={[Math.min(2.4, room.width * 0.55), 1.5]} />
        <meshStandardMaterial map={rug} roughness={0.95} />
      </mesh>
      <Chair room={room} />
      <SideTable room={room} />
      <Globe room={room} map={globe} />
    </group>
  );
}

function Window({ room }: { room: RoomPlan }) {
  const x = -room.inner.x + 0.02;
  return (
    <group position={[x, 1.42, -0.05]} rotation={[0, Math.PI / 2, 0]}>
      <mesh>
        <planeGeometry args={[0.85, 1.15]} />
        <meshStandardMaterial color={"#c5d4e6"} transparent opacity={0.22} roughness={0.15} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.03, 1.15, 0.03]} />
        <meshStandardMaterial color={"#1c140f"} metalness={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.22, 0.02]}>
        <boxGeometry args={[0.85, 0.03, 0.03]} />
        <meshStandardMaterial color={"#1c140f"} metalness={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0.12, 0.42, -0.16]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={"#e7eef8"} />
      </mesh>
    </group>
  );
}

function Fireplace({ room }: { room: RoomPlan }) {
  const fire = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const flicker = 0.86 + Math.sin(clock.elapsedTime * 11) * 0.08;
    if (fire.current) fire.current.scale.y = flicker;
    if (glow.current) glow.current.intensity = 6 * flicker;
  });
  return (
    <group position={[room.inner.x - 0.16, 0, -0.2]} rotation={[0, -Math.PI / 2, 0]} scale={0.58}>
      <mesh position={[0, 0.72, 0.12]}>
        <boxGeometry args={[1.15, 1.15, 0.22]} />
        <meshStandardMaterial color={"#2c241c"} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.62, 0.24]}>
        <boxGeometry args={[0.62, 0.55, 0.08]} />
        <meshStandardMaterial color={"#090807"} roughness={1} />
      </mesh>
      <mesh ref={fire} position={[0, 0.48, 0.28]}>
        <coneGeometry args={[0.06, 0.22, 8]} />
        <meshStandardMaterial color={"#ffd7a1"} emissive={"#ffb15e"} emissiveIntensity={3} />
      </mesh>
      <pointLight ref={glow} position={[0, 0.55, 0.45]} color={"#ff8a45"} distance={4.5} decay={2} intensity={6} />
      <mesh position={[0, 1.35, 0.16]}>
        <boxGeometry args={[1.4, 0.08, 0.28]} />
        <meshStandardMaterial color={wood} roughness={0.55} />
      </mesh>
    </group>
  );
}

function Chair({ room }: { room: RoomPlan }) {
  return (
    <group position={[-room.inner.x + 0.42, 0, room.inner.z - 0.62]} rotation={[0, 0.7, 0]} scale={0.7}>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.58, 0.1, 0.52]} />
        <meshStandardMaterial color={velvet} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.78, -0.2]}>
        <boxGeometry args={[0.58, 0.64, 0.08]} />
        <meshStandardMaterial color={velvet} roughness={0.86} />
      </mesh>
    </group>
  );
}

function SideTable({ room }: { room: RoomPlan }) {
  return (
    <group position={[-room.inner.x + 0.46, 0, room.inner.z - 1.05]} scale={0.72}>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
        <meshStandardMaterial color={wood} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.46, 8]} />
        <meshStandardMaterial color={woodDark} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.08, 0.13, 0.12, 16, 1, true]} />
        <meshStandardMaterial
          color={"#5a3d22"}
          emissive={"#ffb15e"}
          emissiveIntensity={1.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight position={[0, 0.7, 0]} color={"#ffb56a"} intensity={4} distance={3.2} decay={2} />
    </group>
  );
}

function Globe({ room, map }: { room: RoomPlan; map: THREE.CanvasTexture }) {
  return (
    <group position={[room.inner.x - 0.4, 0, room.inner.z - 0.7]} scale={0.62}>
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.55, 8]} />
        <meshStandardMaterial color={wood} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.16, 20, 16]} />
        <meshStandardMaterial map={map} roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <torusGeometry args={[0.175, 0.008, 6, 24]} />
        <meshStandardMaterial color={brass} metalness={0.75} roughness={0.3} />
      </mesh>
    </group>
  );
}
