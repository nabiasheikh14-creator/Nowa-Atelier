"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INNER, ROOM } from "@/lib/room-plan";
import { buildShelfGeometry, buildShellGeometry } from "./build-room";
import { makeFloorTexture, makeGlobeTexture, makeRugTexture } from "./textures";

const wood = "#3c2918";
const woodDark = "#24160f";
const wall = "#1b2c24";
const brass = "#b08d57";
const velvet = "#6c2432";

export function Room() {
  const floor = useMemo(() => makeFloorTexture(), []);
  const rug = useMemo(() => makeRugTexture(), []);
  const globe = useMemo(() => makeGlobeTexture(), []);
  const shelves = useMemo(() => buildShelfGeometry(), []);
  const shell = useMemo(() => buildShellGeometry(), []);

  return (
    <group raycast={() => null}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial map={floor} roughness={0.78} metalness={0.04} />
      </mesh>

      <mesh geometry={shell.walls} receiveShadow>
        <meshStandardMaterial color={wall} roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh geometry={shell.front} receiveShadow>
        <meshStandardMaterial color={"#16241e"} roughness={0.9} />
      </mesh>

      <Ceiling />
      <mesh geometry={shelves.backs} receiveShadow>
        <meshStandardMaterial color={"#140e0b"} roughness={0.95} />
      </mesh>
      <mesh geometry={shelves.carcass} castShadow receiveShadow>
        <meshStandardMaterial color={wood} roughness={0.64} metalness={0.05} />
      </mesh>

      <Fireplace />
      <WindowDressing />
      <Rug map={rug} />
      <Chair />
      <SideTable />
      <Globe map={globe} />
      <Ladder />
    </group>
  );
}

function Ceiling() {
  const beams = useMemo(() => {
    const parts: { position: [number, number, number]; args: [number, number, number] }[] = [];
    for (let x = -5.2; x <= 5.2; x += 1.75) {
      parts.push({ position: [x, ROOM.height - 0.1, 0], args: [0.12, 0.18, ROOM.depth - 0.5] });
    }
    for (let z = -3.4; z <= 3.4; z += 1.7) {
      parts.push({ position: [0, ROOM.height - 0.1, z], args: [ROOM.width - 0.5, 0.14, 0.1] });
    }
    return parts;
  }, []);

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, 0]}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color={"#121816"} roughness={1} />
      </mesh>
      {beams.map((beam, index) => (
        <mesh key={index} position={beam.position} castShadow>
          <boxGeometry args={beam.args} />
          <meshStandardMaterial color={woodDark} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, ROOM.height - 0.04, 0]}>
        <boxGeometry args={[ROOM.width, 0.08, 0.12]} />
        <meshStandardMaterial color={woodDark} roughness={0.68} />
      </mesh>
    </group>
  );
}

