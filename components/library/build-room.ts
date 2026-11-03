import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { ROOM, SHELF_FRAMES, type ShelfFrame } from "@/lib/room-plan";

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
  return frame.wall === "window" ? 1.14 : 4.32;
}

export function buildShelfGeometry(): { carcass: THREE.BufferGeometry; backs: THREE.BufferGeometry } {
  const carcass: THREE.BufferGeometry[] = [];
  const backs: THREE.BufferGeometry[] = [];
  const side = 0.055;

  for (const frame of SHELF_FRAMES) {
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

export function buildShellGeometry(): { walls: THREE.BufferGeometry; front: THREE.BufferGeometry } {
  const parts: THREE.BufferGeometry[] = [];
  const height = ROOM.height;
  const wall = ROOM.wall;
  const halfW = ROOM.width / 2;
  const halfD = ROOM.depth / 2;

  const back = new THREE.BoxGeometry(ROOM.width, height, wall);
  back.translate(0, height / 2, -(halfD - wall / 2));
  parts.push(back);

  const sideSpan = ROOM.depth - wall * 2;
  const left = new THREE.BoxGeometry(wall, height, sideSpan);
  left.translate(-(halfW - wall / 2), height / 2, 0);
  parts.push(left);
  const right = new THREE.BoxGeometry(wall, height, sideSpan);
  right.translate(halfW - wall / 2, height / 2, 0);
  parts.push(right);

  const shape = new THREE.Shape();
  shape.moveTo(-halfW, 0);
  shape.lineTo(halfW, 0);
  shape.lineTo(halfW, height);
  shape.lineTo(-halfW, height);
  shape.closePath();

  const radius = 0.86;
  const spring = 1.92;
  const sill = 1.12;
  const hole = new THREE.Path();
  hole.moveTo(-radius, sill);
  hole.lineTo(-radius, spring);
  for (let i = 0; i <= 32; i++) {
    const angle = Math.PI - (i / 32) * Math.PI;
    hole.lineTo(Math.cos(angle) * radius, spring + Math.sin(angle) * radius);
  }
  hole.lineTo(radius, sill);
  hole.closePath();
  shape.holes.push(hole);

  const front = new THREE.ExtrudeGeometry(shape, { depth: wall, bevelEnabled: false });
  front.translate(0, 0, halfD - wall);

  return { walls: merge(parts), front };
}
