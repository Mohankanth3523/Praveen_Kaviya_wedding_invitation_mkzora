import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useMaterials } from './materials';
import { box, cylinder, merge, pillarGeometry } from './geometry';
import { DOOR, FLOOR, type TempleLayout } from './layout';

const HALL_HALF_WIDTH = 6.2;
export const CEILING = FLOOR + 6.8;

function buildHall(layout: TempleLayout) {
  const stone: THREE.BufferGeometry[] = [];
  const carved: THREE.BufferGeometry[] = [];
  const dark: THREE.BufferGeometry[] = [];
  const zStart = -DOOR.wallDepth;
  const zEnd = layout.hallEndZ;
  const len = zStart - zEnd;
  const zMid = (zStart + zEnd) / 2;

  const floor = box(HALL_HALF_WIDTH * 2, 0.2, len, 0, FLOOR - 0.2, zMid);
  // Side walls, ceiling and back wall.
  for (const s of [-1, 1]) {
    stone.push(box(0.6, CEILING - FLOOR + 0.6, len, s * (HALL_HALF_WIDTH + 0.3), FLOOR, zMid));
    // Wall pilasters and a moulded dado.
    stone.push(box(0.14, 0.5, len, s * (HALL_HALF_WIDTH - 0.07), FLOOR, zMid));
  }
  dark.push(box(HALL_HALF_WIDTH * 2 + 1.2, 0.4, len, 0, CEILING, zMid));
  stone.push(box(HALL_HALF_WIDTH * 2, CEILING - FLOOR, 0.6, 0, FLOOR, layout.backWallZ - 0.3));

  // Beams over every pillar row and along the pillar lines.
  layout.pillarRows.forEach((z) => carved.push(box(HALL_HALF_WIDTH * 2, 0.46, 0.62, 0, CEILING - 0.46, z)));
  layout.pillarColumns.forEach((x) => carved.push(box(0.62, 0.46, len, x, CEILING - 0.46, zMid)));

  // Lotus medallions in the ceiling bays along the aisle.
  const rows = [zStart, ...layout.pillarRows];
  for (let i = 0; i < rows.length - 1; i++) {
    const z = (rows[i] + rows[i + 1]) / 2;
    carved.push(cylinder(0.85, 0.85, 0.07, 32, 0, CEILING - 0.07, z));
    carved.push(cylinder(0.5, 0.62, 0.1, 16, 0, CEILING - 0.17, z));
    carved.push(cylinder(0.18, 0.3, 0.12, 12, 0, CEILING - 0.29, z));
  }

  // Niche on the back wall behind the mandapam.
  dark.push(box(3.6, 3.8, 0.1, 0, FLOOR + 1.2, layout.backWallZ + 0.02));
  carved.push(box(4.2, 0.36, 0.3, 0, FLOOR + 5.0, layout.backWallZ + 0.1));
  for (const s of [-1, 1]) carved.push(box(0.3, 3.8, 0.3, s * 1.95, FLOOR + 1.2, layout.backWallZ + 0.1));

  return { floor, stone: merge(stone), carved: merge(carved), dark: merge(dark) };
}

export function TempleInterior({ layout }: { layout: TempleLayout }) {
  const mats = useMaterials();
  const geo = useMemo(() => buildHall(layout), [layout]);
  const pillar = useMemo(() => pillarGeometry(1, 1), []);
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      pillar.dispose();
    },
    [geo, pillar],
  );
  const positions = useMemo(
    () => layout.pillarRows.flatMap((z) => layout.pillarColumns.map((x) => new THREE.Vector3(x, FLOOR, z))),
    [layout],
  );
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    positions.forEach((p, i) => {
      d.position.copy(p);
      d.rotation.y = (i % 2) * Math.PI * 0.5; // vary the carving texture
      d.scale.set(1, (CEILING - 0.46 - FLOOR) / 5.16, 1);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [positions]);

  return (
    <group>
      <mesh geometry={geo.floor} material={mats.floor} receiveShadow={layout.shadows} />
      <mesh geometry={geo.stone} material={mats.stone} receiveShadow={layout.shadows} />
      <mesh geometry={geo.carved} material={mats.carved} />
      <mesh geometry={geo.dark} material={mats.darkStone} />
      <instancedMesh
        ref={ref}
        args={[pillar, mats.carved, positions.length]}
        castShadow={layout.shadows}
        receiveShadow={layout.shadows}
      />
      {/* Warm lamp pools along the hall. */}
      <pointLight position={[0, FLOOR + 3.2, -7.5]} color="#ffb766" intensity={14} distance={14} decay={1.7} />
      {!layout.mobile && <pointLight position={[0, FLOOR + 3.2, -15.5]} color="#ffb766" intensity={12} distance={14} decay={1.7} />}
    </group>
  );
}
