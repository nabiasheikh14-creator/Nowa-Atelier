import * as THREE from "three";
import type { Book } from "./types";
import { hashString, mulberry32, pick, range } from "./random";
import { labelFrames, SHELF_FRAMES, type ShelfFrame } from "./room-plan";

export type PlacedBook = {
  key: string;
  bookId: string | null;
  title: string;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  size: [number, number, number];
  normal: [number, number, number];
  color: string;
  template: number;
  shade: number;
  lent: boolean;
};

export type Plaque = {
  id: string;
  label: string;
  position: [number, number, number];
  yaw: number;
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

const FILLER_WORDS = [
  "Annals",
  "Letters",
  "Poems",
  "Atlas",
  "Sermons",
  "Voyages",
  "Essays",
  "Journal",
  "Sonnets",
  "Tracts",
  "Plays",
  "Maps",
  "Volume IV",
  "Commonplace",
  "Histories",
  "Dialogues",
  "Observations",
  "A Treatise",
  "Miscellany",
  "The Coast",
  "Winter Notes",
  "On Gardens",
  "Two Lectures",
  "The Abbey",
  "Field Book",
  "Night Walks",
  "Of Measure",
  "Old Roads",
  "Chapbook",
  "Margins",
  "The Parish",
  "Sea Charts",
  "Afterword",
  "Folio",
  "Index",
  "Fragments",
  "The Orchard",
  "Quiet Hours",
  "Bindings",
  "Lampblack",
  "A Geography",
  "Second Series",
  "Household",
  "The River",
  "Portraits",
  "On Silence",
  "Vellum",
  "Keepsake",
];

const up = new THREE.Vector3(0, 1, 0);
const yawQuat = new THREE.Quaternion();
const localQuat = new THREE.Quaternion();
const combined = new THREE.Quaternion();
const localAxis = new THREE.Vector3();

function pose(
  frame: ShelfFrame,
  along: number,
  y: number,
  depth: number,
  lean: number,
  lying: boolean,
): { position: [number, number, number]; quaternion: [number, number, number, number] } {
  const inset = Math.max(0.04, frame.depth - 0.03 - depth / 2);
  const position: [number, number, number] = [
    frame.backLeft[0] + frame.run[0] * along + frame.normal[0] * inset,
    y,
    frame.backLeft[2] + frame.run[2] * along + frame.normal[2] * inset,
  ];
  yawQuat.setFromAxisAngle(up, frame.yaw);
  if (lying) localQuat.setFromAxisAngle(localAxis.set(0, 0, 1), Math.PI / 2);
  else if (lean !== 0) localQuat.setFromAxisAngle(localAxis.set(0, 0, 1), lean);
  else localQuat.identity();
  combined.multiplyQuaternions(yawQuat, localQuat);
  return { position, quaternion: [combined.x, combined.y, combined.z, combined.w] };
}

function plaqueFor(frame: ShelfFrame, label: string): Plaque {
  const top = Math.max(...frame.shelfYs) + (frame.wall === "window" ? 0.3 : 0.48);
  const mid = frame.width / 2;
  return {
    id: frame.id,
    label,
    yaw: frame.yaw,
    position: [
      frame.backLeft[0] + frame.run[0] * mid + frame.normal[0] * (frame.depth - 0.02),
      top,
      frame.backLeft[2] + frame.run[2] * mid + frame.normal[2] * (frame.depth - 0.02),
    ],
  };
}

type Slot = {
  along: number;
  thickness: number;
  height: number;
  depth: number;
  y: number;
  lying: boolean;
  lean: number;
  real: Book | null;
  shelf: number;
};

function packShelf(
  frame: ShelfFrame,
  shelfIndex: number,
  shelfY: number,
  reals: Book[],
  rng: () => number,
): Slot[] {
  const slots: Slot[] = [];
  let cursor = 0.04;
  const limit = frame.width - 0.04;
  let guard = 0;
  while (cursor < limit - 0.05 && guard < 40) {
    guard += 1;
    if (rng() < 0.1 && cursor > 0.18 && reals.length === 0) {
      cursor += range(rng, 0.05, 0.11);
      continue;
    }
    const lying = reals.length === 0 && shelfIndex === 0 && rng() < 0.045 && cursor < limit - 0.32;
    if (lying) {
      const height = range(rng, 0.22, 0.3);
      const thickness = range(rng, 0.032, 0.046);
      const depth = range(rng, 0.16, 0.22);
      const stack = 2 + Math.floor(rng() * 2);
      if (cursor + height > limit) break;
      for (let i = 0; i < stack; i++) {
        slots.push({
          along: cursor + height / 2,
          thickness,
          height,
          depth,
          y: shelfY + thickness / 2 + i * (thickness + 0.004),
          lying: true,
          lean: 0,
          real: null,
          shelf: shelfIndex,
        });
      }
      cursor += height + 0.02;
      continue;
    }
    const useReal = reals.length > 0 && (rng() < 0.55 || cursor > frame.width * 0.62);
    const book = useReal ? reals.shift()! : null;
    const thickness = book ? range(rng, 0.046, 0.082) : range(rng, 0.02, 0.058);
    const height = book ? range(rng, 0.26, 0.4) : range(rng, 0.22, 0.38);
    const depth = range(rng, 0.16, 0.23);
    const clearance = frame.shelfYs[shelfIndex + 1]
      ? frame.shelfYs[shelfIndex + 1]! - shelfY - 0.06
      : frame.wall === "window"
        ? 0.34
        : 0.62;
    const fitted = Math.min(height, clearance);
    if (cursor + thickness > limit) break;
    const lean = !book && rng() < 0.18 ? range(rng, -0.09, 0.09) : 0;
    slots.push({
      along: cursor + thickness / 2,
      thickness,
      height: fitted,
      depth,
      y: shelfY + fitted / 2,
      lying: false,
      lean,
      real: book,
      shelf: shelfIndex,
    });
    cursor += thickness + range(rng, 0.004, 0.012);
  }
  return slots;
}

export function placeCollection(books: Book[]): { placed: PlacedBook[]; plaques: Plaque[] } {
  const labels = labelFrames(books.map((book) => book.genre));
  const byGenre = new Map<string, Book[]>();
  for (const book of books) {
    const list = byGenre.get(book.genre) ?? [];
    list.push(book);
    byGenre.set(book.genre, list);
  }
  for (const list of byGenre.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  const queues = new Map<number, Book[]>();
  SHELF_FRAMES.forEach((frame, index) => {
    const genre = labels[index] ?? "Library";
    const owned = byGenre.get(genre) ?? [];
    const sectionIndexes = labels
      .map((label, section) => (label === genre ? section : -1))
      .filter((section) => section >= 0);
    const mine = sectionIndexes.indexOf(index);
    const share = Math.ceil(owned.length / Math.max(sectionIndexes.length, 1));
    queues.set(index, owned.splice(0, mine === sectionIndexes.length - 1 ? owned.length : share));
  });
  // Anything left over (a genre that lost the race) goes to the last bay of that label, else bay 0.
  for (const [genre, leftover] of byGenre) {
    if (leftover.length === 0) continue;
    let index = labels.lastIndexOf(genre);
    if (index < 0) index = 0;
    queues.get(index)!.push(...leftover);
    leftover.length = 0;
  }

  const placed: PlacedBook[] = [];
  const plaques: Plaque[] = [];
  let template = 0;

  SHELF_FRAMES.forEach((frame, index) => {
    const label = labels[index] || "Library";
    plaques.push(plaqueFor(frame, label));
    const reals = [...(queues.get(index) ?? [])];
    const perShelf: Book[][] = frame.shelfYs.map(() => []);
    const shelfOrder = [2, 1, 3, 4, 0];
    reals.forEach((book, bookIndex) => {
      const shelf = shelfOrder[bookIndex % shelfOrder.length]! % frame.shelfYs.length;
      perShelf[shelf]!.push(book);
    });
    const rng = mulberry32(hashString(frame.id + label));
    frame.shelfYs.forEach((shelfY, shelfIndex) => {
      const waiting = perShelf[shelfIndex] ?? [];
      const slots = packShelf(frame, shelfIndex, shelfY, waiting, rng);
      waiting.forEach((book, leftoverIndex) => {
        const thickness = 0.034;
        const height = Math.min(0.3, frame.wall === "window" ? 0.32 : 0.36);
        slots.push({
          along: 0.06 + thickness / 2 + leftoverIndex * (thickness + 0.008),
          thickness,
          height,
          depth: 0.18,
          y: shelfY + height / 2,
          lying: false,
          lean: 0,
          real: book,
          shelf: shelfIndex,
        });
      });
      for (const slot of slots) {
        const posed = pose(frame, slot.along, slot.y, slot.depth, slot.lean, slot.lying);
        const color = slot.real ? pick(rng, CLOTH) : CLOTH[(template + index) % CLOTH.length]!;
        const title = slot.real?.title ?? FILLER_WORDS[template % FILLER_WORDS.length]!;
        placed.push({
          key: slot.real?.id ?? `filler-${frame.id}-${placed.length}`,
          bookId: slot.real?.id ?? null,
          title,
          position: posed.position,
          quaternion: posed.quaternion,
          size: [slot.thickness, slot.height, slot.depth],
          normal: frame.normal,
          color,
          template: slot.real ? -1 : template % 48,
          shade: slot.real?.status === "lent" ? 0.58 : 0.9 + rng() * 0.1,
          lent: slot.real?.status === "lent",
        });
        if (!slot.real) template += 1;
      }
    });
  });

  return { placed, plaques };
}

export const FILLER_TEMPLATE_COUNT = 48;
export const FILLER_WORDS_FOR_ATLAS = FILLER_WORDS;
export const CLOTH_COLORS = CLOTH;
