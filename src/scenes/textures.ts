import * as THREE from 'three';

/**
 * Original procedural textures, generated once on the client from seeded
 * noise. No downloaded images, so no licensing questions and no network cost.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable value noise on a fixed lattice. */
function makeNoise(seed: number, period: number) {
  const rand = mulberry32(seed);
  const grid = new Float32Array(period * period);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();
  const at = (x: number, y: number) => grid[(((y % period) + period) % period) * period + (((x % period) + period) % period)];
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

function fbm(noise: (x: number, y: number) => number, x: number, y: number, octaves: number) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise(x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

function canvas(size: number) {
  const el = document.createElement('canvas');
  el.width = size;
  el.height = size;
  const ctx = el.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return { el, ctx };
}

function toTexture(el: HTMLCanvasElement, color: boolean, repeat = 1) {
  const tex = new THREE.CanvasTexture(el);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  if (color) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function granitePixels(size: number, seed: number, palette: [number, number, number][]) {
  const n1 = makeNoise(seed, 8);
  const n2 = makeNoise(seed + 7, 32);
  const rand = mulberry32(seed + 99);
  const color = canvas(size);
  const bump = canvas(size);
  const cImg = color.ctx.createImageData(size, size);
  const bImg = bump.ctx.createImageData(size, size);
  const [dark, mid, light] = palette;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * 8;
      const v = (y / size) * 8;
      const large = fbm(n1, u, v, 3);
      const fine = n2((x / size) * 32, (y / size) * 32);
      let t = large * 0.75 + fine * 0.25;
      // Speckled crystals, typical of South Indian granite.
      const r = rand();
      let speck = 0;
      if (r > 0.985) speck = -0.35;
      else if (r > 0.972) speck = 0.22;
      t = Math.min(1, Math.max(0, t + speck));
      const base = t < 0.5 ? [dark, mid, t * 2] : [mid, light, (t - 0.5) * 2];
      const [a, b, k] = base as [[number, number, number], [number, number, number], number];
      const i = (y * size + x) * 4;
      cImg.data[i] = lerp(a[0], b[0], k);
      cImg.data[i + 1] = lerp(a[1], b[1], k);
      cImg.data[i + 2] = lerp(a[2], b[2], k);
      cImg.data[i + 3] = 255;
      const h = Math.round((large * 0.6 + fine * 0.4 + speck * 0.5) * 255);
      bImg.data[i] = bImg.data[i + 1] = bImg.data[i + 2] = Math.max(0, Math.min(255, h));
      bImg.data[i + 3] = 255;
    }
  }
  color.ctx.putImageData(cImg, 0, 0);
  bump.ctx.putImageData(bImg, 0, 0);
  return { color: color.el, bump: bump.el };
}

function woodPixels(size: number, seed: number) {
  const n = makeNoise(seed, 16);
  const color = canvas(size);
  const img = color.ctx.createImageData(size, size);
  const planks = 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const warp = fbm(n, (x / size) * 4, (y / size) * 16, 3) * 5;
      const grain = 0.5 + 0.5 * Math.sin((x / size) * 90 + warp * 6);
      const plankEdge = Math.abs(((x / size) * planks) % 1 - 0.5) > 0.492 ? 0.45 : 1;
      const t = (0.55 + grain * 0.3 + fbm(n, (x / size) * 2, (y / size) * 2, 2) * 0.25) * plankEdge;
      const i = (y * size + x) * 4;
      img.data[i] = lerp(38, 104, t);
      img.data[i + 1] = lerp(20, 58, t);
      img.data[i + 2] = lerp(10, 30, t);
      img.data[i + 3] = 255;
    }
  }
  color.ctx.putImageData(img, 0, 0);
  return color.el;
}

