import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { type RoomPlan, type ShelfFrame } from "@/lib/room-plan";

function orientedBox(
  width: number,
  height: number,
  depth: number,
  center: [number, number, number],
  yaw: number,
): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  geometry.rotateY(yaw);
  geometry.translate(center[0], center[1], center[2]);
  return geometry;
}

function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error("Could not build library geometry");
  return merged;
}

const tint = new THREE.Color();

/** A box painted one colour (vertex colours), optionally darker at the top for a soft cubby shadow. */
function paintedBox(
  width: number,
  height: number,
  depth: number,
  center: [number, number, number],
  hex: string,
  shade = 1,
  topShade = 1,
): THREE.BufferGeometry {
  const geometry = orientedBox(width, height, depth, center, 0);
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  tint.set(hex);
  for (let index = 0; index < position.count; index++) {
    const atTop = position.getY(index) > center[1];
    const k = shade * (atTop ? topShade : 1);
    colors[index * 3] = tint.r * k;
    colors[index * 3 + 1] = tint.g * k;
    colors[index * 3 + 2] = tint.b * k;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

const WOOD = "#4a3020";
const WOOD_FACE = "#5a3a26";
const WOOD_DEEP = "#2e1d13";
const BACK = "#2b1b12";

/** The frieze sits between the top cubby and the crown; plaques are fixed to it. */
export const FRIEZE = { bottom: 2.2, top: 2.34 };

export type ShelfGeometry = { carcass: THREE.BufferGeometry; backs: THREE.BufferGeometry };

/**
 * One continuous library wall: a plinth and crown moulding run the full length,
 * each section has framed stiles, lipped shelves, and plank backs with soft shadow.
 */
export function buildShelfGeometry(frames: ShelfFrame[]): ShelfGeometry {
  const carcass: THREE.BufferGeometry[] = [];
  const backs: THREE.BufferGeometry[] = [];
  if (frames.length === 0) {
    const empty = new THREE.BufferGeometry();
    return { carcass: empty, backs: empty };
  }
  const stile = 0.04;
  const depth = frames[0]!.depth;
  const backZ = frames[0]!.backLeft[2];
  const z = (out: number) => backZ + out;
  const left = frames[0]!.backLeft[0] - stile;
  const right = frames.at(-1)!.backLeft[0] + frames.at(-1)!.width + stile;
  const run = right - left;
  const mid = (left + right) / 2;
  const rows = frames[0]!.shelfYs;

  // plinth: a recessed toe kick, the base, and a small moulded cap
  carcass.push(paintedBox(run - 0.04, 0.08, depth - 0.04, [mid, 0.04, z((depth - 0.04) / 2)], WOOD_DEEP, 0.8));
  carcass.push(paintedBox(run + 0.02, 0.11, depth + 0.01, [mid, 0.135, z((depth + 0.01) / 2)], WOOD, 1));
  carcass.push(paintedBox(run + 0.04, 0.018, depth + 0.03, [mid, 0.199, z((depth + 0.03) / 2)], WOOD_FACE, 1.08));

  // frieze and a three-step crown moulding
  carcass.push(paintedBox(run, FRIEZE.top - FRIEZE.bottom, depth + 0.01, [mid, (FRIEZE.top + FRIEZE.bottom) / 2, z((depth + 0.01) / 2)], WOOD, 1));
  const crown: [number, number, number, string, number][] = [
    [FRIEZE.top, 0.04, 0.025, WOOD_FACE, 1.05],
    [FRIEZE.top + 0.04, 0.06, 0.05, WOOD, 0.95],
    [FRIEZE.top + 0.1, 0.06, 0.08, WOOD_FACE, 1.1],
  ];
  for (const [bottom, tall, over, hex, shade] of crown) {
    carcass.push(paintedBox(run + over * 2, tall, depth + over, [mid, bottom + tall / 2, z((depth + over) / 2)], hex, shade));
  }

  for (const frame of frames) {
    const x0 = frame.backLeft[0];
    const width = frame.width;
    const cx = x0 + width / 2;
    const height = FRIEZE.bottom - 0.2;

    // stiles either side, with a slightly proud face frame
    for (const sx of [x0 - stile / 2, x0 + width + stile / 2]) {
      carcass.push(paintedBox(stile, height, depth, [sx, 0.2 + height / 2, z(depth / 2)], WOOD, 0.92));
      carcass.push(paintedBox(stile + 0.012, height, 0.012, [sx, 0.2 + height / 2, z(depth + 0.004)], WOOD_FACE, 1.06));
    }

    // a solid backboard, then planks over it with a soft shadow under each shelf
    backs.push(paintedBox(width, height, 0.01, [cx, 0.2 + height / 2, z(0.005)], "#140d09", 1));
    const tops = [...rows.slice(1), FRIEZE.bottom];
    rows.forEach((floor, rowIndex) => {
      const ceiling = tops[rowIndex]!;
      const planks = Math.max(1, Math.round(width / 0.085));
      const plank = width / planks;
      for (let index = 0; index < planks; index++) {
        const tone = 0.86 + ((index * 37 + rowIndex * 11) % 7) * 0.035;
        backs.push(
          paintedBox(plank - 0.003, ceiling - floor, 0.014, [x0 + plank * (index + 0.5), (floor + ceiling) / 2, z(0.017)], BACK, tone, 0.45),
        );
      }
    });

    // shelves: board plus a lipped front edge
    for (const shelfY of rows) {
      carcass.push(paintedBox(width, 0.03, depth - 0.02, [cx, shelfY - 0.015, z((depth - 0.02) / 2 + 0.01)], WOOD, 1));
      carcass.push(paintedBox(width, 0.045, 0.014, [cx, shelfY - 0.02, z(depth + 0.002)], WOOD_FACE, 1.1));
    }
  }

  return { carcass: merge(carcass), backs: merge(backs) };
}

export function buildShellGeometry(room: RoomPlan): { walls: THREE.BufferGeometry; front: THREE.BufferGeometry } {
  const parts: THREE.BufferGeometry[] = [];
  const height = room.height;
  const wall = room.wall;
  const halfW = room.width / 2;
  const halfD = room.depth / 2;

  const back = new THREE.BoxGeometry(room.width, height, wall);
  back.translate(0, height / 2, -(halfD - wall / 2));
  parts.push(back);

  const sideSpan = room.depth - wall * 2;
  const left = new THREE.BoxGeometry(wall, height, sideSpan);
  left.translate(-(halfW - wall / 2), height / 2, 0);
  parts.push(left);
  const right = new THREE.BoxGeometry(wall, height, sideSpan);
  right.translate(halfW - wall / 2, height / 2, 0);
  parts.push(right);

  const front = new THREE.BoxGeometry(room.width, height, wall);
  front.translate(0, height / 2, halfD - wall / 2);

  return { walls: merge(parts), front };
}
