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

function caseTop(frame: ShelfFrame): number {
  return Math.max(...frame.shelfYs) + 0.6;
}

export function buildShelfGeometry(frames: ShelfFrame[]): { carcass: THREE.BufferGeometry; backs: THREE.BufferGeometry } {
  const carcass: THREE.BufferGeometry[] = [];
  const backs: THREE.BufferGeometry[] = [];
  const side = 0.045;
  if (frames.length === 0) {
    const empty = new THREE.BufferGeometry();
    return { carcass: empty, backs: empty };
  }

  for (const frame of frames) {
    const top = caseTop(frame);
    const mid = frame.width / 2;
    const depth = frame.depth;
    const center = (along: number, y: number, out: number): [number, number, number] => [
      frame.backLeft[0] + frame.run[0] * along + frame.normal[0] * out,
      y,
      frame.backLeft[2] + frame.run[2] * along + frame.normal[2] * out,
    ];

    backs.push(orientedBox(frame.width, top - 0.12, 0.03, center(mid, top / 2, 0.02), frame.yaw));
    carcass.push(orientedBox(side, top, depth, center(-side / 2, top / 2, depth / 2), frame.yaw));
    carcass.push(orientedBox(side, top, depth, center(frame.width + side / 2, top / 2, depth / 2), frame.yaw));
    carcass.push(orientedBox(frame.width + side * 2, 0.16, depth + 0.02, center(mid, 0.08, depth / 2), frame.yaw));
    carcass.push(
      orientedBox(frame.width + side * 2, 0.1, depth + 0.03, center(mid, top - 0.06, depth / 2), frame.yaw),
    );

    for (const shelfY of frame.shelfYs) {
      carcass.push(orientedBox(frame.width, 0.045, depth - 0.02, center(mid, shelfY - 0.02, depth / 2 + 0.01), frame.yaw));
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
