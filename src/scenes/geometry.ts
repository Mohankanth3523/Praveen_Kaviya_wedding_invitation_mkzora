import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** World units per texture tile, so stone grain keeps a constant scale. */
export const TEX_SCALE = 2.4;

/**
 * BoxGeometry with UVs scaled to world size (prevents stretched textures on
 * long beams and walls), translated so `y` is its base.
 */
export function box(w: number, h: number, d: number, x = 0, y = 0, z = 0, base = true): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // Face order: +x, -x, +y, -y, +z, -z; 4 vertices each.
  const dims: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / TEX_SCALE + x * 0.13, (uv.getY(i) * dims[f][1]) / TEX_SCALE + y * 0.21);
    }
  }
  g.translate(x, base ? y + h / 2 : y, z);
  return g;
}

export function cylinder(
  rTop: number,
  rBottom: number,
  h: number,
  segments: number,
  x = 0,
  y = 0,
  z = 0,
  rotate = 0,
): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, segments, 1);
  scaleUV(g, (Math.PI * 2 * Math.max(rTop, rBottom)) / TEX_SCALE, h / TEX_SCALE);
  if (rotate) g.rotateY(rotate);
  g.translate(x, y + h / 2, z);
  return g;
}

export function lathe(profile: [number, number][], segments: number, scale = 1): THREE.BufferGeometry {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r * scale, y * scale));
  const g = new THREE.LatheGeometry(pts, segments);
  scaleUV(g, 1.5, 1.5);
  return g;
}

function scaleUV(g: THREE.BufferGeometry, su: number, sv: number) {
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
}

/** Merge geometries that may be indexed or not, keeping position/normal/uv only. */
export function merge(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const prepared = geos.map((g) => {
    const ng = g.index ? g.toNonIndexed() : g;
    for (const key of Object.keys(ng.attributes)) {
      if (key !== 'position' && key !== 'normal' && key !== 'uv') ng.deleteAttribute(key);
    }
    if (ng !== g) g.dispose();
    return ng;
  });
  const merged = mergeGeometries(prepared, false);
  prepared.forEach((g) => g.dispose());
  if (!merged) throw new Error('Geometry merge failed');
  merged.computeBoundingSphere();
  return merged;
}

/**
 * A Dravidian pillar: plinth, alternating square (sadhuram) and octagonal
 * (kattu) sections, kumbha pot, lotus flare, abacus and four-way corbel
 * (potika) with pendant drops. Base at y = 0, height ≈ 5.16 at scale 1.
 */
export function pillarGeometry(sy = 1, sxz = 1): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const B = (w: number, h: number, y: number, d = w) => parts.push(box(w * sxz, h * sy, d * sxz, 0, y * sy, 0));
  const C = (rt: number, rb: number, h: number, y: number, seg: number, rot = 0) =>
    parts.push(cylinder(rt * sxz, rb * sxz, h * sy, seg, 0, y * sy, 0, rot));
  B(1.0, 0.3, 0);
  B(0.9, 0.1, 0.3);
  B(0.78, 0.07, 0.4);
  B(0.72, 1.0, 0.47);
  C(0.37, 0.37, 0.08, 1.47, 8, Math.PI / 8);
  C(0.33, 0.33, 0.27, 1.55, 8, Math.PI / 8);
  B(0.7, 0.9, 1.82);
  C(0.37, 0.37, 0.08, 2.72, 8, Math.PI / 8);
  C(0.33, 0.33, 0.27, 2.8, 8, Math.PI / 8);
  B(0.68, 0.8, 3.07);
  B(0.74, 0.06, 3.87);
  C(0.24, 0.27, 0.3, 3.93, 16);
  // Kumbha (pot capital).
  const pot = lathe(
    [
      [0.0, 0],
      [0.27, 0],
      [0.38, 0.08],
      [0.42, 0.17],
      [0.38, 0.26],
      [0.3, 0.32],
      [0.0, 0.32],
    ],
    20,
  );
  pot.scale(sxz, sy, sxz);
  pot.translate(0, 4.23 * sy, 0);
  parts.push(pot);
  C(0.52, 0.3, 0.18, 4.55, 16);
  B(1.08, 0.11, 4.73);
  // Potika: corbels in both directions with pendant drops.
  B(1.9, 0.3, 4.84, 0.5);
  B(0.5, 0.3, 4.84, 1.9);
  for (const s of [-1, 1]) {
    parts.push(box(0.26 * sxz, 0.16 * sy, 0.4 * sxz, s * 0.8 * sxz, 4.7 * sy, 0));
    parts.push(box(0.4 * sxz, 0.16 * sy, 0.26 * sxz, 0, 4.7 * sy, s * 0.8 * sxz));
  }
  return merge(parts);
}

/** Brass kuthu vilakku (standing oil lamp). Base at y = 0, height ≈ 1.68. */
export const KUTHU_VILAKKU_PROFILE: [number, number][] = [
  [0.0, 0.0],
  [0.32, 0.0],
  [0.33, 0.04],
  [0.27, 0.07],
  [0.14, 0.12],
  [0.09, 0.2],
  [0.06, 0.28],
  [0.05, 0.32],
  [0.08, 0.36],
  [0.05, 0.4],
  [0.042, 0.9],
  [0.075, 0.94],
  [0.042, 0.98],
  [0.038, 1.24],
  [0.07, 1.27],
  [0.23, 1.31],
  [0.235, 1.35],
  [0.2, 1.36],
  [0.06, 1.37],
  [0.04, 1.44],
  [0.065, 1.48],
  [0.04, 1.53],
  [0.05, 1.58],
  [0.0, 1.68],
];

export const KUTHU_FLAME_OFFSETS: [number, number, number][] = Array.from({ length: 5 }, (_, i) => {
  const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
  return [Math.cos(a) * 0.215, 1.42, Math.sin(a) * 0.215];
});

/** Clay agal lamp, base at 0, height ≈ 0.07. */
export const AGAL_PROFILE: [number, number][] = [
  [0.0, 0.0],
  [0.05, 0.0],
  [0.075, 0.03],
  [0.085, 0.065],
  [0.075, 0.07],
  [0.0, 0.05],
];

/** Gold kalasam finial, base at 0, height ≈ 0.62. */
export const KALASAM_PROFILE: [number, number][] = [
  [0.0, 0.0],
  [0.16, 0.0],
  [0.17, 0.04],
  [0.1, 0.08],
  [0.2, 0.18],
  [0.22, 0.26],
  [0.18, 0.34],
  [0.08, 0.38],
  [0.1, 0.42],
  [0.05, 0.46],
  [0.06, 0.5],
  [0.02, 0.56],
  [0.0, 0.62],
];

/** Points along a hanging garland (catenary-like parabola). */
export function catenary(a: THREE.Vector3, b: THREE.Vector3, sag: number, spacing: number): THREE.Vector3[] {
  const length = a.distanceTo(b) + sag * 1.2;
  const count = Math.max(2, Math.round(length / spacing));
  const out: THREE.Vector3[] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    p.y -= sag * 4 * t * (1 - t);
    out.push(p);
  }
  return out;
}

export function verticalStrand(top: THREE.Vector3, length: number, spacing: number): THREE.Vector3[] {
  const count = Math.max(2, Math.round(length / spacing));
  return Array.from({ length: count + 1 }, (_, i) => new THREE.Vector3(top.x, top.y - (i / count) * length, top.z));
}