function floorCanvas(granite: HTMLCanvasElement, seed: number) {
  const size = 1024;
  const { el, ctx } = canvas(size);
  const rand = mulberry32(seed);
  const slabs = 4;
  const s = size / slabs;
  for (let gy = 0; gy < slabs; gy++) {
    for (let gx = 0; gx < slabs; gx++) {
      const tone = 0.82 + rand() * 0.22;
      ctx.save();
      ctx.beginPath();
      ctx.rect(gx * s, gy * s, s, s);
      ctx.clip();
      ctx.drawImage(granite, gx * s - rand() * s, gy * s - rand() * s, s * 2, s * 2);
      ctx.fillStyle = `rgba(${tone > 1 ? 255 : 0},${tone > 1 ? 230 : 0},${tone > 1 ? 200 : 0},${Math.abs(1 - tone) * 0.9})`;
      ctx.fillRect(gx * s, gy * s, s, s);
      ctx.restore();
    }
  }
  ctx.strokeStyle = 'rgba(20,14,10,0.85)';
  ctx.lineWidth = 4;
  for (let i = 0; i <= slabs; i++) {
    ctx.beginPath();
    ctx.moveTo(i * s, 0);
    ctx.lineTo(i * s, size);
    ctx.moveTo(0, i * s);
    ctx.lineTo(size, i * s);
    ctx.stroke();
  }
  return el;
}

/** A lotus kolam in rice-flour white, drawn with dots and looping lines. */
function kolamCanvas() {
  const size = 1024;
  const { el, ctx } = canvas(size);
  const c = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(250,244,232,0.92)';
  ctx.fillStyle = 'rgba(250,244,232,0.95)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const dot = (x: number, y: number, r = 7) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(c, c, 48, 0, Math.PI * 2);
  ctx.stroke();
  dot(c, c, 12);
  // Inner 8 lotus petals.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.bezierCurveTo(-58, -110, -30, -190, 0, -210);
    ctx.bezierCurveTo(30, -190, 58, -110, 0, -52);
    ctx.stroke();
    dot(0, -150, 8);
    ctx.restore();
  }
  // Outer 16 small petals.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-22, -238);
    ctx.quadraticCurveTo(0, -330, 22, -238);
    ctx.stroke();
    dot(0, -268, 6);
    ctx.restore();
  }
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(c, c, 232, 0, Math.PI * 2);
  ctx.stroke();
  // Dotted ring and looping border.
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    dot(c + Math.cos(a) * 372, c + Math.sin(a) * 372, 6);
  }
  ctx.lineWidth = 7;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const a2 = ((i + 1) / 24) * Math.PI * 2;
    const r1 = 400;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
    const mid = (a + a2) / 2;
    ctx.quadraticCurveTo(c + Math.cos(mid) * (r1 + 90), c + Math.sin(mid) * (r1 + 90), c + Math.cos(a2) * r1, c + Math.sin(a2) * r1);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(el);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function glowCanvas() {
  const { el, ctx } = canvas(128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(el);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface TempleTextures {
  stoneColor: THREE.Texture;
  stoneBump: THREE.Texture;
  carvedColor: THREE.Texture;
  carvedBump: THREE.Texture;
  wood: THREE.Texture;
  floor: THREE.Texture;
  floorBump: THREE.Texture;
  kolam: THREE.Texture;
  glow: THREE.Texture;
  dispose: () => void;
}

export function createTempleTextures(quality: 'high' | 'low'): TempleTextures {
  const size = quality === 'high' ? 512 : 256;
  const granite = granitePixels(size, 11, [
    [92, 74, 58],
    [134, 111, 88],
    [176, 152, 124],
  ]);
  const carved = granitePixels(size, 23, [
    [70, 56, 44],
    [118, 96, 74],
    [160, 134, 104],
  ]);
  const floorEl = floorCanvas(granite.color, 5);
  const floorBumpEl = floorCanvas(granite.bump, 5);
  const textures = {
    stoneColor: toTexture(granite.color, true, 1),
    stoneBump: toTexture(granite.bump, false, 1),
    carvedColor: toTexture(carved.color, true, 1),
    carvedBump: toTexture(carved.bump, false, 1),
    wood: toTexture(woodPixels(size, 3), true, 1),
    floor: toTexture(floorEl, true, 1),
    floorBump: toTexture(floorBumpEl, false, 1),
    kolam: kolamCanvas(),
    glow: glowCanvas(),
  };
  return {
    ...textures,
    dispose: () => Object.values(textures).forEach((t) => t.dispose()),
  };
}