function Fireplace() {
  const fire = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const flicker = 0.86 + Math.sin(clock.elapsedTime * 11) * 0.08 + Math.sin(clock.elapsedTime * 23) * 0.05;
    if (fire.current) fire.current.scale.y = flicker;
    if (glow.current) glow.current.intensity = 11 * flicker;
  });
  const z = -INNER.z;
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.08, 0.38]} receiveShadow>
        <boxGeometry args={[2.15, 0.12, 0.78]} />
        <meshStandardMaterial color={"#4a4038"} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.95, 0.18]} castShadow>
        <boxGeometry args={[1.85, 1.7, 0.28]} />
        <meshStandardMaterial color={"#2c241c"} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.78, 0.34]}>
        <boxGeometry args={[0.95, 0.82, 0.12]} />
        <meshStandardMaterial color={"#090807"} roughness={1} />
      </mesh>
      <mesh position={[0, 0.42, 0.4]}>
        <sphereGeometry args={[0.1, 16, 10]} />
        <meshStandardMaterial color={"#ff6a2a"} emissive={"#ff4a1a"} emissiveIntensity={2.2} roughness={1} />
      </mesh>
      <mesh ref={fire} position={[0, 0.62, 0.42]}>
        <coneGeometry args={[0.07, 0.28, 8]} />
        <meshStandardMaterial color={"#ffd7a1"} emissive={"#ffb15e"} emissiveIntensity={3.4} transparent opacity={0.92} />
      </mesh>
      <mesh position={[-0.05, 0.56, 0.4]} rotation={[0, 0, 0.25]}>
        <coneGeometry args={[0.045, 0.18, 8]} />
        <meshStandardMaterial color={"#ffb15a"} emissive={"#ff7a32"} emissiveIntensity={2.6} />
      </mesh>
      <pointLight ref={glow} position={[0, 0.7, 0.7]} color={"#ff8a45"} distance={7.5} decay={2} intensity={11} />
      <mesh position={[0, 1.72, 0.36]} castShadow>
        <boxGeometry args={[2.25, 0.12, 0.46]} />
        <meshStandardMaterial color={wood} roughness={0.55} />
      </mesh>
      <Candle position={[-0.62, 1.84, 0.42]} />
      <Candle position={[0.58, 1.84, 0.4]} />
      <mesh position={[0.05, 1.9, 0.28]} rotation={[0, 0.2, Math.PI / 2]}>
        <boxGeometry args={[0.16, 0.22, 0.1]} />
        <meshStandardMaterial color={"#6e2433"} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Candle({ position }: { position: [number, number, number] }) {
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flame.current) flame.current.scale.y = 0.85 + Math.sin(clock.elapsedTime * 14 + position[0]) * 0.2;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.14, 10]} />
        <meshStandardMaterial color={"#e6d7bc"} roughness={0.7} />
      </mesh>
      <mesh ref={flame} position={[0, 0.16, 0]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={"#ffd7a1"} emissive={"#ffb15e"} emissiveIntensity={4} />
      </mesh>
      <pointLight position={[0, 0.18, 0.05]} color={"#ffc98a"} intensity={0.6} distance={1.6} decay={2} />
    </group>
  );
}

function WindowDressing() {
  const z = INNER.z - 0.05;
  return (
    <group>
      <mesh position={[0, 2.15, z + 0.02]}>
        <planeGeometry args={[1.62, 2.15]} />
        <meshStandardMaterial color={"#9eb0c6"} transparent opacity={0.16} roughness={0.2} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.9, z + 0.03]}>
        <boxGeometry args={[0.035, 1.7, 0.03]} />
        <meshStandardMaterial color={"#1c140f"} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.15, z + 0.03]}>
        <boxGeometry args={[1.55, 0.03, 0.03]} />
        <meshStandardMaterial color={"#1c140f"} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0.55, 3.55, INNER.z + 0.35]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshBasicMaterial color={"#e9f1fb"} />
      </mesh>
      <Curtain x={-1.2} />
      <Curtain x={1.2} flip />
      <mesh position={[0, 1.08, z - 0.12]} receiveShadow>
        <boxGeometry args={[1.7, 0.1, 0.42]} />
        <meshStandardMaterial color={wood} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.16, z - 0.16]}>
        <boxGeometry args={[1.45, 0.08, 0.32]} />
        <meshStandardMaterial color={velvet} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Curtain({ x, flip }: { x: number; flip?: boolean }) {
  return (
    <group position={[x, 2.35, INNER.z - 0.08]} scale={[flip ? -1 : 1, 1, 1]}>
      <mesh position={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.28, 2.5, 0.08]} />
        <meshStandardMaterial color={"#5a2030"} roughness={0.88} />
      </mesh>
      <mesh position={[0.22, -0.15, 0.02]}>
        <boxGeometry args={[0.16, 2.15, 0.05]} />
        <meshStandardMaterial color={"#4a1a28"} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Rug({ map }: { map: THREE.CanvasTexture }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, 0.012, 0.55]} receiveShadow>
      <planeGeometry args={[3.5, 2.5]} />
      <meshStandardMaterial map={map} roughness={0.95} />
    </mesh>
  );
}

