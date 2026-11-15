import * as THREE from "three";

function canvasTexture(canvas: HTMLCanvasElement, repeat?: [number, number]): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  return texture;
}

function grain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  horizontal: boolean,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = "rgba(30, 16, 8, 0.28)";
  ctx.lineWidth = 1;
  const steps = horizontal ? 3 : 5;
  for (let i = 1; i < steps; i++) {
    ctx.beginPath();
    if (horizontal) {
      const yy = y + (h * i) / steps;
      ctx.moveTo(x, yy);
      ctx.lineTo(x + w, yy + Math.sin(x) * 0.4);
    } else {
      const xx = x + (w * i) / steps;
      ctx.moveTo(xx, y);
      ctx.lineTo(xx, y + h);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function makeFloorTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#21150f";
  ctx.fillRect(0, 0, size, size);
  const length = 86;
  const thick = 18;
  const tile = length + thick;
  for (let y = -tile; y < size + tile; y += tile) {
    for (let x = -tile; x < size + tile; x += tile) {
      const n = (Math.floor(x / tile) * 3 + Math.floor(y / tile) * 5) & 15;
      const warm = 34 + n;
      ctx.fillStyle = `rgb(${warm + 28}, ${Math.floor(warm * 0.62)}, ${Math.floor(warm * 0.34)})`;
      ctx.fillRect(x + 1, y + length + 1, length - 2, thick - 2);
      grain(ctx, x + 1, y + length + 1, length - 2, thick - 2, true);
      const cool = 30 + ((n * 3) & 12);
      ctx.fillStyle = `rgb(${cool + 24}, ${Math.floor(cool * 0.58)}, ${Math.floor(cool * 0.32)})`;
      ctx.fillRect(x + length + 1, y + 1, thick - 2, length - 2);
      grain(ctx, x + length + 1, y + 1, thick - 2, length - 2, false);
    }
  }
  return canvasTexture(canvas, [3.2, 3.2]);
}

export function makeGlobeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#1a3148";
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = "rgba(212, 176, 106, 0.45)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (256 * i) / 6);
    ctx.lineTo(512, (256 * i) / 6);
    ctx.stroke();
  }
  for (let i = 1; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo((512 * i) / 8, 0);
    ctx.lineTo((512 * i) / 8, 256);
    ctx.stroke();
  }
  ctx.fillStyle = "#b08948";
  const lands: [number, number, number, number][] = [
    [70, 70, 90, 48],
    [150, 90, 70, 60],
    [230, 60, 50, 36],
    [300, 110, 120, 54],
    [80, 150, 60, 30],
    [200, 150, 80, 34],
    [360, 70, 40, 50],
  ];
  for (const [x, y, w, h] of lands) {
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvasTexture(canvas);
}

/**
 * The view through the window at night: deep blue sky, a few stars, a low moon
 * glow, and a far skyline with a scatter of lit windows. Kept dark so it sits
 * behind the room rather than competing with it.
 */
