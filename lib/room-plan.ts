export const GENRE_ORDER = [
  "Fantasy",
  "Speculative",
  "Romance",
  "Literary",
  "Classics",
  "South Asian",
  "Poetry",
  "Mystery",
  "Memoir",
  "East Asian",
  "Mind",
  "Reference",
] as const;

export const SHELF_YS = [0.24, 0.76, 1.28];
const CASE_DEPTH = 0.26;
const SLOT = 0.042;
const BAY_PAD = 0.06;
const MIN_BAY = 0.2;
const POST = 0.038;
const SIDE = 0.82;

export type ShelfFrame = {
  id: string;
  genre: string;
  width: number;
  depth: number;
  shelfYs: number[];
  backLeft: [number, number, number];
  run: [number, number, number];
  normal: [number, number, number];
  yaw: number;
};

export type RoomPlan = {
  width: number;
  depth: number;
  height: number;
  wall: number;
  inner: { x: number; z: number };
  home: { x: number; y: number; z: number; yaw: number; pitch: number };
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  obstacles: { x: number; z: number; r: number }[];
};

export function layoutRoom(counts: { genre: string; count: number }[]): { room: RoomPlan; frames: ShelfFrame[] } {
  const byGenre = new Map(counts.map((item) => [item.genre, item.count]));
  const genres = [
    ...GENRE_ORDER.filter((genre) => (byGenre.get(genre) ?? 0) > 0),
    ...counts.map((item) => item.genre).filter((genre) => !GENRE_ORDER.includes(genre as (typeof GENRE_ORDER)[number])),
  ];

  const widths = genres.map((genre) => {
    const count = byGenre.get(genre) ?? 1;
    const across = Math.max(1, Math.ceil(count / SHELF_YS.length));
    return Math.max(MIN_BAY, across * SLOT + BAY_PAD);
  });
  const span = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, widths.length - 1) * POST;

  const wall = 0.1;
  const height = 2.22;
  // Vertical fov is 60°. Fit the wall to a desktop window that is a little taller than 16:10.
  const halfHorizontal = Math.atan(Math.tan((30 * Math.PI) / 180) * 1.4);
  const view = span / 2 / Math.tan(halfHorizontal) + 0.42;
  const depth = view + CASE_DEPTH + 0.85 + wall * 2;
  const width = span + SIDE * 2 + wall * 2;
  const inner = { x: width / 2 - wall, z: depth / 2 - wall };
  const backZ = -inner.z;

  let cursor = -span / 2;
  const frames: ShelfFrame[] = widths.map((bay, index) => {
    const frame: ShelfFrame = {
      id: genres[index]!.toLowerCase().replace(/\s+/g, "-"),
      genre: genres[index]!,
      width: bay,
      depth: CASE_DEPTH,
      shelfYs: SHELF_YS,
      backLeft: [cursor, 0, backZ],
      run: [1, 0, 0],
      normal: [0, 0, 1],
      yaw: 0,
    };
    cursor += bay + POST;
    return frame;
  });

  const homeZ = backZ + CASE_DEPTH - 0.02 + view;
  const room: RoomPlan = {
    width,
    depth,
    height,
    wall,
    inner,
    home: { x: 0, y: 0.98, z: Math.min(homeZ, inner.z - 0.34), yaw: 0, pitch: 0 },
    bounds: {
      minX: -span / 2 + 0.02,
      maxX: span / 2 - 0.02,
      minZ: backZ + CASE_DEPTH + 0.48,
      maxZ: inner.z - 0.28,
    },
    obstacles: [
      { x: -inner.x + 0.38, z: inner.z - 0.62, r: 0.3 },
      { x: inner.x - 0.38, z: inner.z - 0.55, r: 0.26 },
    ],
  };
  return { room, frames };
}

export function clampCamera(x: number, z: number, room: RoomPlan): { x: number; z: number } {
  let cx = Math.min(room.bounds.maxX, Math.max(room.bounds.minX, x));
  let cz = Math.min(room.bounds.maxZ, Math.max(room.bounds.minZ, z));
  for (const obstacle of room.obstacles) {
    const dx = cx - obstacle.x;
    const dz = cz - obstacle.z;
    const distance = Math.hypot(dx, dz);
    if (distance < obstacle.r && distance > 0.0001) {
      cx = obstacle.x + (dx / distance) * obstacle.r;
      cz = obstacle.z + (dz / distance) * obstacle.r;
    }
  }
  return {
    x: Math.min(room.bounds.maxX, Math.max(room.bounds.minX, cx)),
    z: Math.min(room.bounds.maxZ, Math.max(room.bounds.minZ, cz)),
  };
}
