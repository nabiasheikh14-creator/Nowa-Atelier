"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { PlacedBook } from "@/lib/placement";
import { EYE, clampCamera } from "@/lib/room-plan";
import { pointerGate } from "./input-state";

export type FocusRequest = { id: string; intent: "highlight" | "open" } | null;

type Pose = { x: number; y: number; z: number; yaw: number; pitch: number };

const INTRO_FROM: Pose = { x: 0.15, y: 1.98, z: 3.05, yaw: 0.48, pitch: -0.08 };
const INTRO_TO: Pose = { x: -0.35, y: EYE, z: 0.42, yaw: -0.38, pitch: 0.02 };

function dampAngle(current: number, target: number, lambda: number, delta: number): number {
  const deltaAngle = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + deltaAngle * (1 - Math.exp(-lambda * delta));
}

function poseLookingAt(x: number, y: number, z: number, book: PlacedBook): Pose {
  const dx = book.position[0] - x;
  const dy = book.position[1] - y;
  const dz = book.position[2] - z;
  const yaw = Math.atan2(-dx, -dz);
  const pitch = THREE.MathUtils.clamp(Math.atan2(dy, Math.hypot(dx, dz)), -0.62, 0.55);
  return { x, y, z, yaw, pitch };
}

function viewpoint(book: PlacedBook): Pose {
  const distance = 1.22;
  const pull = 0.28;
  const aimed: PlacedBook = {
    ...book,
    position: [
      book.position[0] + book.normal[0] * pull,
      book.position[1],
      book.position[2] + book.normal[2] * pull,
    ],
  };
  const y = THREE.MathUtils.clamp(aimed.position[1] + 0.18, 1.02, 2.35);
  const spot = clampCamera(
    aimed.position[0] + book.normal[0] * distance,
    aimed.position[2] + book.normal[2] * distance,
  );
  return poseLookingAt(spot.x, y, spot.z, aimed);
}

export function CameraRig({
  placed,
  focus,
  popup,
  reducedMotion,
  skipIntro,
  onIntroDone,
  onArrive,
  onInteract,
}: {
  placed: PlacedBook[];
  focus: FocusRequest;
  popup: boolean;
  reducedMotion: boolean;
  skipIntro: boolean;
  onIntroDone: () => void;
  onArrive: () => void;
  onInteract: () => void;
}) {
  const { gl } = useThree();
  const pose = useRef<Pose>({ ...INTRO_FROM });
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
  const onArriveRef = useRef(onArrive);
  const onIntroRef = useRef(onIntroDone);
  const onInteractRef = useRef(onInteract);
  useEffect(() => {
    onArriveRef.current = onArrive;
    onIntroRef.current = onIntroDone;
    onInteractRef.current = onInteract;
  }, [onArrive, onIntroDone, onInteract]);

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
      pose.current.yaw -= dx * 0.0023;
      pose.current.pitch = THREE.MathUtils.clamp(pose.current.pitch - dy * 0.0017, -0.62, 0.55);
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
      const step = -event.deltaY * 0.0015;
      const next = clampCamera(
        pose.current.x + -Math.sin(pose.current.yaw) * step,
        pose.current.z + -Math.cos(pose.current.yaw) * step,
      );
      pose.current.x = next.x;
      pose.current.z = next.z;
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      element.removeEventListener("wheel", wheel);
    };
  }, [gl]);

  useFrame((state, delta) => {
    const camera = state.camera;
    const dt = Math.min(delta, 0.05);
    if (mode.current === "intro") {
      intro.current = Math.min(1, intro.current + dt / (reducedMotion || skipIntro ? 0.01 : 6.6));
      const t = intro.current * intro.current * (3 - 2 * intro.current);
      pose.current = {
        x: THREE.MathUtils.lerp(INTRO_FROM.x, INTRO_TO.x, t),
        y: THREE.MathUtils.lerp(INTRO_FROM.y, INTRO_TO.y, t),
        z: THREE.MathUtils.lerp(INTRO_FROM.z, INTRO_TO.z, t),
        yaw: THREE.MathUtils.lerp(INTRO_FROM.yaw, INTRO_TO.yaw, t),
        pitch: THREE.MathUtils.lerp(INTRO_FROM.pitch, INTRO_TO.pitch, t),
      };
      if (intro.current >= 1) {
        mode.current = "free";
        pose.current = { ...INTRO_TO };
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

    const key = focus ? `${focus.id}:${focus.intent}` : null;
    if (key !== focusKey.current) {
      const previous = focusKey.current;
      focusKey.current = key;
      arrivedFor.current = null;
      if (focus) {
        const book = placed.find((item) => item.bookId === focus.id);
        const sameBook = Boolean(previous?.startsWith(`${focus.id}:`) && fly.current);
        if (book && sameBook && fly.current) {
          fly.current.open = focus.intent === "open";
          if (focus.intent === "open") returnPose.current = { ...fly.current.from };
        } else if (book) {
          if (focus.intent === "open") returnPose.current = { ...pose.current };
          else returnPose.current = null;
          const from = { ...pose.current };
          const to = viewpoint(book);
          const dist = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
          const yawDelta = Math.abs(Math.atan2(Math.sin(to.yaw - from.yaw), Math.cos(to.yaw - from.yaw)));
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
      fly.current.t = Math.min(1, fly.current.t + delta / 1.35);
      const t = fly.current.t * fly.current.t * (3 - 2 * fly.current.t);
      const from = fly.current.from;
      const to = fly.current.to;
      pose.current = {
        x: THREE.MathUtils.lerp(from.x, to.x, t),
        y: THREE.MathUtils.lerp(from.y, to.y, t),
        z: THREE.MathUtils.lerp(from.z, to.z, t),
        yaw: dampAngle(from.yaw, to.yaw, 0, 0) + Math.atan2(Math.sin(to.yaw - from.yaw), Math.cos(to.yaw - from.yaw)) * t,
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
