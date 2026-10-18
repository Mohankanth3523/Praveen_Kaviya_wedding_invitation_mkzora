import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useMaterials } from './materials';
import {
  AGAL_PROFILE,
  KUTHU_FLAME_OFFSETS,
  KUTHU_VILAKKU_PROFILE,
  catenary,
  lathe,
  verticalStrand,
} from './geometry';
import { FLOOR, type TempleLayout } from './layout';
import { Flames, type FlameSpec } from './Effects';

/* Shared positions used by the facade, interior and mandapam. */
export const PORCH = { z: 1.6, pillarsX: [-4.3, -2.5, 2.5, 4.3], pillarSY: 5.24 / 5.16 } as const;

export function mandapamMetrics(layout: TempleLayout) {
  const z = layout.mandapamZ;
  const platformTop = FLOOR + 0.85;
  const pillarSY = 0.68;
  const pillarTop = platformTop + 5.16 * pillarSY;
  return {
    z,
    platformTop,
    pillarSY,
    pillarTop,
    pillars: [
      [-2.0, z + 1.6],
      [2.0, z + 1.6],
      [-2.0, z - 1.6],
      [2.0, z - 1.6],
    ] as [number, number][],
  };
}

/* -------------------------------------------------------------------------- */
/* Lamps                                                                      */
/* -------------------------------------------------------------------------- */

export interface LampPlan {
  kuthu: { p: THREE.Vector3; s: number }[];
  agal: THREE.Vector3[];
}

export function buildLampPlan(layout: TempleLayout): LampPlan {
  const kuthu: LampPlan['kuthu'] = [];
  const agal: THREE.Vector3[] = [];
  // Entrance: a pair of tall lamps between the porch pillars.
  kuthu.push({ p: new THREE.Vector3(-3.4, FLOOR, 1.25), s: 1.0 }, { p: new THREE.Vector3(3.4, FLOOR, 1.25), s: 1.0 });
  // Hall: lamps beside the inner pillars.
  layout.pillarRows.forEach((z, i) => {
    if (layout.mobile || i % 2 === 0) {
      kuthu.push({ p: new THREE.Vector3(-1.95, FLOOR, z), s: 0.72 }, { p: new THREE.Vector3(1.95, FLOOR, z), s: 0.72 });
    }
  });
  // Mandapam.
  const m = mandapamMetrics(layout);
  kuthu.push(
    { p: new THREE.Vector3(-3.3, FLOOR, m.z + 3.3), s: 1.18 },
    { p: new THREE.Vector3(3.3, FLOOR, m.z + 3.3), s: 1.18 },
    { p: new THREE.Vector3(-1.35, m.platformTop, m.z + 1.75), s: 0.62 },
    { p: new THREE.Vector3(1.35, m.platformTop, m.z + 1.75), s: 0.62 },
  );
  // Clay agal lamps along the mandapam's first step.
  const count = layout.mobile ? 9 : 13;
  for (let i = 0; i < count; i++) {
    agal.push(new THREE.Vector3(-3 + (6 * i) / (count - 1), FLOOR + 0.3, m.z + 2.45));
  }
  // A ring of agal lamps around the entrance kolam.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    agal.push(new THREE.Vector3(Math.cos(a) * 1.95, 0.005, 5.6 + Math.sin(a) * 1.95));
  }
  return { kuthu, agal };
}

export function flamesFor(plan: LampPlan): FlameSpec[] {
  const flames: FlameSpec[] = [];
  plan.kuthu.forEach(({ p, s }) => {
    KUTHU_FLAME_OFFSETS.forEach(([x, y, z]) => {
      flames.push({ p: new THREE.Vector3(p.x + x * s, p.y + (y + 0.045) * s, p.z + z * s), s: Math.max(0.75, s) });
    });
  });
  plan.agal.forEach((p) => flames.push({ p: new THREE.Vector3(p.x + 0.055, p.y + 0.105, p.z), s: 0.7 }));
  return flames;
}

function useInstanced(
  ref: RefObject<THREE.InstancedMesh>,
  items: { p: THREE.Vector3; s: number; r?: number }[],
) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    items.forEach((it, i) => {
      d.position.copy(it.p);
      d.rotation.set(0, it.r ?? 0, 0);
      d.scale.setScalar(it.s);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, items]);
}