export function makeNightTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 704;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#050a18");
  sky.addColorStop(0.55, "#0d1a33");
  sky.addColorStop(0.82, "#1b2a44");
  sky.addColorStop(1, "#2a2a38");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 90; i++) {
    const a = 0.25 + rand() * 0.55;
    ctx.fillStyle = `rgba(220, 230, 255, ${a})`;
    const r = rand() < 0.1 ? 1.4 : 0.8;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h * 0.55, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const moonX = w * 0.68;
  const moonY = h * 0.2;
  const halo = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 150);
  halo.addColorStop(0, "rgba(200, 214, 240, 0.32)");
  halo.addColorStop(1, "rgba(200, 214, 240, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#e8edf6";
  ctx.beginPath();
  ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0d1a33";
  ctx.beginPath();
  ctx.arc(moonX + 11, moonY - 6, 24, 0, Math.PI * 2);
  ctx.fill();

  // far skyline, then nearer rooftops, each with a few lit windows
  const layers = [
    { base: h * 0.8, tall: 90, color: "#141b2b", lit: 0.07 },
    { base: h * 0.9, tall: 70, color: "#0c111c", lit: 0.12 },
  ];
  for (const layer of layers) {
    let x = -10;
    while (x < w + 10) {
      const bw = 24 + rand() * 46;
      const bh = 20 + rand() * layer.tall;
      const top = layer.base - bh;
      ctx.fillStyle = layer.color;
      ctx.fillRect(x, top, bw, h - top);
      if (rand() < 0.18) ctx.fillRect(x + bw / 2 - 2, top - 14, 4, 14);
      for (let wy = top + 8; wy < h - 6; wy += 10) {
        for (let wx = x + 5; wx < x + bw - 6; wx += 8) {
          if (rand() < layer.lit) {
            const warm = rand() < 0.75;
            ctx.fillStyle = warm ? `rgba(255, 196, 120, ${0.55 + rand() * 0.35})` : `rgba(190, 215, 255, ${0.4 + rand() * 0.3})`;
            ctx.fillRect(wx, wy, 3, 4);
          }
        }
      }
      x += bw + rand() * 3;
    }
  }

  // a little haze over the city
  const haze = ctx.createLinearGradient(0, h * 0.7, 0, h);
  haze.addColorStop(0, "rgba(120, 110, 140, 0)");
  haze.addColorStop(1, "rgba(120, 100, 110, 0.18)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  return canvasTexture(canvas);
}

/** Rain on the glass: thin streaks and a few beads, tiled and slid downward over time. */
export function makeRainTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  let seed = 31;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  ctx.clearRect(0, 0, size, size);
  for (let i = 0; i < 70; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 8 + rand() * 26;
    const streak = ctx.createLinearGradient(x, y, x + 1, y + len);
    streak.addColorStop(0, "rgba(210, 225, 245, 0)");
    streak.addColorStop(1, `rgba(210, 225, 245, ${0.18 + rand() * 0.22})`);
    ctx.strokeStyle = streak;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 1, y + len);
    ctx.stroke();
    // wrap so the tile repeats cleanly
    if (y + len > size) {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + 1, y + len - size);
      ctx.stroke();
    }
  }
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(220, 232, 250, ${0.12 + rand() * 0.2})`;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 0.8 + rand() * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = canvasTexture(canvas, [2, 2.6]);
  return texture;
}

/** The view by day: soft blue sky, a few clouds, and the same skyline in hazy daylight. */
export function makeDayTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 704;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#7fb2df");
  sky.addColorStop(0.6, "#b9d6ee");
  sky.addColorStop(0.85, "#e6eef2");
  sky.addColorStop(1, "#efe8dc");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // sun glare high on the left, where the light comes from
  const glare = ctx.createRadialGradient(w * 0.2, h * 0.12, 0, w * 0.2, h * 0.12, 260);
  glare.addColorStop(0, "rgba(255, 250, 230, 0.95)");
  glare.addColorStop(0.25, "rgba(255, 244, 214, 0.45)");
  glare.addColorStop(1, "rgba(255, 244, 214, 0)");
  ctx.fillStyle = glare;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 7; i++) {
    const cx = rand() * w;
    const cy = h * (0.12 + rand() * 0.4);
    for (let puff = 0; puff < 6; puff++) {
      const px = cx + (rand() - 0.5) * 120;
      const py = cy + (rand() - 0.5) * 22;
      const r = 24 + rand() * 34;
      const cloud = ctx.createRadialGradient(px, py, 0, px, py, r);
      cloud.addColorStop(0, "rgba(255, 255, 255, 0.55)");
      cloud.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = cloud;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    }
  }

  const layers = [
    { base: h * 0.8, tall: 90, color: "#a9b7c6" },
    { base: h * 0.9, tall: 70, color: "#8c98a6" },
  ];
  for (const layer of layers) {
    let x = -10;
    while (x < w + 10) {
      const bw = 24 + rand() * 46;
      const bh = 20 + rand() * layer.tall;
      const top = layer.base - bh;
      ctx.fillStyle = layer.color;
      ctx.fillRect(x, top, bw, h - top);
      for (let wy = top + 8; wy < h - 6; wy += 10) {
        for (let wx = x + 5; wx < x + bw - 6; wx += 8) {
          if (rand() < 0.25) {
            ctx.fillStyle = `rgba(230, 238, 246, ${0.25 + rand() * 0.25})`;
            ctx.fillRect(wx, wy, 3, 4);
          }
        }
      }
      x += bw + rand() * 3;
    }
  }
  const haze = ctx.createLinearGradient(0, h * 0.6, 0, h);
  haze.addColorStop(0, "rgba(240, 236, 226, 0)");
  haze.addColorStop(1, "rgba(240, 236, 226, 0.45)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
  return canvasTexture(canvas);
}

/** The window's shape in sunlight on the floor: four soft panes and the cross of the mullions. */
export function makeSunPatchTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.filter = "blur(7px)";
  ctx.fillStyle = "#fff";
  const pad = 22;
  const bar = 9;
  const midX = w / 2;
  const midY = h * 0.38;
  ctx.fillRect(pad, pad, midX - pad - bar / 2, midY - pad - bar / 2);
  ctx.fillRect(midX + bar / 2, pad, w - pad - midX - bar / 2, midY - pad - bar / 2);
  ctx.fillRect(pad, midY + bar / 2, midX - pad - bar / 2, h - pad - midY - bar / 2);
  ctx.fillRect(midX + bar / 2, midY + bar / 2, w - pad - midX - bar / 2, h - pad - midY - bar / 2);
  ctx.filter = "none";
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
