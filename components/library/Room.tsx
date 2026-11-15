"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RoomPlan, ShelfFrame } from "@/lib/room-plan";
import { buildShelfGeometry, buildShellGeometry } from "./build-room";
import { makeFloorTexture, makeGlobeTexture } from "./textures";

/** The rug photo is 1252 × 736 after rotating, so it lies along the wall. */
const RUG_ASPECT = 736 / 1252;

const wood = "#3c2918";
const woodDark = "#24160f";
const wall = "#1b2c24";
const brass = "#b08d57";
const velvet = "#6c2432";

export function Room({ room, frames }: { room: RoomPlan; frames: ShelfFrame[] }) {
  const floor = useMemo(() => makeFloorTexture(), []);
  const rug = useMemo(() => {
    const texture = new THREE.TextureLoader().load("/textures/rug.jpg");
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, []);
  // Narrower than the wall, so it frames the shelves instead of competing with them.
  const rugWidth = Math.min(2.2, room.width * 0.46);
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
      {/* Laid just in front of the shelves, where the camera can actually see it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -room.inner.z + 0.26 + 0.14 + (rugWidth * RUG_ASPECT) / 2]}>
        <planeGeometry args={[rugWidth, rugWidth * RUG_ASPECT]} />
        <meshStandardMaterial map={rug} color={"#b8a89c"} roughness={1} />
      </mesh>
      <Desk room={room} />
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

/** A writing desk in the back-left corner, beside the shelves: lamp, books, chai. */
function Desk({ room }: { room: RoomPlan }) {
  const x = -room.inner.x + 0.38;
  const z = -room.inner.z + 0.3;
  const top = 0.74;
  const legs: [number, number][] = [
    [-0.29, -0.2],
    [0.29, -0.2],
    [-0.29, 0.2],
    [0.29, 0.2],
  ];
  const stack = [
    { w: 0.2, d: 0.14, h: 0.032, color: "#6e2433", turn: 0.08 },
    { w: 0.18, d: 0.13, h: 0.028, color: "#1e3d34", turn: -0.12 },
    { w: 0.17, d: 0.12, h: 0.03, color: "#8a7044", turn: 0.2 },
  ];
  let stackY = top + 0.012;
  return (
    <group position={[x, 0, z]} rotation={[0, 0.18, 0]}>
      {/* top, apron, drawer, and slightly tapered legs */}
      <mesh position={[0, top - 0.012, 0]}>
        <boxGeometry args={[0.66, 0.026, 0.48]} />
        <meshStandardMaterial color={wood} roughness={0.42} metalness={0.04} />
      </mesh>
      <mesh position={[0, top - 0.06, 0]}>
        <boxGeometry args={[0.6, 0.07, 0.42]} />
        <meshStandardMaterial color={woodDark} roughness={0.6} />
      </mesh>
      <mesh position={[0, top - 0.06, 0.212]}>
        <boxGeometry args={[0.24, 0.045, 0.006]} />
        <meshStandardMaterial color={wood} roughness={0.5} />
      </mesh>
      <mesh position={[0, top - 0.06, 0.218]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color={brass} metalness={0.8} roughness={0.3} />
      </mesh>
      {legs.map(([lx, lz], index) => (
        <mesh key={index} position={[lx, (top - 0.09) / 2, lz]}>
          <cylinderGeometry args={[0.018, 0.012, top - 0.09, 8]} />
          <meshStandardMaterial color={woodDark} roughness={0.55} />
        </mesh>
      ))}

      {/* banker's lamp: brass stem, green glass shade, warm pool of light */}
      <group position={[-0.17, top, -0.1]}>
        <mesh position={[0, 0.012, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.024, 20]} />
          <meshStandardMaterial color={brass} metalness={0.85} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.22, 8]} />
          <meshStandardMaterial color={brass} metalness={0.85} roughness={0.28} />
        </mesh>
        {/* the shade lies on its side, a green half-tube over the bulb */}
        <mesh position={[0, 0.25, 0.03]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.8]}>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 20, 1, true, Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color={"#1f5a3c"} emissive={"#1f6a45"} emissiveIntensity={0.28} roughness={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.238, 0.03]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.15, 8]} />
          <meshStandardMaterial color={"#fff1d6"} emissive={"#ffd08a"} emissiveIntensity={3} />
        </mesh>
        <pointLight position={[0, 0.18, 0.06]} color={"#ffc27a"} intensity={3.2} distance={2.6} decay={2} />
      </group>

      {/* a small stack of books, squared up badly */}
      <group position={[0.17, 0, -0.11]}>
        {stack.map((book, index) => {
          const y = stackY + book.h / 2;
          stackY += book.h;
          return (
            <mesh key={index} position={[0, y, 0]} rotation={[0, book.turn, 0]}>
              <boxGeometry args={[book.w, book.h, book.d]} />
              <meshStandardMaterial color={book.color} roughness={0.8} />
            </mesh>
          );
        })}
      </group>

      {/* an open book, mid-read */}
      <group position={[0.02, top + 0.006, 0.09]} rotation={[0, -0.25, 0]}>
        <mesh position={[-0.062, 0.006, 0]} rotation={[0, 0, 0.12]}>
          <boxGeometry args={[0.12, 0.008, 0.17]} />
          <meshStandardMaterial color={"#efe3c8"} roughness={0.9} />
        </mesh>
        <mesh position={[0.062, 0.006, 0]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.12, 0.008, 0.17]} />
          <meshStandardMaterial color={"#efe3c8"} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.001, 0]}>
          <boxGeometry args={[0.25, 0.004, 0.18]} />
          <meshStandardMaterial color={"#3e2a22"} roughness={0.7} />
        </mesh>
      </group>

      {/* chai, on a saucer */}
      <group position={[0.22, top, 0.12]}>
        <mesh position={[0, 0.004, 0]}>
          <cylinderGeometry args={[0.052, 0.045, 0.008, 24]} />
          <meshStandardMaterial color={"#ece2cf"} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.034, 0]}>
          <cylinderGeometry args={[0.032, 0.024, 0.052, 20]} />
          <meshStandardMaterial color={"#ece2cf"} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.058, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.029, 20]} />
          <meshStandardMaterial color={"#9a6a3c"} roughness={0.2} />
        </mesh>
        <mesh position={[0.037, 0.036, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.012, 0.003, 6, 12]} />
          <meshStandardMaterial color={"#ece2cf"} roughness={0.35} />
        </mesh>
      </group>

      {/* a small plant in a clay pot */}
      <group position={[-0.25, top, 0.13]}>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.034, 0.026, 0.06, 14]} />
          <meshStandardMaterial color={"#8a4b2e"} roughness={0.85} />
        </mesh>
        {[0, 1.3, 2.5, 3.8, 5.1].map((turn, index) => (
          <mesh key={index} position={[Math.cos(turn) * 0.018, 0.085 + (index % 2) * 0.012, Math.sin(turn) * 0.018]} rotation={[Math.cos(turn) * 0.5, turn, Math.sin(turn) * 0.5]} scale={[1, 1.6, 0.35]}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <meshStandardMaterial color={"#2f5a33"} roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* a chair, turned out to the side as if someone just got up */}
      <group position={[0.3, 0, 0.42]} rotation={[0, Math.PI - 1.05, 0]}>
        <mesh position={[0, 0.44, 0]}>
          <boxGeometry args={[0.4, 0.04, 0.38]} />
          <meshStandardMaterial color={velvet} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.64, 0.17]}>
          <boxGeometry args={[0.38, 0.36, 0.035]} />
          <meshStandardMaterial color={wood} roughness={0.5} />
        </mesh>
        {legs.map(([lx, lz], index) => (
          <mesh key={index} position={[lx * 0.6, 0.21, lz * 0.85]}>
            <cylinderGeometry args={[0.014, 0.011, 0.42, 6]} />
            <meshStandardMaterial color={woodDark} roughness={0.55} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
