import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useMaterials } from './materials';
import { KALASAM_PROFILE, TEX_SCALE, box, lathe, merge, pillarGeometry } from './geometry';
import { DOOR, FLOOR } from './layout';
import { PORCH, Kolam } from './Decor';

/** Horizontal half-cylinder (barrel vault / kumuda moulding) along x. */
function barrelX(radius: number, length: number, x: number, y: number, z: number, half = false) {
  const g = new THREE.CylinderGeometry(radius, radius, length, 18, 1, false, 0, half ? Math.PI : Math.PI * 2);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * Math.PI * radius) / TEX_SCALE, (uv.getY(i) * length) / TEX_SCALE);
  g.rotateZ(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

function arch(radius: number, tube: number, x: number, y: number, z: number, rotY = 0) {
  const g = new THREE.TorusGeometry(radius, tube, 8, 24, Math.PI * 1.15);
  g.rotateZ(-Math.PI * 0.075);
  g.rotateY(rotY);
  g.translate(x, y, z);
  return g;
}

/** A horizontal moulding that stops at the doorway. */
function bandAroundDoor(parts: THREE.BufferGeometry[], halfWidth: number, y: number, h: number, depth: number, zFront: number) {
  const inner = DOOR.halfWidth;
  const w = halfWidth - inner;
  parts.push(box(w, h, depth, -(inner + w / 2), y, zFront - depth / 2));
  parts.push(box(w, h, depth, inner + w / 2, y, zFront - depth / 2));
}

interface GopuramGeometry {
  stone: THREE.BufferGeometry;
  carved: THREE.BufferGeometry;
  dark: THREE.BufferGeometry;
  courtyard: THREE.BufferGeometry;
  kalasams: THREE.Vector3[];
}

function buildGopuram(): GopuramGeometry {
  const stone: THREE.BufferGeometry[] = [];
  const carved: THREE.BufferGeometry[] = [];
  const dark: THREE.BufferGeometry[] = [];
  const wallH = 7.5;
  const half = 8;
  const zc = -DOOR.wallDepth / 2;
  const doorTop = FLOOR + DOOR.height;

  // Platform, steps and threshold.
  stone.push(box(14, FLOOR, 2.7, 0, 0, 1.35));
  stone.push(box(8.4, 0.24, 0.42, 0, 0, 2.91));
  stone.push(box(9.0, 0.12, 0.42, 0, 0, 3.33));
  dark.push(box(DOOR.halfWidth * 2, 0.1, 0.36, 0, FLOOR, -0.32));

  // Base wall around the doorway.
  stone.push(box(half - DOOR.halfWidth, wallH, DOOR.wallDepth, -(DOOR.halfWidth + (half - DOOR.halfWidth) / 2), 0, zc));
  stone.push(box(half - DOOR.halfWidth, wallH, DOOR.wallDepth, DOOR.halfWidth + (half - DOOR.halfWidth) / 2, 0, zc));
  stone.push(box(DOOR.halfWidth * 2, wallH - doorTop, DOOR.wallDepth, 0, doorTop, zc));

  // Adhishthana (base mouldings) and kapota (cornice).
  bandAroundDoor(stone, half + 0.2, FLOOR, 0.28, 0.32, 0.3);
  const kumudaL = barrelX(0.15, half - DOOR.halfWidth + 0.2, -(DOOR.halfWidth + (half - DOOR.halfWidth + 0.2) / 2), FLOOR + 0.44, 0.1);
  const kumudaR = barrelX(0.15, half - DOOR.halfWidth + 0.2, DOOR.halfWidth + (half - DOOR.halfWidth + 0.2) / 2, FLOOR + 0.44, 0.1);
  carved.push(kumudaL, kumudaR);
  bandAroundDoor(stone, half + 0.1, FLOOR + 0.6, 0.1, 0.22, 0.16);
  carved.push(box(half * 2 + 0.8, 0.36, 0.95, 0, 7.12, -0.03));
  carved.push(barrelX(0.2, half * 2 + 0.9, 0, 7.1, 0.42, true));
  stone.push(box(half * 2 + 0.2, 0.3, DOOR.wallDepth + 0.3, 0, 7.48, zc));

  // Pilasters and niches on the base wall.
  for (const x of [3.4, 5.2, 6.9, 7.8]) {
    for (const s of [-1, 1]) {
      carved.push(box(0.34, 6.3, 0.14, s * x, FLOOR + 0.72, 0.07));
      carved.push(box(0.54, 0.18, 0.24, s * x, FLOOR + 6.5, 0.1));
    }
  }
  for (const s of [-1, 1]) {
    dark.push(box(0.92, 2.0, 0.05, s * 6.05, FLOOR + 2.1, 0.03));
    carved.push(box(1.24, 0.2, 0.26, s * 6.05, FLOOR + 4.1, 0.12));
    carved.push(arch(0.42, 0.06, s * 6.05, FLOOR + 4.42, 0.14));
    carved.push(box(1.1, 0.14, 0.26, s * 6.05, FLOOR + 1.96, 0.12));
  }

  // Layered door frame with a carved panel above the lintel.
  for (const s of [-1, 1]) {
    carved.push(box(0.5, DOOR.height + 0.5, 0.22, s * (DOOR.halfWidth + 0.25), FLOOR, 0.08));
    carved.push(box(0.28, DOOR.height + 0.82, 0.13, s * (DOOR.halfWidth + 0.64), FLOOR, 0.05));
  }
  carved.push(box(DOOR.halfWidth * 2 + 1.0, 0.5, 0.22, 0, doorTop, 0.08));
  carved.push(box(DOOR.halfWidth * 2 + 1.56, 0.32, 0.13, 0, doorTop + 0.5, 0.05));
  carved.push(box(2.4, 0.78, 0.12, 0, doorTop + 0.84, 0.05));
  dark.push(box(1.9, 0.5, 0.04, 0, doorTop + 0.98, 0.12));

  // Porch roof and beams.
  carved.push(box(9.6, 0.36, 0.64, 0, FLOOR + 5.24, PORCH.z));
  stone.push(box(10.6, 0.3, 2.9, 0, FLOOR + 5.6, 1.25));
  carved.push(box(11.0, 0.24, 0.5, 0, FLOOR + 5.62, 2.72));
  carved.push(barrelX(0.16, 11.0, 0, FLOOR + 5.6, 2.95, true));
  for (let i = 0; i < 7; i++) {
    const x = -4.5 + i * 1.5;
    if (i % 2 === 0) {
      carved.push(box(0.4, 0.32, 0.4, x, FLOOR + 5.9, 2.4));
      carved.push(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(x, FLOOR + 6.22, 2.4));
    } else {
      carved.push(box(0.8, 0.28, 0.36, x, FLOOR + 5.9, 2.4));
      carved.push(barrelX(0.18, 0.8, x, FLOOR + 6.18, 2.4, true));
    }
  }

  // Gopuram tiers.
  const kalasams: THREE.Vector3[] = [];
  const tiers = 6;
  let top = 7.78;
  let lastD = 0;
  let lastZc = 0;
  for (let i = 0; i < tiers; i++) {
    const W = 14.6 - 1.8 * i;
    const D = 6.2 - 0.55 * i;
    const F = -0.25 - 0.4 * i;
    const tz = F - D / 2;
    const y0 = 7.78 + 1.36 * i;
    carved.push(box(W, 1.0, D, 0, y0, tz));
    stone.push(box(W - 0.3, 0.08, D - 0.3, 0, y0 + 1.0, tz));
    stone.push(box(W + 0.36, 0.28, D + 0.36, 0, y0 + 1.08, tz));
    // Pilasters and niches on the tier face.
    const n = Math.floor(W / 0.95);
    for (let k = 0; k <= n; k++) {
      const x = -W / 2 + 0.25 + ((W - 0.5) * k) / n;
      carved.push(box(0.14, 0.82, 0.08, x, y0 + 0.09, F + 0.04));
    }
    for (const x of [0, -W / 3, W / 3]) {
      dark.push(box(0.62, 0.66, 0.05, x, y0 + 0.16, F + 0.03));
      carved.push(arch(0.3, 0.05, x, y0 + 0.82, F + 0.06));
    }
    // Hara: alternating kuta and shala pavilions on the cornice edge.
    const count = Math.max(3, Math.floor(W / 1.15));
    for (let k = 0; k < count; k++) {
      const x = -W / 2 + 0.3 + ((W - 0.6) * k) / (count - 1);
      const py = y0 + 1.36;
      const pz = F + 0.08;
      if (k % 2 === 0) {
        carved.push(box(0.42, 0.3, 0.42, x, py, pz));
        carved.push(new THREE.SphereGeometry(0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.85, 1).translate(x, py + 0.3, pz));
      } else {
        carved.push(box(0.78, 0.28, 0.34, x, py, pz));
        carved.push(barrelX(0.17, 0.78, x, py + 0.28, pz, true));
      }
    }
    top = y0 + 1.36;
    lastD = D;
    lastZc = tz;
  }
  // Crowning shala vault with gable arches and kalasams.
  const vaultLen = 5.4;
  stone.push(box(vaultLen + 0.4, 0.3, lastD - 0.6, 0, top, lastZc));
  carved.push(barrelX(1.05, vaultLen, 0, top + 0.3, lastZc));
  for (const s of [-1, 1]) carved.push(arch(1.05, 0.16, s * (vaultLen / 2 + 0.05), top + 0.3, lastZc, Math.PI / 2));
  carved.push(arch(0.55, 0.1, 0, top + 0.35, lastZc + 1.0));
  dark.push(new THREE.CircleGeometry(0.48, 20, 0, Math.PI).translate(0, top + 0.35, lastZc + 1.02));
  for (let k = 0; k < 7; k++) kalasams.push(new THREE.Vector3(-2.16 + k * 0.72, top + 1.3, lastZc));

  // Prakaram (compound wall) stretching away on both sides.
  for (const s of [-1, 1]) {
    stone.push(box(30, 4.2, 1.0, s * (half + 15), 0, -1.6));
    carved.push(box(30, 0.3, 1.3, s * (half + 15), 4.2, -1.6));
  }

  const courtyard = box(80, 0.1, 60, 0, -0.1, 18);
  return { stone: merge(stone), carved: merge(carved), dark: merge(dark), courtyard, kalasams };
}

export function Gopuram({ shadows }: { shadows: boolean }) {
  const mats = useMaterials();
  const geo = useMemo(buildGopuram, []);
  const pillar = useMemo(() => pillarGeometry(PORCH.pillarSY, 1), []);
  const kalasam = useMemo(() => lathe(KALASAM_PROFILE, 16), []);
  useEffect(
    () => () => {
      geo.stone.dispose();
      geo.carved.dispose();
      geo.dark.dispose();
      geo.courtyard.dispose();
      pillar.dispose();
      kalasam.dispose();
    },
    [geo, pillar, kalasam],
  );

  const pRef = useRef<THREE.InstancedMesh>(null);
  const kRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const p = pRef.current;
    if (p) {
      PORCH.pillarsX.forEach((x, i) => {
        d.position.set(x, FLOOR, PORCH.z);
        d.updateMatrix();
        p.setMatrixAt(i, d.matrix);
      });
      p.instanceMatrix.needsUpdate = true;
      p.computeBoundingSphere();
    }
    const k = kRef.current;
    if (k) {
      geo.kalasams.forEach((pos, i) => {
        d.position.copy(pos);
        d.scale.setScalar(1.15);
        d.updateMatrix();
        k.setMatrixAt(i, d.matrix);
      });
      k.instanceMatrix.needsUpdate = true;
      k.computeBoundingSphere();
    }
  }, [geo]);

  return (
    <group>
      <mesh geometry={geo.courtyard} material={mats.courtyard} receiveShadow={shadows} />
      <mesh geometry={geo.stone} material={mats.stone} receiveShadow={shadows} castShadow={shadows} />
      <mesh geometry={geo.carved} material={mats.carved} receiveShadow={shadows} castShadow={shadows} />
      <mesh geometry={geo.dark} material={mats.darkStone} />
      <instancedMesh ref={pRef} args={[pillar, mats.carved, PORCH.pillarsX.length]} castShadow={shadows} receiveShadow={shadows} />
      <instancedMesh ref={kRef} args={[kalasam, mats.gold, geo.kalasams.length]} />
      <Kolam position={[0, 0.006, 5.6]} size={3.6} />
    </group>
  );
}
