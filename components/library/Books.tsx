"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { type Plaque, type PlacedBook } from "@/lib/placement";
import { SPINE_ASPECT, spineArt, spineAuthor, spineTitle, type SpineArt, type SpineMark } from "@/lib/spine-design";
import { hoverTip, pointerGate } from "./input-state";

const MAX_ATLAS = 4096;
const UNIT_BOX = new THREE.Box3(new THREE.Vector3(-0.5, -0.5, -0.5), new THREE.Vector3(0.5, 0.5, 0.5));
const inverseWorld = new THREE.Matrix4();
const inverseInstance = new THREE.Matrix4();
const instanceMatrix = new THREE.Matrix4();
const worldRay = new THREE.Ray();
const localRay = new THREE.Ray();
const scratchPosition = new THREE.Vector3();
const scratchQuaternion = new THREE.Quaternion();
const scratchScale = new THREE.Vector3();
const hitPoint = new THREE.Vector3();
const closestPoint = new THREE.Vector3();

const spineVertex = /* glsl */ `
attribute vec2 aAtlas;
attribute float aShade;
varying vec2 vUv;
varying vec3 vNormalW;
varying float vShade;
varying vec2 vAtlas;

void main() {
  vUv = uv;
  vAtlas = aAtlas;
  vShade = aShade;
  mat4 im = instanceMatrix;
  mat3 m = mat3(im);
  float sx = max(length(m[0]), 0.0001);
  float sy = max(length(m[1]), 0.0001);
  float sz = max(length(m[2]), 0.0001);
  mat3 r = mat3(m[0] / sx, m[1] / sy, m[2] / sz);
  vNormalW = normalize(mat3(modelMatrix) * r * vec3(normal.x / sx, normal.y / sy, normal.z / sz));
  vec4 world = modelMatrix * im * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const spineFragment = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec2 uAtlasScale;
uniform vec3 uMoonDir;
uniform vec3 uMoonColor;
uniform vec3 uLampDir;
uniform vec3 uLampColor;
uniform vec3 uFillDir;
uniform vec3 uFillColor;
uniform vec3 uAmbient;
varying vec2 vUv;
varying vec3 vNormalW;
varying float vShade;
varying vec2 vAtlas;

void main() {
  vec2 uv = vUv * uAtlasScale + vAtlas;
  vec3 albedo = texture2D(uAtlas, uv).rgb;
  vec3 N = normalize(vNormalW);
  float moon = max(dot(N, normalize(uMoonDir)), 0.0);
  float lamp = max(dot(N, normalize(uLampDir)), 0.0);
  float fill = max(dot(N, normalize(uFillDir)), 0.0);
  float edge = smoothstep(0.0, 0.5, min(vUv.x, 1.0 - vUv.x));
  vec3 light = uAmbient + uMoonColor * moon + uLampColor * lamp + uFillColor * fill;
  gl_FragColor = vec4(albedo * light * mix(0.94, 1.0, edge) * vShade, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

type Atlas = {
  texture: THREE.CanvasTexture;
  cols: number;
  rows: number;
  indexes: number[];
};

function fontStack(face: SpineArt["face"], size: number, role: "title" | "meta") {
  const family =
    face === "serif"
      ? role === "title"
        ? "Spine Serif"
        : "Spine Serif Text"
      : role === "title"
        ? "Spine Sans"
        : "Spine Sans Text";
  const fallback = face === "serif" ? "Palatino, Georgia, serif" : '"Arial Narrow", sans-serif';
  return `${size}px "${family}", ${fallback}`;
}

function chooseGrid(count: number, maxSize: number) {
  const limit = Math.max(512, Math.min(MAX_ATLAS, maxSize));
  let best: { cols: number; cellW: number; cellH: number } | null = null;
  for (let cols = 8; cols <= 40; cols += 1) {
    const rows = Math.ceil(count / cols);
    const cellH = Math.floor(limit / rows);
    const cellW = Math.floor(cellH * SPINE_ASPECT);
    if (cellW < 40 || cellH < 200 || cols * cellW > limit) continue;
    if (!best || cellH > best.cellH) best = { cols, cellW, cellH };
  }
  if (best) return best;
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / cols);
  const cellH = Math.max(64, Math.floor(limit / rows));
  return { cols, cellW: Math.max(16, Math.floor(cellH * SPINE_ASPECT)), cellH };
}

async function loadSpineFonts() {
  const files: [string, string][] = [
    ["Spine Serif", "/fonts/LibreBaskerville-Bold.ttf"],
    ["Spine Serif Text", "/fonts/LibreBaskerville-Regular.ttf"],
    ["Spine Sans", "/fonts/BarlowCondensed-SemiBold.ttf"],
    ["Spine Sans Text", "/fonts/BarlowCondensed-Medium.ttf"],
  ];
  await Promise.all(
    files.map(async ([family, url]) => {
      const face = new FontFace(family, `url(${url})`);
      document.fonts.add(await face.load());
    }),
  );
}

function splitTitle(title: string): [string, string] | null {
  const words = title.split(" ");
  if (words.length < 3) return null;
  let at = 1;
  let score = Infinity;
  for (let index = 1; index < words.length; index += 1) {
    const next = Math.abs(words.slice(0, index).join(" ").length - words.slice(index).join(" ").length);
    if (next < score) {
      score = next;
      at = index;
    }
  }
  return [words.slice(0, at).join(" "), words.slice(at).join(" ")];
}

function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, mark: SpineMark) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.25, size * 0.1);
  if (mark === "star") {
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? size : size * 0.42;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (mark === "hallows") {
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.moveTo(0, -size * 0.72);
    ctx.lineTo(size * 0.68, size * 0.5);
    ctx.lineTo(-size * 0.68, size * 0.5);
    ctx.closePath();
    ctx.moveTo(0, -size * 0.72);
    ctx.lineTo(0, size * 0.5);
    ctx.stroke();
  } else if (mark === "sun") {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSpinePanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  author: string,
) {
  const art = spineArt(title);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = art.ground;
  ctx.fillRect(x, y, w, h);

  const band = art.layout === "plain" ? 0 : Math.round(h * (art.layout === "classic" ? 0.09 : 0.068));
  if (band > 0) {
    ctx.fillStyle = art.band;
    ctx.fillRect(x, y, w, band);
    ctx.fillRect(x, y + h - band, w, band);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = art.layout === "classic" ? "#f7f4ef" : art.ink;
    ctx.fillRect(x + w * 0.16, y + band + h * 0.012, w * 0.68, Math.max(1, h * 0.0035));
    ctx.fillRect(x + w * 0.16, y + h - band - h * 0.016, w * 0.68, Math.max(1, h * 0.0035));
    ctx.globalAlpha = 1;
  } else {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = art.band;
    ctx.fillRect(x + w * 0.16, y + h * 0.05, w * 0.68, Math.max(1, h * 0.004));
    ctx.fillRect(x + w * 0.16, y + h * 0.945, w * 0.68, Math.max(1, h * 0.004));
    ctx.globalAlpha = 1;
  }

  const sheen = ctx.createLinearGradient(x, y, x + w, y);
  sheen.addColorStop(0, "rgba(255,255,255,0.13)");
  sheen.addColorStop(0.2, "rgba(255,255,255,0)");
  sheen.addColorStop(0.8, "rgba(0,0,0,0)");
  sheen.addColorStop(1, "rgba(0,0,0,0.14)");
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);

  const label = spineTitle(title, art);
  const byline = spineAuthor(author, art);
  const span = h - band * 2 - h * 0.08;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = art.face === "sans" ? "0.04em" : "0.01em";

  const measure = (text: string, size: number, role: "title" | "meta") => {
    ctx.font = fontStack(art.face, size, role);
    return ctx.measureText(text).width;
  };
  let lines = [label];
  let size = Math.floor(w * 0.56);
  const maxAlong = span * 0.66;
  while (size > w * 0.32 && measure(label, size, "title") > maxAlong) size -= 2;
  if (measure(label, size, "title") > maxAlong) {
    const split = splitTitle(label);
    if (split) {
      lines = [split[0], split[1]];
      size = Math.floor(w * 0.4);
      while (size > w * 0.26 && Math.max(measure(lines[0]!, size, "title"), measure(lines[1]!, size, "title")) > maxAlong) {
        size -= 2;
      }
    }
  }
  let bylineSize = Math.max(11, Math.floor(size * 0.46));
  const titleAlong = Math.max(...lines.map((line) => measure(line, size, "title")));
  let authorAlong = measure(byline, bylineSize, "meta");
  while (bylineSize > 10 && authorAlong > span * 0.28) {
    bylineSize -= 1;
    authorAlong = measure(byline, bylineSize, "meta");
  }
  const gap = span * 0.045;
  const block = titleAlong + gap + authorAlong;
  const titleCenter = -block / 2 + titleAlong / 2;
  const authorCenter = block / 2 - authorAlong / 2;

  ctx.fillStyle = art.ink;
  ctx.font = fontStack(art.face, size, "title");
  lines.forEach((line, index) => {
    const across = (index - (lines.length - 1) / 2) * size * 1.08;
    ctx.fillText(line, titleCenter, across);
  });
  ctx.fillStyle = art.mute;
  ctx.font = fontStack(art.face, bylineSize, "meta");
  ctx.fillText(byline, authorCenter, 0);
  ctx.restore();

  if (art.mark) {
    drawMark(ctx, x + w / 2, y + h - band - h * 0.055, Math.max(7, w * 0.16), art.ink, art.mark);
  }
  if (art.foot && band > 10) {
    ctx.fillStyle = art.layout === "classic" || art.ink === art.band ? "#f7f4ef" : art.ink;
    ctx.font = fontStack(art.face, Math.max(9, Math.floor(w * 0.15)), "meta");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "0.12em";
    ctx.fillText(art.foot, x + w / 2, y + h - band / 2);
  }
  ctx.restore();
}

async function paintSpineAtlas(placed: PlacedBook[], renderer: THREE.WebGLRenderer): Promise<Atlas> {
  try {
    await loadSpineFonts();
  } catch {
    // Georgia and Arial Narrow still set a real spine.
  }
  const books = placed.length > 0 ? placed : [{ title: "Volume", author: "" } as PlacedBook];
  const maxSize = renderer.capabilities.maxTextureSize || MAX_ATLAS;
  const { cols, cellW, cellH } = chooseGrid(books.length, maxSize);
  const rows = Math.max(1, Math.ceil(books.length / cols));
  const canvas = document.createElement("canvas");
  canvas.width = cols * cellW;
  canvas.height = rows * cellH;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Could not draw the spines");
  books.forEach((book, index) => {
    const left = (index % cols) * cellW;
    const top = Math.floor(index / cols) * cellH;
    drawSpinePanel(ctx, left, top, cellW, cellH, book.title, book.author);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return { texture, cols, rows, indexes: books.map((_, index) => index) };
}


function makeSpineMaterial(atlas: Atlas): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uAtlas: { value: atlas.texture },
      uAtlasScale: { value: new THREE.Vector2(1 / atlas.cols, 1 / atlas.rows) },
      uMoonDir: { value: new THREE.Vector3(0.15, 0.42, 0.88).normalize() },
      uMoonColor: { value: new THREE.Color("#f4f7fb").multiplyScalar(0.08) },
      uLampDir: { value: new THREE.Vector3(0.75, 0.4, 0.2).normalize() },
      uLampColor: { value: new THREE.Color("#fff1df").multiplyScalar(0.06) },
      uFillDir: { value: new THREE.Vector3(-0.15, 0.9, -0.2).normalize() },
      uFillColor: { value: new THREE.Color("#fff6ea").multiplyScalar(0.04) },
      uAmbient: { value: new THREE.Color("#ffffff").multiplyScalar(1.05) },
    },
    vertexShader: spineVertex,
    fragmentShader: spineFragment,
  });
}

export function Books({
  placed,
  plaques,
  focusId,
  onOpen,
}: {
  placed: PlacedBook[];
  plaques: Plaque[];
  focusId: string | null;
  onOpen: (id: string) => void;
}) {
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const ribbons = useRef<THREE.InstancedMesh>(null);
  const pull = useRef<Float32Array>(new Float32Array(placed.length));
  const hoverIndex = useRef<number | null>(null);
  const pressed = useRef<number | null>(null);
  const lastHover = useRef<{ index: number; x: number; y: number } | null>(null);
  const gl = useThree((state) => state.gl);
  const focusRef = useRef(focusId);
  const onOpenRef = useRef(onOpen);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const placedRef = useRef(placed);
  useEffect(() => {
    focusRef.current = focusId;
    onOpenRef.current = onOpen;
    placedRef.current = placed;
  }, [focusId, onOpen, placed]);

  const raycast = useCallback((raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) => {
    const current = mesh.current;
    const books = placedRef.current;
    if (!current || books.length === 0) return;
    current.updateWorldMatrix(true, false);
    inverseWorld.copy(current.matrixWorld).invert();
    worldRay.copy(raycaster.ray).applyMatrix4(inverseWorld);
    let closest = Infinity;
    let closestIndex = -1;
    for (let index = 0; index < books.length; index++) {
      const book = books[index]!;
      const shift = pull.current[index] ?? 0;
      scratchPosition.set(
        book.position[0] + book.normal[0] * shift,
        book.position[1],
        book.position[2] + book.normal[2] * shift,
      );
      scratchQuaternion.set(book.quaternion[0], book.quaternion[1], book.quaternion[2], book.quaternion[3]);
      scratchScale.set(book.size[0] + 0.02, book.size[1], book.size[2]);
      instanceMatrix.compose(scratchPosition, scratchQuaternion, scratchScale);
      inverseInstance.copy(instanceMatrix).invert();
      localRay.copy(worldRay).applyMatrix4(inverseInstance);
      if (!localRay.intersectBox(UNIT_BOX, hitPoint)) continue;
      hitPoint.applyMatrix4(instanceMatrix).applyMatrix4(current.matrixWorld);
      const distance = raycaster.ray.origin.distanceTo(hitPoint);
      if (distance < raycaster.near || distance > raycaster.far || distance >= closest) continue;
      closest = distance;
      closestIndex = index;
      closestPoint.copy(hitPoint);
    }
    if (closestIndex < 0) return;
    intersects.push({
      distance: closest,
      point: closestPoint.clone(),
      object: current,
      instanceId: closestIndex,
    });
  }, []);

  useEffect(() => {
    let dead = false;
    void paintSpineAtlas(placed, gl).then((next) => {
      if (dead) {
        next.texture.dispose();
        return;
      }
      setAtlas((previous) => {
        previous?.texture.dispose();
        return next;
      });
    });
    return () => {
      dead = true;
    };
  }, [placed, gl]);

  useEffect(() => {
    pull.current = new Float32Array(placed.length);
  }, [placed]);

  const built = useMemo(() => {
    if (!atlas) return null;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const uv = new Float32Array(placed.length * 2);
    const shade = new Float32Array(placed.length);
    placed.forEach((book, index) => {
      const cell = atlas.indexes[index] ?? 0;
      const col = cell % atlas.cols;
      const row = Math.floor(cell / atlas.cols);
      uv[index * 2] = col / atlas.cols;
      uv[index * 2 + 1] = 1 - (row + 1) / atlas.rows;
      shade[index] = book.shade;
    });
    geometry.setAttribute("aAtlas", new THREE.InstancedBufferAttribute(uv, 2));
    geometry.setAttribute("aShade", new THREE.InstancedBufferAttribute(shade, 1));
    const page = new THREE.MeshStandardMaterial({ color: "#efe6d4", roughness: 0.92 });
    const board = new THREE.MeshStandardMaterial({ color: "#2a1c14", roughness: 0.8 });
    const materials = [board, board, page, board, makeSpineMaterial(atlas), page];
    return { geometry, materials };
  }, [atlas, placed]);

  useLayoutEffect(() => {
    const current = mesh.current;
    if (!current) return;
    placed.forEach((book, index) => {
      dummy.position.set(book.position[0], book.position[1], book.position[2]);
      dummy.quaternion.set(book.quaternion[0], book.quaternion[1], book.quaternion[2], book.quaternion[3]);
      dummy.scale.set(book.size[0], book.size[1], book.size[2]);
      dummy.updateMatrix();
      current.setMatrixAt(index, dummy.matrix);
    });
    current.instanceMatrix.needsUpdate = true;
    current.computeBoundingSphere();
  }, [built, dummy, placed]);

  const lent = useMemo(
    () => placed.flatMap((book, index) => (book.lent && book.bookId ? [{ book, index }] : [])),
    [placed],
  );
  const lentByBook = useMemo(() => {
    const map = new Map<number, number>();
    lent.forEach((item, ribbon) => map.set(item.index, ribbon));
    return map;
  }, [lent]);

  useLayoutEffect(() => {
    const current = ribbons.current;
    if (!current) return;
    const offset = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    lent.forEach((item, ribbon) => {
      quaternion.fromArray(item.book.quaternion);
      offset.set(0, item.book.size[1] / 2 - 0.03, item.book.size[2] / 2 + 0.012).applyQuaternion(quaternion);
      dummy.position.set(item.book.position[0], item.book.position[1], item.book.position[2]).add(offset);
      dummy.quaternion.copy(quaternion);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      current.setMatrixAt(ribbon, dummy.matrix);
    });
    if (lent.length) current.instanceMatrix.needsUpdate = true;
  }, [dummy, lent]);

  useFrame((_, delta) => {
    const current = mesh.current;
    if (!current) return;
    const hover = hoverIndex.current;
    const focus = focusRef.current;
    const offset = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    let dirty = false;
    let ribbonsDirty = false;
    for (let index = 0; index < placed.length; index++) {
      const book = placed[index]!;
      const target = book.bookId === focus ? 0.16 : index === hover ? 0.035 : 0;
      const currentPull = pull.current[index] ?? 0;
      const next = THREE.MathUtils.damp(currentPull, target, 8, delta);
      if (Math.abs(next - currentPull) < 0.0003) continue;
      pull.current[index] = next;
      dummy.position.set(
        book.position[0] + book.normal[0] * next,
        book.position[1],
        book.position[2] + book.normal[2] * next,
      );
      dummy.quaternion.set(book.quaternion[0], book.quaternion[1], book.quaternion[2], book.quaternion[3]);
      dummy.scale.set(book.size[0], book.size[1], book.size[2]);
      dummy.updateMatrix();
      current.setMatrixAt(index, dummy.matrix);
      dirty = true;
      const ribbon = lentByBook.get(index);
      if (ribbon !== undefined && ribbons.current) {
        quaternion.fromArray(book.quaternion);
        offset.set(0, book.size[1] / 2 - 0.03, book.size[2] / 2 + 0.012).applyQuaternion(quaternion);
        dummy.position.add(offset);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        ribbons.current.setMatrixAt(ribbon, dummy.matrix);
        ribbonsDirty = true;
      }
    }
    if (dirty) current.instanceMatrix.needsUpdate = true;
    if (ribbonsDirty && ribbons.current) ribbons.current.instanceMatrix.needsUpdate = true;
  });

  useEffect(() => {
    const up = (event: PointerEvent) => {
      const fromPress = pressed.current;
      pressed.current = null;
      if (pointerGate.dragged) return;
      let index = fromPress;
      const last = lastHover.current;
      if (index === null && last) {
        const dx = event.clientX - last.x;
        const dy = event.clientY - last.y;
        if (dx * dx + dy * dy <= 36 * 36) index = last.index;
      }
      if (index === null) return;
      const book = placedRef.current[index];
      if (!book?.bookId) return;
      onOpenRef.current(book.bookId);
    };
    const clear = () => {
      pressed.current = null;
    };
    const element = gl.domElement;
    element.addEventListener("pointerdown", clear, true);
    element.addEventListener("pointerup", up);
    return () => {
      element.removeEventListener("pointerdown", clear, true);
      element.removeEventListener("pointerup", up);
    };
  }, [gl]);

  function down(event: ThreeEvent<PointerEvent>) {
    pressed.current = typeof event.instanceId === "number" ? event.instanceId : null;
  }

  function move(event: ThreeEvent<PointerEvent>) {
    const index = event.instanceId;
    if (typeof index !== "number") return;
    const book = placed[index];
    const canvas = event.nativeEvent.target as HTMLElement;
    hoverIndex.current = index;
    lastHover.current = { index, x: event.nativeEvent.clientX, y: event.nativeEvent.clientY };
    hoverTip.show(book.title, event.nativeEvent.clientX, event.nativeEvent.clientY);
    canvas.style.cursor = book.bookId ? "pointer" : "default";
  }

  function leave(event: ThreeEvent<PointerEvent>) {
    hoverIndex.current = null;
    hoverTip.hide();
    (event.nativeEvent.target as HTMLElement).style.cursor = "";
  }

  return (
    <group>
      {built && (
        <instancedMesh
          key={built.geometry.uuid}
          ref={mesh}
          args={[built.geometry, built.materials, placed.length]}
          frustumCulled={false}
          raycast={raycast}
          onPointerDown={down}
          onPointerMove={move}
          onPointerOut={leave}
        />
      )}
      {lent.length > 0 && (
        <instancedMesh ref={ribbons} args={[undefined, undefined, lent.length]} frustumCulled={false} raycast={() => null}>
          <boxGeometry args={[0.02, 0.15, 0.01]} />
          <meshStandardMaterial color={"#8e2436"} roughness={0.5} />
        </instancedMesh>
      )}
      {plaques.map((plaque) => (
        <group key={plaque.id} position={plaque.position} rotation={[0, plaque.yaw, 0]} raycast={() => null}>
          <mesh>
            <boxGeometry args={[Math.max(0.16, plaque.width - 0.02), 0.09, 0.012]} />
            <meshStandardMaterial color={"#b08d57"} metalness={0.74} roughness={0.3} />
          </mesh>
          <Text
            font="/fonts/CormorantGaramond-Medium.ttf"
            position={[0, -0.002, 0.01]}
            fontSize={plaque.width < 0.34 ? 0.015 : 0.02}
            color={"#3a2914"}
            anchorX="center"
            anchorY="middle"
            maxWidth={Math.max(0.14, plaque.width - 0.04)}
            textAlign="center"
            letterSpacing={0.03}
          >
            {plaque.label.toUpperCase()}
          </Text>
        </group>
      ))}
    </group>
  );
}
