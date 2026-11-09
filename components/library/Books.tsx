"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import {
  CLOTH_COLORS,
  FILLER_TEMPLATE_COUNT,
  FILLER_WORDS_FOR_ATLAS,
  type Plaque,
  type PlacedBook,
} from "@/lib/placement";
import { hoverTip, pointerGate } from "./input-state";

const COLS = 16;
const CELL_W = 96;
const CELL_H = 240;
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
  float edge = smoothstep(0.0, 0.18, min(vUv.x, 1.0 - vUv.x));
  vec3 light = uAmbient + uMoonColor * moon + uLampColor * lamp + uFillColor * fill;
  gl_FragColor = vec4(albedo * light * mix(0.62, 1.0, edge) * vShade, 1.0);
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

function drawSpine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  title: string,
  color: string,
  ornament: boolean,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, CELL_W, CELL_H);
  const grad = ctx.createLinearGradient(x, y, x + CELL_W, y);
  grad.addColorStop(0, "rgba(0,0,0,0.4)");
  grad.addColorStop(0.2, "rgba(255,255,255,0.06)");
  grad.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, CELL_W, CELL_H);
  ctx.fillStyle = "rgba(255, 220, 160, 0.9)";
  ctx.fillRect(x + 12, y + 18, CELL_W - 24, 3);
  ctx.fillRect(x + 12, y + CELL_H - 22, CELL_W - 24, 3);
  if (!ornament) {
    ctx.fillStyle = "#e7cb8e";
    ctx.beginPath();
    ctx.moveTo(x + CELL_W / 2, y + 30);
    ctx.lineTo(x + CELL_W / 2 + 10, y + 42);
    ctx.lineTo(x + CELL_W / 2, y + 54);
    ctx.lineTo(x + CELL_W / 2 - 10, y + 42);
    ctx.closePath();
    ctx.fill();
  }

  const label = title.length > 34 ? `${title.slice(0, 32)}…` : title;
  ctx.save();
  ctx.translate(x + CELL_W / 2, y + CELL_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = ornament ? 26 : 32;
  const maxWidth = CELL_H - 88;
  do {
    ctx.font = `500 ${size}px "Cormorant Shelf", Palatino, Georgia, serif`;
    if (ctx.measureText(label).width <= maxWidth) break;
    size -= 2;
  } while (size > 14);
  ctx.fillStyle = "rgba(70, 42, 12, 0.75)";
  ctx.fillText(label, 1.5, 2);
  ctx.fillStyle = "#e7cb8e";
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

async function buildAtlas(placed: PlacedBook[]): Promise<Atlas> {
  try {
    const face = new FontFace("Cormorant Shelf", "url(/fonts/CormorantGaramond-Medium.ttf)");
    document.fonts.add(await face.load());
  } catch {
    // The canvas falls back to Georgia.
  }

  const cells: { title: string; color: string; ornament: boolean }[] = [];
  for (let index = 0; index < FILLER_TEMPLATE_COUNT; index++) {
    cells.push({
      title: FILLER_WORDS_FOR_ATLAS[index % FILLER_WORDS_FOR_ATLAS.length] || "Volume",
      color: CLOTH_COLORS[index % CLOTH_COLORS.length] || "#3e2a22",
      ornament: true,
    });
  }
  const indexes = placed.map((book) => {
    if (!book.bookId) return 0;
    cells.push({ title: book.title, color: book.color, ornament: false });
    return cells.length - 1;
  });
  if (cells.length === 0) cells.push({ title: "Volume", color: "#3e2a22", ornament: false });

  const rows = Math.max(1, Math.ceil(cells.length / COLS));
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL_W;
  canvas.height = rows * CELL_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the spines");
  cells.forEach((cell, index) => {
    drawSpine(ctx, (index % COLS) * CELL_W, Math.floor(index / COLS) * CELL_H, cell.title, cell.color, cell.ornament);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return { texture, cols: COLS, rows, indexes };
}

function makeSpineMaterial(atlas: Atlas): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uAtlas: { value: atlas.texture },
      uAtlasScale: { value: new THREE.Vector2(1 / atlas.cols, 1 / atlas.rows) },
      uMoonDir: { value: new THREE.Vector3(0.15, 0.42, 0.88).normalize() },
      uMoonColor: { value: new THREE.Color("#d5e2f4").multiplyScalar(0.72) },
      uLampDir: { value: new THREE.Vector3(0.75, 0.4, 0.2).normalize() },
      uLampColor: { value: new THREE.Color("#ffc48a").multiplyScalar(0.85) },
      uFillDir: { value: new THREE.Vector3(-0.15, 0.9, -0.2).normalize() },
      uFillColor: { value: new THREE.Color("#f2d8b8").multiplyScalar(0.34) },
      uAmbient: { value: new THREE.Color("#7a6456") },
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
    void buildAtlas(placed).then((next) => {
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
  }, [placed]);

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
    const materials = [page, page, board, board, makeSpineMaterial(atlas), board];
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
