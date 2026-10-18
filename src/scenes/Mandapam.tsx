import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMaterials } from './materials';
import { KALASAM_PROFILE, box, lathe, merge, pillarGeometry } from './geometry';
import { FLOOR, type TempleLayout } from './layout';
import { Kolam, mandapamMetrics } from './Decor';
import { LightShaft } from './Effects';
import { readProgress, useSequenceRef } from './sequence';

function buildMandapam(layout: TempleLayout) {
  const m = mandapamMetrics(layout);
  const stone: THREE.BufferGeometry[] = [];
  const carved: THREE.BufferGeometry[] = [];
  const gold: THREE.BufferGeometry[] = [];
  const z = m.z;
  // Three-tier plinth (adhishthana) with a carved middle band.
  stone.push(box(7.0, 0.3, 5.6, 0, FLOOR, z));
  carved.push(box(6.3, 0.3, 4.9, 0, FLOOR + 0.3, z));
  stone.push(box(5.6, 0.25, 4.3, 0, FLOOR + 0.6, z));
  // Front steps.
  stone.push(box(1.8, 0.15, 0.36, 0, FLOOR, z + 2.98));

  // Canopy: beams, slab, stepped tiers, dome.
  const t = m.pillarTop;
  for (const s of [-1, 1]) {
    carved.push(box(4.7, 0.34, 0.5, 0, t, z + s * 1.6));
    carved.push(box(0.5, 0.34, 3.7, s * 2.0, t, z));
  }
  stone.push(box(5.4, 0.24, 4.5, 0, t + 0.34, z));
  carved.push(box(4.6, 0.32, 3.7, 0, t + 0.58, z));
  stone.push(box(4.9, 0.12, 4.0, 0, t + 0.9, z));
  carved.push(box(3.6, 0.28, 2.8, 0, t + 1.02, z));
  const dome = new THREE.SphereGeometry(1.05, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.scale(1, 0.62, 1);
  dome.translate(0, t + 1.3, z);
  carved.push(dome);
  // Kudu arches on the canopy front.
  for (const x of [-1.5, 0, 1.5]) {
    const a = new THREE.TorusGeometry(0.3, 0.05, 8, 20, Math.PI * 1.1);
    a.rotateZ(-Math.PI * 0.05);
    a.translate(x, t + 0.6, z + 1.86);
    carved.push(a);
  }

  // Prabha (thiruvachi) — the gilded arch that frames the sacred centre.
  const prabha = new THREE.TorusGeometry(1.75, 0.07, 10, 64, Math.PI * 1.18);
  prabha.rotateZ(-Math.PI * 0.09);
  prabha.translate(0, m.platformTop + 1.45, z - 0.9);
  gold.push(prabha);
  const inner = new THREE.TorusGeometry(1.55, 0.025, 6, 64, Math.PI * 1.18);
  inner.rotateZ(-Math.PI * 0.09);
  inner.translate(0, m.platformTop + 1.45, z - 0.88);
  gold.push(inner);
  // Flame tongues (jwala) around the arch.
  for (let i = 0; i <= 22; i++) {
    const a = -Math.PI * 0.09 + (i / 22) * Math.PI * 1.18;
    const cone = new THREE.ConeGeometry(0.06, 0.2, 6);
    cone.translate(0, 0.1, 0);
    cone.rotateZ(a - Math.PI / 2);
    cone.translate(Math.cos(a) * 1.82, m.platformTop + 1.45 + Math.sin(a) * 1.82, z - 0.9);
    gold.push(cone);
  }
  for (const s of [-1, 1]) {
    gold.push(box(0.16, 1.2, 0.16, s * 1.78, m.platformTop, z - 0.9));
  }
  // Low brass pedestal (peetam) at the centre.
  const peetam = lathe(
    [
      [0, 0],
      [0.62, 0],
      [0.62, 0.08],
      [0.48, 0.12],
      [0.42, 0.28],
      [0.56, 0.34],
      [0.56, 0.4],
      [0, 0.4],
    ],
    32,
  );
  peetam.translate(0, m.platformTop, z - 0.2);
  gold.push(peetam);

  return { stone: merge(stone), carved: merge(carved), gold: merge(gold), metrics: m };
}

export function Mandapam({ layout }: { layout: TempleLayout }) {
  const mats = useMaterials();
  const seq = useSequenceRef();
  const geo = useMemo(() => buildMandapam(layout), [layout]);
  const pillar = useMemo(() => pillarGeometry(1, 0.62), []);
  const kalasam = useMemo(() => lathe(KALASAM_PROFILE, 16), []);
  useEffect(
    () => () => {
      geo.stone.dispose();
      geo.carved.dispose();
      geo.gold.dispose();
      pillar.dispose();
      kalasam.dispose();
    },
    [geo, pillar, kalasam],
  );
  const m = geo.metrics;
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    m.pillars.forEach(([x, z], i) => {
      d.position.set(x, m.platformTop, z);
      d.scale.set(1, m.pillarSY, 1);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [m]);

  const spot = useRef<THREE.SpotLight>(null);
  const spotTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, m.platformTop, m.z);
    return o;
  }, [m]);
  const backGlow = useRef<THREE.MeshBasicMaterial>(null);
  const shaft = useMemo(
    () => ({ from: new THREE.Vector3(0, m.pillarTop + 2.2, m.z - 0.3), to: new THREE.Vector3(0, m.platformTop, m.z + 0.2) }),
    [m],
  );
  const arrival = useRef(0);

  useFrame(({ clock }) => {
    const p = readProgress(seq.current);
    // The sacred centre brightens as the camera arrives.
    arrival.current = THREE.MathUtils.clamp((p.travel - 0.55) / 0.45, 0, 1);
    if (spot.current) spot.current.intensity = 30 + arrival.current * 70;
    if (backGlow.current) {
      backGlow.current.opacity = (0.35 + arrival.current * 0.4) * (0.94 + 0.06 * Math.sin(clock.elapsedTime * 1.3));
    }
  });

  return (
    <group>
      <mesh geometry={geo.stone} material={mats.stone} receiveShadow={layout.shadows} castShadow={layout.shadows} />
      <mesh geometry={geo.carved} material={mats.carved} receiveShadow={layout.shadows} castShadow={layout.shadows} />
      <mesh geometry={geo.gold} material={mats.gold} castShadow={layout.shadows} />
      <instancedMesh ref={ref} args={[pillar, mats.carved, 4]} castShadow={layout.shadows} receiveShadow={layout.shadows} />
      <mesh geometry={kalasam} material={mats.gold} position={[0, m.pillarTop + 1.92, m.z]} scale={0.7} />
      <Kolam position={[0, FLOOR + 0.004, m.z + 4.4]} size={2.6} />

      {/* Golden glow behind the prabha. */}
      <mesh position={[0, m.platformTop + 1.5, m.z - 1.1]} renderOrder={6}>
        <planeGeometry args={[6.5, 5.5]} />
        <meshBasicMaterial
          ref={backGlow}
          map={mats.glowTexture}
          color="#ffbe63"
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <primitive object={spotTarget} />
      <spotLight
        ref={spot}
        position={[0, m.pillarTop + 2.0, m.z + 2.4]}
        target={spotTarget}
        angle={0.62}
        penumbra={0.85}
        color="#ffcf86"
        intensity={30}
        distance={16}
        decay={1.4}
        castShadow={layout.shadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />
      <pointLight position={[-2.6, FLOOR + 2.6, m.z + 3.4]} color="#ffad5c" intensity={10} distance={10} decay={1.8} />
      <pointLight position={[2.6, FLOOR + 2.6, m.z + 3.4]} color="#ffad5c" intensity={10} distance={10} decay={1.8} />
      <LightShaft
        from={shaft.from}
        to={shaft.to}
        radiusFrom={0.6}
        radiusTo={2.2}
        color="#ffd08a"
        opacity={() => 0.05 + arrival.current * 0.1}
      />
    </group>
  );
}
