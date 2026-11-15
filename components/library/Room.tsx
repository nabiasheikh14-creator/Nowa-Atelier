"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RoomPlan, ShelfFrame } from "@/lib/room-plan";
import { buildShelfGeometry, buildShellGeometry } from "./build-room";
import { makeDayTexture, makeFloorTexture, makeGlobeTexture, makeNightTexture, makeRainTexture, makeSunPatchTexture } from "./textures";

/** The rug photo is 1252 × 736 after rotating, so it lies along the wall. */
const RUG_ASPECT = 736 / 1252;

const wood = "#3c2918";
const woodDark = "#24160f";
const wall = "#1b2c24";
const brass = "#b08d57";
const velvet = "#6c2432";

export function Room({ room, frames, day }: { room: RoomPlan; frames: ShelfFrame[]; day: boolean }) {
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
        <meshStandardMaterial vertexColors roughness={0.9} />
      </mesh>
      <mesh geometry={shelves.carcass}>
        <meshStandardMaterial vertexColors roughness={0.52} metalness={0.04} />
      </mesh>
      <LibraryLadder frames={frames} />
      <Window room={room} day={day} />
      {day && <Sunlight room={room} />}
      <Fireplace room={room} lit={!day} />
      {/* Laid just in front of the shelves, where the camera can actually see it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -room.inner.z + 0.26 + 0.14 + (rugWidth * RUG_ASPECT) / 2]}>
        <planeGeometry args={[rugWidth, rugWidth * RUG_ASPECT]} />
        <meshStandardMaterial map={rug} color={"#b8a89c"} roughness={1} />
      </mesh>
      <Desk room={room} lit={!day} />
      <Chair room={room} />
      <SideTable room={room} lit={!day} />
      <Globe room={room} map={globe} />
    </group>
  );
}

function Window({ room, day }: { room: RoomPlan; day: boolean }) {
  const x = -room.inner.x + 0.02;
  const night = useMemo(() => makeNightTexture(), []);
  const daylight = useMemo(() => makeDayTexture(), []);
  const rain = useMemo(() => makeRainTexture(), []);
  const W = 0.85;
  const H = 1.15;
  const glass = useRef<THREE.MeshBasicMaterial>(null);
  // Rain slides slowly down the glass.
  useFrame((_, delta) => {
    const map = glass.current?.map;
    if (map) map.offset.y += delta * 0.05;
  });
  const frameMat = <meshStandardMaterial color={"#2a1c12"} roughness={0.55} />;
  return (
    <group position={[x, 1.42, -0.05]} rotation={[0, Math.PI / 2, 0]}>
      {/* the night outside */}
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={day ? daylight : night} color={day ? "#ffffff" : "#c9cfdc"} toneMapped={false} />
      </mesh>
      {/* glass with rain on it */}
      <mesh position={[0, 0, 0.012]} visible={!day}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial ref={glass} map={rain} transparent opacity={0.85} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.008]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color={"#9fb4cf"} transparent opacity={0.06} roughness={0.05} metalness={0.2} depthWrite={false} />
      </mesh>
      {/* mullions */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.028, H, 0.03]} />
        {frameMat}
      </mesh>
      <mesh position={[0, 0.2, 0.02]}>
        <boxGeometry args={[W, 0.028, 0.03]} />
        {frameMat}
      </mesh>
      {/* casing and sill */}
      {[
        { p: [0, H / 2 + 0.03, 0.03] as [number, number, number], a: [W + 0.12, 0.06, 0.05] as [number, number, number] },
        { p: [-(W / 2 + 0.03), 0, 0.03] as [number, number, number], a: [0.06, H + 0.12, 0.05] as [number, number, number] },
        { p: [W / 2 + 0.03, 0, 0.03] as [number, number, number], a: [0.06, H + 0.12, 0.05] as [number, number, number] },
      ].map((part, index) => (
        <mesh key={index} position={part.p}>
          <boxGeometry args={part.a} />
          {frameMat}
        </mesh>
      ))}
      <mesh position={[0, -H / 2 - 0.035, 0.07]}>
        <boxGeometry args={[W + 0.2, 0.04, 0.14]} />
        <meshStandardMaterial color={wood} roughness={0.5} />
      </mesh>
      {/* velvet curtains, drawn back to either side */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (W / 2 + 0.13), -0.08, 0.1]}>
          {[0, 1, 2].map((fold) => (
            <mesh key={fold} position={[side * (fold * 0.035 - 0.035), 0, (fold % 2) * 0.02]}>
              <boxGeometry args={[0.05, H + 0.5, 0.03]} />
              <meshStandardMaterial color={fold === 1 ? "#173226" : "#1c3b2d"} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, H / 2 + 0.12, 0.12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, W + 0.5, 8]} />
        <meshStandardMaterial color={brass} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* a faint cool spill of moonlight into the room */}
      <pointLight
        position={[0, 0.1, 0.5]}
        color={day ? "#fff0d8" : "#8fa6d6"}
        intensity={day ? 5 : 0.7}
        distance={day ? 4 : 2.2}
        decay={2}
      />
    </group>
  );
}

