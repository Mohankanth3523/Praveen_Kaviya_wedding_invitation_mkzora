/**
 * Geometry helpers for the palace entrance artwork (PalaceArt.tsx).
 * Every shape is drawn in a 600 × 900 "palace unit" space; the SVGs scale it
 * to whatever size the screen allows, so proportions never change.
 */

/** Royal palette from the brief, plus a few derived shades used for depth. */
export const PAL = {
  marble: '#FFF8F7',
  marbleHi: '#FFFDFB',
  marbleShade: '#F1E1DF',
  marbleDeep: '#E4CDCB',
  blush: '#F9E5EC',
  blushDeep: '#F1CFDB',
  champagne: '#D5AF63',
  antique: '#A77A36',
  antiqueDeep: '#7E5A26',
  rosewood: '#4A251F',
  rosewoodLight: '#6B3A2F',
  rosewoodDark: '#2F1612',
  rose: '#B66D88',
  glow: '#FFE7BF',
  // Festive accents: marigold, silk and jewel tones.
  marigold: '#F5891B',
  saffron: '#FFB627',
  magenta: '#C2185B',
  ruby: '#B3123E',
  emerald: '#1F8A5B',
  sapphire: '#1E5FB3',
  peacock: '#13707A',
  peacockDeep: '#0B4F5A',
  glowHi: '#FFF8E8',
} as const;

const f = (n: number) => Math.round(n * 10) / 10;

/**
 * Points along a pointed (slightly ogee) arch, from the left springing point,
 * over the apex, to the right springing point.
 */
export function archPoints(cx: number, spring: number, hw: number, rise: number, perSide: number): Array<[number, number]> {
  const left: Array<[number, number]> = [];
  const p0: [number, number] = [cx - hw, spring];
  const c1: [number, number] = [cx - hw, spring - rise * 0.62];
  const c2: [number, number] = [cx - hw * 0.4, spring - rise * 0.93];
  const p3: [number, number] = [cx, spring - rise];
  for (let i = 0; i <= perSide; i += 1) {
    const t = i / perSide;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1];
    left.push([x, y]);
  }
  const right = left
    .slice(0, -1)
    .reverse()
    .map(([x, y]) => [2 * cx - x, y] as [number, number]);
  return [...left, ...right];
}

/** A smooth pointed arch outline (open path, springing point to springing point). */
export function archCurve(cx: number, spring: number, hw: number, rise: number): string {
  return (
    `M${f(cx - hw)} ${f(spring)}` +
    `C${f(cx - hw)} ${f(spring - rise * 0.62)} ${f(cx - hw * 0.4)} ${f(spring - rise * 0.93)} ${f(cx)} ${f(spring - rise)}` +
    `C${f(cx + hw * 0.4)} ${f(spring - rise * 0.93)} ${f(cx + hw)} ${f(spring - rise * 0.62)} ${f(cx + hw)} ${f(spring)}`
  );
}

/** A closed doorway: pointed arch on top, straight jambs down to `bottom`. */
export function archDoorway(cx: number, spring: number, hw: number, rise: number, bottom: number): string {
  return `${archCurve(cx, spring, hw, rise)}V${f(bottom)}H${f(cx - hw)}Z`;
}

/** The same doorway with a cusped (multifoil) arch, as in Rajput and Deccan palaces. */
export function cuspedDoorway(cx: number, spring: number, hw: number, rise: number, bottom: number, lobesPerSide: number): string {
  const pts = archPoints(cx, spring, hw, rise, lobesPerSide);
  const first = pts[0] ?? [cx - hw, spring];
  let d = `M${f(first[0])} ${f(first[1])}`;
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1] ?? first;
    const b = pts[i] ?? first;
    const chord = Math.hypot(b[0] - a[0], b[1] - a[1]);
    d += `A${f(chord * 0.58)} ${f(chord * 0.58)} 0 0 1 ${f(b[0])} ${f(b[1])}`;
  }
  return `${d}V${f(bottom)}H${f(cx - hw)}Z`;
}

/** Evenly spaced points along a hanging swag (catenary-like parabola). */
export function swagPoints(x1: number, y1: number, x2: number, y2: number, sag: number, spacing: number): Array<[number, number]> {
  const len = Math.hypot(x2 - x1, y2 - y1) + sag;
  const n = Math.max(2, Math.round(len / spacing));
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t + 4 * sag * t * (1 - t)]);
  }
  return out;
}

/** Lotus rosette petals around (0,0): returns one path string. */
export function lotusPetals(count: number, inner: number, outer: number, width: number): string {
  let d = '';
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const px = -sa;
    const py = ca;
    const bx = ca * inner;
    const by = sa * inner;
    const tx = ca * outer;
    const ty = sa * outer;
    const mx = ca * ((inner + outer) / 2);
    const my = sa * ((inner + outer) / 2);
    d +=
      `M${f(bx)} ${f(by)}` +
      `Q${f(mx + px * width)} ${f(my + py * width)} ${f(tx)} ${f(ty)}` +
      `Q${f(mx - px * width)} ${f(my - py * width)} ${f(bx)} ${f(by)}Z`;
  }
  return d;
}

export { f as round1 };
