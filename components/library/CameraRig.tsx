"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { PlacedBook } from "@/lib/placement";
import { clampCamera, type RoomPlan } from "@/lib/room-plan";
import { pointerGate } from "./input-state";

export type FocusRequest = { id: string; intent: "highlight" | "open" | "home" | "section" } | null;

type Pose = { x: number; y: number; z: number; yaw: number; pitch: number };

function dampAngle(current: number, target: number): number {
  return Math.atan2(Math.sin(target - current), Math.cos(target - current));
}

function poseLookingAt(x: number, y: number, z: number, book: PlacedBook): Pose {
  const dx = book.position[0] - x;
  const dy = book.position[1] - y;
  const dz = book.position[2] - z;
  const yaw = THREE.MathUtils.clamp(Math.atan2(-dx, -dz), -0.42, 0.42);
  const pitch = THREE.MathUtils.clamp(Math.atan2(dy, Math.hypot(dx, dz)), -0.38, 0.32);
  return { x, y, z, yaw, pitch };
}

function sectionPose(genre: string, placed: PlacedBook[], room: RoomPlan): Pose {
  const books = placed.filter((book) => book.genre === genre);
  if (books.length === 0) return { ...room.home };
  const xs = books.map((book) => book.position[0]);
  const center = (Math.min(...xs) + Math.max(...xs)) / 2;
  const span = Math.max(0.42, Math.max(...xs) - Math.min(...xs) + 0.16);
  const halfHorizontal = Math.atan(Math.tan((30 * Math.PI) / 180) * 1.4);
  const dist = span / 2 / Math.tan(halfHorizontal) + 0.38;
  const front = books[0]!.position[2] + books[0]!.size[2] / 2;
  const spot = clampCamera(center, front + dist, room);
  return { x: spot.x, y: room.home.y, z: spot.z, yaw: 0, pitch: -0.02 };
}

function viewpoint(book: PlacedBook, room: RoomPlan): Pose {
  const pull = 0.16;
  const aimed: PlacedBook = {
    ...book,
    position: [
      book.position[0] + book.normal[0] * pull,
      book.position[1],
      book.position[2] + book.normal[2] * pull,
    ],
  };
  const spot = clampCamera(aimed.position[0], aimed.position[2] + 1.05, room);
  const y = THREE.MathUtils.clamp(aimed.position[1] + 0.06, 1.08, 1.72);
  return poseLookingAt(spot.x, y, spot.z, aimed);
}