function Chair() {
  return (
    <group position={[0.95, 0, 1.32]} rotation={[0, 0.55, 0]}>
      {[
        [-0.22, 0.18, -0.2],
        [0.22, 0.18, -0.2],
        [-0.22, 0.18, 0.2],
        [0.22, 0.18, 0.2],
      ].map((position) => (
        <mesh key={position.join()} position={position as [number, number, number]} castShadow>
          <boxGeometry args={[0.06, 0.36, 0.06]} />
          <meshStandardMaterial color={woodDark} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.62, 0.12, 0.58]} />
        <meshStandardMaterial color={velvet} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.86, -0.24]} castShadow>
        <boxGeometry args={[0.62, 0.78, 0.1]} />
        <meshStandardMaterial color={velvet} roughness={0.86} />
      </mesh>
      <mesh position={[-0.32, 0.72, -0.02]} rotation={[0, 0, 0.08]} castShadow>
        <boxGeometry args={[0.08, 0.42, 0.42]} />
        <meshStandardMaterial color={"#5a1e2c"} roughness={0.88} />
      </mesh>
      <mesh position={[0.32, 0.72, -0.02]} rotation={[0, 0, -0.08]} castShadow>
        <boxGeometry args={[0.08, 0.42, 0.42]} />
        <meshStandardMaterial color={"#5a1e2c"} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.48, 0.02]}>
        <boxGeometry args={[0.5, 0.06, 0.42]} />
        <meshStandardMaterial color={"#7a3140"} roughness={0.8} />
      </mesh>
    </group>
  );
}

function SideTable() {
  return (
    <group position={[1.82, 0, 0.72]}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.045, 28]} />
        <meshStandardMaterial color={wood} roughness={0.48} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.07, 0.58, 12]} />
        <meshStandardMaterial color={woodDark} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.05, 16]} />
        <meshStandardMaterial color={woodDark} roughness={0.6} />
      </mesh>
      <Lamp />
    </group>
  );
}

function Lamp() {
  return (
    <group position={[0, 0.64, 0]}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.04, 16]} />
        <meshStandardMaterial color={brass} metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.48, 10]} />
        <meshStandardMaterial color={brass} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.11, 0.17, 0.16, 24, 1, true]} />
        <meshStandardMaterial color={"#5a3d22"} emissive={"#ffb15e"} emissiveIntensity={1.6} side={THREE.DoubleSide} roughness={0.55} />
      </mesh>
      <pointLight position={[0, 0.48, 0]} color={"#ffb56a"} intensity={6} distance={4.5} decay={2} />
      <spotLight
        position={[0, 0.5, 0]}
        angle={0.85}
        penumbra={0.75}
        intensity={40}
        distance={8}
        decay={2}
        color={"#ffc48a"}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />
    </group>
  );
}

function Globe({ map }: { map: THREE.CanvasTexture }) {
  return (
    <group position={[-1.55, 0, 1.18]}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.06, 20]} />
        <meshStandardMaterial color={woodDark} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.045, 0.7, 10]} />
        <meshStandardMaterial color={wood} roughness={0.5} />
      </mesh>
      <group position={[0, 0.92, 0]} rotation={[0.35, 0.4, 0.2]}>
        <mesh castShadow>
          <sphereGeometry args={[0.2, 32, 24]} />
          <meshStandardMaterial map={map} roughness={0.55} metalness={0.12} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.215, 0.008, 8, 40]} />
          <meshStandardMaterial color={brass} metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.215, 0.006, 8, 40]} />
          <meshStandardMaterial color={brass} metalness={0.75} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function Ladder() {
  const rungs = Array.from({ length: 9 }, (_, index) => -1.15 + index * 0.28);
  return (
    <group>
      <mesh position={[-5.78, 4.02, -0.7]}>
        <boxGeometry args={[0.06, 0.05, 5.6]} />
        <meshStandardMaterial color={brass} metalness={0.78} roughness={0.28} />
      </mesh>
      <group position={[-5.42, 1.7, -0.35]} rotation={[0, 0, 0.16]}>
        <mesh position={[-0.16, 0, 0]} castShadow>
          <boxGeometry args={[0.045, 3.15, 0.045]} />
          <meshStandardMaterial color={wood} roughness={0.58} />
        </mesh>
        <mesh position={[0.16, 0, 0]} castShadow>
          <boxGeometry args={[0.045, 3.15, 0.045]} />
          <meshStandardMaterial color={wood} roughness={0.58} />
        </mesh>
        {rungs.map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[0.32, 0.03, 0.04]} />
            <meshStandardMaterial color={"#5a3b24"} roughness={0.55} />
          </mesh>
        ))}
        <mesh position={[-0.16, -1.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.04, 10]} />
          <meshStandardMaterial color={brass} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.16, -1.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.04, 10]} />
          <meshStandardMaterial color={brass} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
