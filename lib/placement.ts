import * as THREE from "three";
import type { Book } from "./types";
import { hashString, mulberry32, range } from "./random";
import { layoutRoom, type RoomPlan, type ShelfFrame } from "./room-plan";
import { SPINE_ASPECT, spineArt } from "./spine-design";

export type PlacedBook = {
  key: string;
  bookId: string | null;
  title: string;
  author: string;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  size: [number, number, number];
  normal: [number, number, number];
  color: string;
  coverUrl: string | null;
  genre: string;
  template: number;
  shade: number;
  lent: boolean;
};

export type Plaque = {
  id: string;
  label: string;
  position: [number, number, number];
  yaw: number;
  width: number;
};

const CLOTH = [
  "#6e2433",
  "#1e3d34",
  "#1c2c4a",
  "#8a7044",
  "#a37b45",
  "#3e2a22",
  "#4a2c3d",
  "#314232",
  "#5c3a2e",
  "#7a3b2e",
  "#243044",
  "#3f4a32",
  "#6a3a2a",
  "#2c3f48",
  "#5a4632",
];

const up = new THREE.Vector3(0, 1, 0);
const yawQuat = new THREE.Quaternion();
const combined = new THREE.Quaternion();

function pose(
  frame: ShelfFrame,
  along: number,
  y: number,
  depth: number,
): { position: [number, number, number]; quaternion: [number, number, number, number] } {
  const inset = Math.max(0.035, frame.depth - 0.02 - depth / 2);
  yawQuat.setFromAxisAngle(up, frame.yaw);
  combined.copy(yawQuat);
  return {
    position: [
      frame.backLeft[0] + frame.run[0] * along + frame.normal[0] * inset,
      y,
      frame.backLeft[2] + frame.run[2] * along + frame.normal[2] * inset,
    ],
    quaternion: [combined.x, combined.y, combined.z, combined.w],
  };
}

export function placeCollection(books: Book[]): {
  placed: PlacedBook[];
  plaques: Plaque[];
  frames: ShelfFrame[];
  room: RoomPlan;
} {
  const counts = new Map<string, number>();
  for (const book of books) counts.set(book.genre, (counts.get(book.genre) ?? 0) + 1);
  const { room, frames } = layoutRoom([...counts].map(([genre, count]) => ({ genre, count })));

  const byGenre = new Map<string, Book[]>();
  for (const book of books) {
    const list = byGenre.get(book.genre) ?? [];
    list.push(book);
    byGenre.set(book.genre, list);
  }
  for (const list of byGenre.values()) list.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));

  const placed: PlacedBook[] = [];
  const plaques: Plaque[] = [];

  for (const frame of frames) {
    const owned = byGenre.get(frame.genre) ?? [];
    plaques.push({
      id: frame.id,
      label: frame.genre,
      yaw: frame.yaw,
      width: frame.width,
        position: [
        frame.backLeft[0] + frame.run[0] * (frame.width / 2) + frame.normal[0] * (frame.depth - 0.02),
        Math.max(...frame.shelfYs) + 0.48,
        frame.backLeft[2] + frame.run[2] * (frame.width / 2) + frame.normal[2] * (frame.depth - 0.02),
      ],
    });

    const rows = frame.shelfYs.map(() => [] as Book[]);
    owned.forEach((book, index) => {
      rows[index % frame.shelfYs.length]!.push(book);
    });

    frame.shelfYs.forEach((shelfY, shelfIndex) => {
      const row = rows[shelfIndex] ?? [];
      if (row.length === 0) return;
      const usable = frame.width - 0.08;
      const heightGoal = 0.34;
      const thickness = Math.min(heightGoal * SPINE_ASPECT, (usable * 0.94) / row.length);
      const height = thickness / SPINE_ASPECT;
      const gap = (usable - thickness * row.length) / (row.length + 1);
      row.forEach((book, index) => {
        const rng = mulberry32(hashString(book.id));
        const depth = range(rng, 0.175, 0.21);
        const along = 0.04 + gap * (index + 1) + thickness * index + thickness / 2;
        const posed = pose(frame, along, shelfY + height / 2, depth);
        const art = spineArt(book.title);
        placed.push({
          key: book.id,
          bookId: book.id,
          title: book.title,
          author: book.author,
          position: posed.position,
          quaternion: posed.quaternion,
          size: [thickness, height, depth],
          normal: frame.normal,
          color: art.ground,
          coverUrl: book.cover_url,
          genre: frame.genre,
          template: -1,
          shade: book.status === "lent" ? 0.62 : 0.94,
          lent: book.status === "lent",
        });
      });
    });
  }

  return { placed, plaques, frames, room };
}

export const FILLER_TEMPLATE_COUNT = 0;
export const FILLER_WORDS_FOR_ATLAS: string[] = [];
export const CLOTH_COLORS = CLOTH;
