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