function Fireplace({ room, lit }: { room: RoomPlan; lit: boolean }) {
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
      <mesh ref={fire} position={[0, 0.48, 0.28]} visible={lit}>
        <coneGeometry args={[0.06, 0.22, 8]} />
        <meshStandardMaterial color={"#ffd7a1"} emissive={"#ffb15e"} emissiveIntensity={3} />
      </mesh>
      <pointLight ref={glow} position={[0, 0.55, 0.45]} color={"#ff8a45"} distance={4.5} decay={2} intensity={6} visible={lit} />
      {/* by day the grate holds a couple of unlit logs */}
      {!lit &&
        [-0.08, 0.08].map((offset) => (
          <mesh key={offset} position={[offset, 0.4, 0.27]} rotation={[0, 0.3 * Math.sign(offset), Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 0.26, 8]} />
            <meshStandardMaterial color={"#3a2618"} roughness={0.95} />
          </mesh>
        ))}
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

/** A round side table with a fabric-shaded lamp and two books, by the reading chair. */
function SideTable({ room, lit }: { room: RoomPlan; lit: boolean }) {
  const top = 0.56;
  return (
    <group position={[-room.inner.x + 0.46, 0, room.inner.z - 1.05]} scale={0.72}>
      {/* top with a moulded rim */}
      <mesh position={[0, top, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 32]} />
        <meshStandardMaterial color={wood} roughness={0.42} />
      </mesh>
      <mesh position={[0, top - 0.022, 0]}>
        <cylinderGeometry args={[0.205, 0.215, 0.016, 32]} />
        <meshStandardMaterial color={woodDark} roughness={0.5} />
      </mesh>
      {/* turned pedestal on three splayed feet */}
      <mesh position={[0, top / 2, 0]}>
        <cylinderGeometry args={[0.028, 0.045, top - 0.06, 12]} />
        <meshStandardMaterial color={woodDark} roughness={0.5} />
      </mesh>
      <mesh position={[0, top * 0.62, 0]}>
        <sphereGeometry args={[0.045, 12, 10]} />
        <meshStandardMaterial color={woodDark} roughness={0.5} />
      </mesh>
      {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((turn, index) => (
        <mesh key={index} position={[Math.cos(turn) * 0.1, 0.035, Math.sin(turn) * 0.1]} rotation={[0, -turn, 0.35]}>
          <boxGeometry args={[0.2, 0.025, 0.035]} />
          <meshStandardMaterial color={woodDark} roughness={0.5} />
        </mesh>
      ))}

      {/* lamp: brass base and stem, pleated cream drum shade glowing from within */}
      <group position={[-0.05, top + 0.015, -0.04]}>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.045, 0.06, 0.06, 20]} />
          <meshStandardMaterial color={brass} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.2, 8]} />
          <meshStandardMaterial color={brass} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.075, 0.11, 0.14, 28, 1, true]} />
          <meshStandardMaterial
            color={"#e9dcc0"}
            emissive={"#ffbf73"}
            emissiveIntensity={lit ? 0.55 : 0}
            roughness={0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0.371, 0]}>
          <torusGeometry args={[0.075, 0.004, 6, 28]} />
          <meshStandardMaterial color={brass} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.229, 0]}>
          <torusGeometry args={[0.11, 0.004, 6, 28]} />
          <meshStandardMaterial color={brass} metalness={0.8} roughness={0.3} />
        </mesh>
        <pointLight position={[0, 0.26, 0]} color={"#ffb56a"} intensity={lit ? 3.2 : 0} distance={3} decay={2} />
      </group>

      {/* two books, one left open-face down */}
      <mesh position={[0.1, top + 0.03, 0.06]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.15, 0.03, 0.1]} />
        <meshStandardMaterial color={"#243044"} roughness={0.8} />
      </mesh>
      <mesh position={[0.11, top + 0.056, 0.07]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[0.13, 0.022, 0.09]} />
        <meshStandardMaterial color={"#7a3b2e"} roughness={0.8} />
      </mesh>
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
function Desk({ room, lit }: { room: RoomPlan; lit: boolean }) {
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
          <meshStandardMaterial color={"#1f5a3c"} emissive={"#1f6a45"} emissiveIntensity={lit ? 0.28 : 0} roughness={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.238, 0.03]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.15, 8]} />
          <meshStandardMaterial color={"#fff1d6"} emissive={"#ffd08a"} emissiveIntensity={lit ? 3 : 0} />
        </mesh>
        <pointLight position={[0, 0.18, 0.06]} color={"#ffc27a"} intensity={lit ? 3.2 : 0} distance={2.6} decay={2} />
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

