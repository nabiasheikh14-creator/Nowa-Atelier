export const ROOM = {
  width: 12.6,
  depth: 9.4,
  height: 4.75,
  wall: 0.16,
};

/** Inner face of the walls. Shelves sit against this, not inside the plaster. */
export const INNER = {
  x: ROOM.width / 2 - ROOM.wall,
  z: ROOM.depth / 2 - ROOM.wall,
};

export const EYE = 1.62;

export const CAMERA_BOUNDS = {
  minX: -5.55,
  maxX: 5.55,
  minZ: -3.85,
  maxZ: 3.85,
};

export const OBSTACLES = [
  { x: 0, z: -3.48, r: 0.78 },
  { x: 0.95, z: 1.28, r: 0.72 },
  { x: 1.82, z: 0.78, r: 0.46 },
  { x: -1.55, z: 1.22, r: 0.5 },
];

export type WallId = "backL" | "backR" | "left" | "right" | "window";

export type ShelfFrame = {
  id: string;
  wall: WallId;
  width: number;
  depth: number;
  shelfYs: number[];
  /** Back-left corner of the clear opening, on the back panel, at y = 0. */
  backLeft: [number, number, number];
  run: [number, number, number];
  normal: [number, number, number];
  yaw: number;
};

const TALL: number[] = [0.34, 1.08, 1.82, 2.56, 3.3];
const LOW: number[] = [0.32, 0.7];
const OPENING = 1.04;
const CASE = 1.18;
const DEPTH = 0.4;

function casesAlong(
  wall: WallId,
  count: number,
  origin: [number, number, number],
  run: [number, number, number],
  normal: [number, number, number],
  yaw: number,
  shelfYs: number[],
  idPrefix: string,
): ShelfFrame[] {
  const frames: ShelfFrame[] = [];
  for (let i = 0; i < count; i++) {
    const backLeft: [number, number, number] = [
      origin[0] + run[0] * (i * CASE + 0.07),
      0,
      origin[2] + run[2] * (i * CASE + 0.07),
    ];
    frames.push({
      id: `${idPrefix}-${i}`,
      wall,
      width: OPENING,
      depth: DEPTH,
      shelfYs,
      backLeft,
      run,
      normal,
      yaw,
    });
  }
  return frames;
}

export const SHELF_FRAMES: ShelfFrame[] = [
  ...casesAlong("backL", 4, [-5.58, 0, -INNER.z], [1, 0, 0], [0, 0, 1], 0, TALL, "back-l"),
  ...casesAlong("backR", 4, [0.92, 0, -INNER.z], [1, 0, 0], [0, 0, 1], 0, TALL, "back-r"),
  ...casesAlong("left", 5, [-INNER.x, 0, -3.72], [0, 0, 1], [1, 0, 0], Math.PI / 2, TALL, "left"),
  ...casesAlong("right", 5, [INNER.x, 0, -3.72], [0, 0, 1], [-1, 0, 0], -Math.PI / 2, TALL, "right"),
  ...casesAlong("window", 2, [-5.35, 0, INNER.z], [1, 0, 0], [0, 0, -1], Math.PI, LOW, "win-l"),
  ...casesAlong("window", 2, [1.95, 0, INNER.z], [1, 0, 0], [0, 0, -1], Math.PI, LOW, "win-r"),
];

const PREFER: Partial<Record<string, WallId>> = {
  Fantasy: "backL",
  Classics: "backR",
  Design: "left",
  History: "right",
  "Self-Help": "window",
};

function uniqueStable(genres: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  const preferred = ["Fantasy", "Classics", "Design", "Self-Help", "History"];
  for (const genre of [...preferred, ...genres]) {
    if (!genres.includes(genre) || seen.has(genre)) continue;
    seen.add(genre);
    ordered.push(genre);
  }
  return ordered;
}

/** Each genre owns at least one bay. A new genre takes a free wall, or one bay from the fullest wall. */
export function labelFrames(genres: string[]): string[] {
  const frames = SHELF_FRAMES;
  const labels = frames.map(() => "");
  const unique = uniqueStable(genres);
  if (unique.length === 0) return labels.map(() => "Library");

  const used = new Set<string>();
  for (const genre of unique) {
    const wall = PREFER[genre];
    if (!wall) continue;
    const indexes = frames
      .map((frame, index) => (frame.wall === wall ? index : -1))
      .filter((index) => index >= 0);
    if (indexes.length === 0 || indexes.some((index) => labels[index] !== "")) continue;
    indexes.forEach((index) => {
      labels[index] = genre;
    });
    used.add(genre);
  }

  const walls: WallId[] = ["backL", "backR", "left", "right", "window"];
  const emptyWalls = walls.filter((wall) =>
    frames.every((frame, index) => frame.wall !== wall || labels[index] === ""),
  );
  for (const genre of unique) {
    if (used.has(genre)) continue;
    const wall = emptyWalls.shift();
    if (!wall) break;
    frames.forEach((frame, index) => {
      if (frame.wall === wall) labels[index] = genre;
    });
    used.add(genre);
  }

  for (const genre of unique) {
    if (used.has(genre)) continue;
    const counts = new Map<string, number>();
    labels.forEach((label) => {
      if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    let victim = "";
    let best = 1;
    for (const [label, count] of counts) {
      if (count > best) {
        best = count;
        victim = label;
      }
    }
    const index = labels.findIndex((label) => label === victim);
    if (index >= 0) labels[index] = genre;
    used.add(genre);
  }

  const openWalls = walls.filter((wall) =>
    frames.some((frame, index) => frame.wall === wall && labels[index] === ""),
  );
  openWalls.forEach((wall, index) => {
    const genre = unique[index % unique.length]!;
    frames.forEach((frame, frameIndex) => {
      if (frame.wall === wall && labels[frameIndex] === "") labels[frameIndex] = genre;
    });
  });

  return labels.map((label, index) => label || unique[index % unique.length] || "Library");
}

export function clampCamera(x: number, z: number): { x: number; z: number } {
  let cx = Math.min(CAMERA_BOUNDS.maxX, Math.max(CAMERA_BOUNDS.minX, x));
  let cz = Math.min(CAMERA_BOUNDS.maxZ, Math.max(CAMERA_BOUNDS.minZ, z));
  for (const obstacle of OBSTACLES) {
    const dx = cx - obstacle.x;
    const dz = cz - obstacle.z;
    const distance = Math.hypot(dx, dz);
    if (distance < obstacle.r && distance > 0.0001) {
      cx = obstacle.x + (dx / distance) * obstacle.r;
      cz = obstacle.z + (dz / distance) * obstacle.r;
    }
  }
  return {
    x: Math.min(CAMERA_BOUNDS.maxX, Math.max(CAMERA_BOUNDS.minX, cx)),
    z: Math.min(CAMERA_BOUNDS.maxZ, Math.max(CAMERA_BOUNDS.minZ, cz)),
  };
}