export function Lamps({ plan, castShadow }: { plan: LampPlan; castShadow: boolean }) {
  const mats = useMaterials();
  const kuthuGeo = useMemo(() => lathe(KUTHU_VILAKKU_PROFILE, 24), []);
  const agalGeo = useMemo(() => lathe(AGAL_PROFILE, 14), []);
  useEffect(
    () => () => {
      kuthuGeo.dispose();
      agalGeo.dispose();
    },
    [kuthuGeo, agalGeo],
  );
  const kRef = useRef<THREE.InstancedMesh>(null);
  const aRef = useRef<THREE.InstancedMesh>(null);
  useInstanced(kRef, plan.kuthu);
  const agalItems = useMemo(() => plan.agal.map((p) => ({ p, s: 1, r: Math.PI })), [plan.agal]);
  useInstanced(aRef, agalItems);
  const flames = useMemo(() => flamesFor(plan), [plan]);
  return (
    <group>
      <instancedMesh ref={kRef} args={[kuthuGeo, mats.brass, plan.kuthu.length]} castShadow={castShadow} />
      <instancedMesh ref={aRef} args={[agalGeo, mats.clay, plan.agal.length]} />
      <Flames flames={flames} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Garlands: marigold, rose and jasmine strands, mango-leaf torans.            */
/* -------------------------------------------------------------------------- */

export interface GarlandPlan {
  marigold: { p: THREE.Vector3; c: string }[];
  jasmine: THREE.Vector3[];
  leaves: { p: THREE.Vector3; r: number }[];
}

const MARIGOLD = ['#e98a15', '#f3a823', '#e07a10', '#f0b43a'];

function addMarigold(plan: GarlandPlan, pts: THREE.Vector3[], roseEvery = 9) {
  pts.forEach((p, i) => {
    const rose = roseEvery > 0 && i % roseEvery === Math.floor(roseEvery / 2);
    plan.marigold.push({ p, c: rose ? '#9e1626' : MARIGOLD[i % MARIGOLD.length] });
  });
}

function addJasmine(plan: GarlandPlan, pts: THREE.Vector3[]) {
  pts.forEach((p, i) => {
    plan.jasmine.push(p);
    // Doubled buds give the dense strung-jasmine look.
    plan.jasmine.push(p.clone().add(new THREE.Vector3(i % 2 ? 0.02 : -0.02, -0.015, 0.012)));
  });
}

/** A strand that ends in a short tassel. */
function tassel(plan: GarlandPlan, end: THREE.Vector3) {
  addMarigold(plan, verticalStrand(end.clone().add(new THREE.Vector3(0, -0.08, 0)), 0.3, 0.075), 0);
}

export function buildGarlandPlan(layout: TempleLayout): GarlandPlan {
  const plan: GarlandPlan = { marigold: [], jasmine: [], leaves: [] };
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  // Mango-leaf toran across the doorway.
  const torTop = FLOOR + 5.42;
  for (let x = -1.55; x <= 1.551; x += 0.12) {
    plan.leaves.push({ p: V(x, torTop, 0.24), r: (Math.random() - 0.5) * 0.25 });
  }
  addMarigold(plan, catenary(V(-1.75, torTop + 0.06, 0.3), V(1.75, torTop + 0.06, 0.3), 0.26, 0.085));
  addJasmine(plan, catenary(V(-1.75, torTop - 0.06, 0.33), V(1.75, torTop - 0.06, 0.33), 0.36, 0.055));
  for (const s of [-1, 1]) {
    const m = verticalStrand(V(s * 1.8, torTop, 0.28), 2.7, 0.08);
    addMarigold(plan, m, 7);
    tassel(plan, m[m.length - 1]);
    addJasmine(plan, verticalStrand(V(s * 1.94, torTop, 0.26), 2.4, 0.05));
  }

  // Porch garlands hung from the corbels.
  const py = FLOOR + 5.0;
  const pz = PORCH.z + 0.5;
  const [a, b, c, d] = PORCH.pillarsX;
  addMarigold(plan, catenary(V(a, py, pz), V(b, py, pz), 0.5, 0.085));
  addMarigold(plan, catenary(V(c, py, pz), V(d, py, pz), 0.5, 0.085));
  addMarigold(plan, catenary(V(b, py + 0.05, pz), V(c, py + 0.05, pz), 0.7, 0.085));
  addJasmine(plan, catenary(V(b, py - 0.1, pz + 0.04), V(c, py - 0.1, pz + 0.04), 0.82, 0.055));
  PORCH.pillarsX.forEach((x) => {
    const strand = verticalStrand(V(x, py - 0.1, PORCH.z + 0.42), 2.0, 0.085);
    addMarigold(plan, strand, 6);
  });

  // Hall: garlands along the inner pillar lines and across alternate bays.
  const rows = layout.pillarRows;
  for (let i = 0; i < rows.length - 1; i++) {
    for (const x of [-2.8, 2.8]) {
      addMarigold(plan, catenary(V(x, FLOOR + 6.0, rows[i]), V(x, FLOOR + 6.0, rows[i + 1]), 0.6, 0.095));
    }
  }
  rows.forEach((z, i) => {
    if (i % 2 === 1 || layout.mobile) {
      addMarigold(plan, catenary(V(-2.8, FLOOR + 6.1, z), V(2.8, FLOOR + 6.1, z), 0.7, 0.095), 8);
    }
    for (const s of [-1, 1]) addJasmine(plan, verticalStrand(V(s * 2.3, FLOOR + 5.9, z), 1.7, 0.055));
  });

  // Mandapam.
  const m = mandapamMetrics(layout);
  const gy = m.pillarTop - 0.35;
  const front = m.z + 1.6 + 0.32;
  addMarigold(plan, catenary(V(-2.0, gy, front), V(2.0, gy, front), 0.7, 0.085));
  addJasmine(plan, catenary(V(-2.0, gy - 0.12, front + 0.04), V(2.0, gy - 0.12, front + 0.04), 0.85, 0.05));
  addMarigold(plan, catenary(V(-2.0, gy - 0.05, front + 0.02), V(0, gy - 0.05, front + 0.02), 0.32, 0.085), 5);
  addMarigold(plan, catenary(V(0, gy - 0.05, front + 0.02), V(2.0, gy - 0.05, front + 0.02), 0.32, 0.085), 5);
  for (const s of [-1, 1]) {
    addMarigold(plan, catenary(V(s * 2.3, gy, m.z + 1.6), V(s * 2.3, gy, m.z - 1.6), 0.55, 0.09));
    const strand = verticalStrand(V(s * 1.7, gy, front - 0.12), 2.2, 0.08);
    addMarigold(plan, strand, 6);
    tassel(plan, strand[strand.length - 1]);
    addJasmine(plan, verticalStrand(V(s * 1.58, gy, front - 0.1), 2.0, 0.05));
  }
  return plan;
}

export function Garlands({ plan }: { plan: GarlandPlan }) {
  const mats = useMaterials();
  const geos = useMemo(() => {
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.07, -0.12, 0, -0.34);
    leafShape.quadraticCurveTo(-0.07, -0.12, 0, 0);
    return {
      marigold: new THREE.IcosahedronGeometry(0.056, 1),
      jasmine: new THREE.SphereGeometry(0.024, 6, 4),
      leaf: new THREE.ShapeGeometry(leafShape, 4),
    };
  }, []);
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);
  const mRef = useRef<THREE.InstancedMesh>(null);
  const jRef = useRef<THREE.InstancedMesh>(null);
  const lRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const color = new THREE.Color();
    const mm = mRef.current;
    if (mm) {
      plan.marigold.forEach(({ p, c }, i) => {
        d.position.copy(p);
        d.rotation.set(i * 1.3, i * 0.7, 0);
        d.scale.setScalar(0.85 + ((i * 37) % 10) / 40);
        d.updateMatrix();
        mm.setMatrixAt(i, d.matrix);
        mm.setColorAt(i, color.set(c));
      });
      mm.instanceMatrix.needsUpdate = true;
      if (mm.instanceColor) mm.instanceColor.needsUpdate = true;
      mm.computeBoundingSphere();
    }
    const jm = jRef.current;
    if (jm) {
      d.rotation.set(0, 0, 0);
      plan.jasmine.forEach((p, i) => {
        d.position.copy(p);
        d.scale.set(1, 1.3, 1);
        d.updateMatrix();
        jm.setMatrixAt(i, d.matrix);
      });
      jm.instanceMatrix.needsUpdate = true;
      jm.computeBoundingSphere();
    }
    const lm = lRef.current;
    if (lm) {
      plan.leaves.forEach(({ p, r }, i) => {
        d.position.copy(p);
        d.rotation.set(0.15, 0, r);
        d.scale.setScalar(1);
        d.updateMatrix();
        lm.setMatrixAt(i, d.matrix);
      });
      lm.instanceMatrix.needsUpdate = true;
      lm.computeBoundingSphere();
    }
  }, [plan]);

  return (
    <group>
      <instancedMesh ref={mRef} args={[geos.marigold, mats.marigold, plan.marigold.length]} />
      <instancedMesh ref={jRef} args={[geos.jasmine, mats.jasmine, plan.jasmine.length]} />
      <instancedMesh ref={lRef} args={[geos.leaf, mats.leaf, plan.leaves.length]} />
    </group>
  );
}

export function Kolam({ position, size }: { position: [number, number, number]; size: number }) {
  const mats = useMaterials();
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} material={mats.kolam} renderOrder={1}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}