/** A brass rail along the front of the case, and a rolling ladder parked at the right-hand end. */
function LibraryLadder({ frames }: { frames: ShelfFrame[] }) {
  if (frames.length === 0) return null;
  const depth = frames[0]!.depth;
  const backZ = frames[0]!.backLeft[2];
  const left = frames[0]!.backLeft[0] - 0.06;
  const right = frames.at(-1)!.backLeft[0] + frames.at(-1)!.width + 0.06;
  const railY = 2.16;
  const railZ = backZ + depth + 0.06;
  const end = right + 0.5;
  const length = end - left;
  const ladderX = right + 0.26;
  const foot = 0.62;
  const tall = Math.hypot(railY, foot);
  const lean = Math.atan2(foot, railY);
  const rungs = 9;
  return (
    <group raycast={() => null}>
      <mesh position={[(left + end) / 2, railY, railZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.011, 0.011, length, 10]} />
        <meshStandardMaterial color={brass} metalness={0.85} roughness={0.28} />
      </mesh>
      {[left + 0.02, ...frames.map((frame) => frame.backLeft[0] - 0.02), end - 0.02].map((x, index) => (
        <mesh key={index} position={[x, railY, railZ - 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.06, 6]} />
          <meshStandardMaterial color={brass} metalness={0.85} roughness={0.28} />
        </mesh>
      ))}
      {/* the ladder hangs from the rail and leans out to the floor */}
      <group position={[ladderX, railY, railZ]} rotation={[-lean, 0, 0]}>
        {[-0.19, 0.19].map((x) => (
          <mesh key={x} position={[x, -tall / 2, 0]}>
            <boxGeometry args={[0.035, tall, 0.05]} />
            <meshStandardMaterial color={wood} roughness={0.5} />
          </mesh>
        ))}
        {Array.from({ length: rungs }, (_, index) => (
          <mesh key={index} position={[0, -tall * ((index + 1) / (rungs + 1)), 0.005]}>
            <boxGeometry args={[0.38, 0.022, 0.06]} />
            <meshStandardMaterial color={wood} roughness={0.5} />
          </mesh>
        ))}
        {[-0.19, 0.19].map((x) => (
          <mesh key={`hook-${x}`} position={[x, 0.01, -0.012]}>
            <torusGeometry args={[0.016, 0.004, 6, 12, Math.PI]} />
            <meshStandardMaterial color={brass} metalness={0.85} roughness={0.28} />
          </mesh>
        ))}
        {[-0.19, 0.19].map((x) => (
          <mesh key={`wheel-${x}`} position={[x, -tall + 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.02, 12]} />
            <meshStandardMaterial color={brass} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * Morning sun through the window: a faint shaft of light across the room and the
 * window's shape laid warm on the floor. Additive, so it only ever brightens.
 */
function Sunlight({ room }: { room: RoomPlan }) {
  const patch = useMemo(() => makeSunPatchTexture(), []);
  const { shaft, floor } = useMemo(() => {
    const wx = -room.inner.x + 0.025;
    const cz = -0.05;
    const halfW = 0.425;
    const bottom = 1.42 - 0.575;
    const top = 1.42 + 0.575;
    const dir = new THREE.Vector3(1, -0.9, -0.55);
    const toFloor = (y: number, z: number) => {
      const t = y / -dir.y;
      return new THREE.Vector3(wx + dir.x * t, 0.004, z + dir.z * t);
    };
    const W = [
      new THREE.Vector3(wx, top, cz - halfW),
      new THREE.Vector3(wx, top, cz + halfW),
      new THREE.Vector3(wx, bottom, cz + halfW),
      new THREE.Vector3(wx, bottom, cz - halfW),
    ];
    const F = W.map((corner) => toFloor(corner.y, corner.z));

    // shaft: four faces from the window to its patch on the floor, brighter at the glass.
    // Values are linear: 0.005 lands as a faint haze on screen once converted to sRGB.
    const positions: number[] = [];
    const colors: number[] = [];
    const warm = new THREE.Color("#ffd9a0");
    const push = (point: THREE.Vector3, k: number) => {
      positions.push(point.x, point.y, point.z);
      colors.push(warm.r * k, warm.g * k, warm.b * k);
    };
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      push(W[i]!, 0.005);
      push(W[j]!, 0.005);
      push(F[j]!, 0);
      push(W[i]!, 0.005);
      push(F[j]!, 0);
      push(F[i]!, 0);
    }
    const shaftGeometry = new THREE.BufferGeometry();
    shaftGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    shaftGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    // floor patch: the projected quad, mapped so the pane texture lands the right way round
    const floorGeometry = new THREE.BufferGeometry();
    const order = [F[0]!, F[1]!, F[2]!, F[0]!, F[2]!, F[3]!];
    const uv = [0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0];
    floorGeometry.setAttribute("position", new THREE.Float32BufferAttribute(order.flatMap((p) => [p.x, p.y, p.z]), 3));
    floorGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    return { shaft: shaftGeometry, floor: floorGeometry };
  }, [room.inner.x]);

  return (
    <group raycast={() => null}>
      <mesh geometry={shaft}>
        <meshBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh geometry={floor}>
        <meshBasicMaterial map={patch} color={"#ffcf8a"} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