export function CameraRig({
  placed,
  focus,
  popup,
  reducedMotion,
  skipIntro,
  room,
  onIntroDone,
  onArrive,
  onInteract,
}: {
  placed: PlacedBook[];
  focus: FocusRequest;
  popup: boolean;
  reducedMotion: boolean;
  skipIntro: boolean;
  room: RoomPlan;
  onIntroDone: () => void;
  onArrive: () => void;
  onInteract: () => void;
}) {
  const { gl } = useThree();
  const roomRef = useRef(room);
  const pose = useRef<Pose>({ ...room.home, z: room.home.z + 0.45, yaw: 0.2 });
  const intro = useRef(reducedMotion ? 1 : 0);
  const introTold = useRef(false);
  const mode = useRef<"intro" | "free" | "fly" | "hold">("intro");
  const fly = useRef<{ from: Pose; to: Pose; t: number; open: boolean } | null>(null);
  const returnPose = useRef<Pose | null>(null);
  const focusKey = useRef<string | null>(null);
  const arrivedFor = useRef<string | null>(null);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const moved = useRef(0);
  const keys = useRef(new Set<string>());
  const onArriveRef = useRef(onArrive);
  const onIntroRef = useRef(onIntroDone);
  const onInteractRef = useRef(onInteract);
  useEffect(() => {
    roomRef.current = room;
    onArriveRef.current = onArrive;
    onIntroRef.current = onIntroDone;
    onInteractRef.current = onInteract;
  }, [onArrive, onIntroDone, onInteract, room]);

  useEffect(() => {
    const element = gl.domElement;
    const down = (event: PointerEvent) => {
      if (mode.current !== "free") return;
      dragging.current = true;
      moved.current = 0;
      pointerGate.dragged = false;
      last.current = { x: event.clientX, y: event.clientY };
      element.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!dragging.current || mode.current !== "free") return;
      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      last.current = { x: event.clientX, y: event.clientY };
      moved.current += Math.abs(dx) + Math.abs(dy);
      if (moved.current > 4) {
        pointerGate.dragged = true;
        onInteractRef.current();
      }
      pose.current.yaw = THREE.MathUtils.clamp(pose.current.yaw - dx * 0.003, -0.42, 0.42);
      pose.current.pitch = THREE.MathUtils.clamp(pose.current.pitch - dy * 0.0022, -0.38, 0.32);
    };
    const up = (event: PointerEvent) => {
      dragging.current = false;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      window.setTimeout(() => {
        pointerGate.dragged = false;
      }, 0);
    };
    const wheel = (event: WheelEvent) => {
      if (mode.current !== "free") return;
      event.preventDefault();
      onInteractRef.current();
      const next = clampCamera(pose.current.x, pose.current.z + -event.deltaY * 0.0024, roomRef.current);
      pose.current.x = next.x;
      pose.current.z = next.z;
    };
    const keyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      keys.current.add(event.key.toLowerCase());
    };
    const keyUp = (event: KeyboardEvent) => {
      keys.current.delete(event.key.toLowerCase());
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    element.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      element.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [gl]);

  useFrame((state, delta) => {
    const camera = state.camera;
    const plan = roomRef.current;
    if (mode.current === "intro") {
      intro.current = Math.min(1, intro.current + delta / (reducedMotion || skipIntro ? 0.01 : 0.55));
      const t = intro.current * intro.current * (3 - 2 * intro.current);
      const from = { ...plan.home, z: plan.home.z + 0.45, yaw: 0.2 };
      pose.current = {
        x: THREE.MathUtils.lerp(from.x, plan.home.x, t),
        y: plan.home.y,
        z: THREE.MathUtils.lerp(from.z, plan.home.z, t),
        yaw: THREE.MathUtils.lerp(from.yaw, plan.home.yaw, t),
        pitch: plan.home.pitch,
      };
      if (intro.current >= 1) {
        mode.current = "free";
        pose.current = { ...plan.home };
        if (!introTold.current) {
          introTold.current = true;
          onIntroRef.current();
        }
      }
      camera.position.set(pose.current.x, pose.current.y, pose.current.z);
      camera.rotation.order = "YXZ";
      camera.rotation.y = pose.current.yaw;
      camera.rotation.x = pose.current.pitch;
      return;
    }

    if (mode.current === "free") {
      const held = keys.current;
      let x = pose.current.x;
      let z = pose.current.z;
      const step = 1.45 * Math.min(delta, 0.05);
      let stepped = false;
      if (held.has("a") || held.has("arrowleft")) {
        x -= step;
        stepped = true;
      }
      if (held.has("d") || held.has("arrowright")) {
        x += step;
        stepped = true;
      }
      if (held.has("w") || held.has("arrowup")) {
        z -= step;
        stepped = true;
      }
      if (held.has("s") || held.has("arrowdown")) {
        z += step;
        stepped = true;
      }
      if (stepped) {
        const next = clampCamera(x, z, plan);
        pose.current.x = next.x;
        pose.current.z = next.z;
        onInteractRef.current();
      }
    }

    const key = focus ? `${focus.id}:${focus.intent}` : null;
    if (key !== focusKey.current) {
      const previous = focusKey.current;
      focusKey.current = key;
      arrivedFor.current = null;
      if (focus?.intent === "home") {
        fly.current = { from: { ...pose.current }, to: { ...plan.home }, t: 0, open: false };
        returnPose.current = null;
        mode.current = "fly";
      } else if (focus?.intent === "section") {
        fly.current = { from: { ...pose.current }, to: sectionPose(focus.id, placed, plan), t: 0, open: false };
        returnPose.current = null;
        mode.current = "fly";
      } else if (focus) {
        const book = placed.find((item) => item.bookId === focus.id);
        const sameBook = Boolean(previous?.startsWith(`${focus.id}:`) && fly.current);
        if (book && sameBook && fly.current) {
          fly.current.open = focus.intent === "open";
          if (focus.intent === "open") returnPose.current = { ...fly.current.from };
        } else if (book) {
          if (focus.intent === "open") returnPose.current = { ...pose.current };
          else returnPose.current = null;
          const from = { ...pose.current };
          const to = viewpoint(book, plan);
          const dist = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
          const yawDelta = Math.abs(dampAngle(from.yaw, to.yaw));
          if (focus.intent === "open" && dist < 0.28 && yawDelta < 0.18) {
            pose.current = { ...to };
            fly.current = null;
            mode.current = "hold";
            onArriveRef.current();
          } else {
            fly.current = { from, to, t: 0, open: focus.intent === "open" };
            mode.current = "fly";
          }
        }
      } else if (returnPose.current) {
        fly.current = { from: { ...pose.current }, to: returnPose.current, t: 0, open: false };
        returnPose.current = null;
        mode.current = "fly";
      }
    }

    if (mode.current === "fly" && fly.current) {
      fly.current.t = Math.min(1, fly.current.t + delta / 0.85);
      const t = fly.current.t * fly.current.t * (3 - 2 * fly.current.t);
      const from = fly.current.from;
      const to = fly.current.to;
      pose.current = {
        x: THREE.MathUtils.lerp(from.x, to.x, t),
        y: THREE.MathUtils.lerp(from.y, to.y, t),
        z: THREE.MathUtils.lerp(from.z, to.z, t),
        yaw: from.yaw + dampAngle(from.yaw, to.yaw) * t,
        pitch: THREE.MathUtils.lerp(from.pitch, to.pitch, t),
      };
      if (fly.current.t >= 1) {
        pose.current = { ...to };
        const open = fly.current.open;
        const id = focus?.id ?? null;
        fly.current = null;
        mode.current = open ? "hold" : "free";
        if (open && id && arrivedFor.current !== id) {
          arrivedFor.current = id;
          onArriveRef.current();
        }
      }
    }

    if (popup) mode.current = "hold";
    else if (mode.current === "hold" && !fly.current) mode.current = "free";

    camera.position.set(pose.current.x, pose.current.y, pose.current.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = pose.current.yaw;
    camera.rotation.x = pose.current.pitch;
  });

  return null;
}
