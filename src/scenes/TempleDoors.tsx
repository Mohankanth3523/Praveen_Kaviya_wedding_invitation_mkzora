import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMaterials } from './materials';
import { box, lathe, merge } from './geometry';
import { DOOR, FLOOR } from './layout';
import { readProgress, useSequenceRef } from './sequence';
import { LightShaft } from './Effects';

const LEAF_W = DOOR.halfWidth - 0.012;
const LEAF_H = DOOR.height - 0.02;
/** Maximum swing; the leaves come to rest against the deep stone reveal. */
const OPEN_ANGLE = 1.48;

/**
 * One carved teak leaf with raised panels, brass bands, pointed brass studs,
 * rosettes and a ring pull. Local hinge at x = 0, leaf spans +x.
 */
function buildLeaf() {
  const wood: THREE.BufferGeometry[] = [];
  const brass: THREE.BufferGeometry[] = [];
  wood.push(box(LEAF_W, LEAF_H, 0.16, LEAF_W / 2, 0.01, 0));
  const cols = [0.4, 1.18];
  for (let r = 0; r < 5; r++) {
    const y = 0.36 + r * 1.0;
    for (const x of cols) {
      wood.push(box(0.64, 0.86, 0.02, x, y - 0.04, 0.09));
      wood.push(box(0.54, 0.76, 0.05, x, y + 0.01, 0.105));
      const rosette = new THREE.CylinderGeometry(0.085, 0.1, 0.03, 16);
      rosette.rotateX(Math.PI / 2);
      rosette.translate(x, y + 0.39, 0.145);
      brass.push(rosette);
    }
  }
  const stud = lathe(
    [
      [0, 0],
      [0.042, 0],
      [0.045, 0.02],
      [0.03, 0.05],
      [0, 0.085],
    ],
    10,
  );
  stud.rotateX(Math.PI / 2);
  for (let b = 0; b < 6; b++) {
    const y = 0.2 + b * 1.0;
    brass.push(box(LEAF_W - 0.08, 0.075, 0.025, LEAF_W / 2, y - 0.0375, 0.095));
    for (let k = 0; k < 7; k++) {
      const s = stud.clone();
      s.translate(0.16 + k * 0.205, y, 0.105);
      brass.push(s);
    }
  }
  stud.dispose();
  brass.push(box(0.06, LEAF_H - 0.1, 0.03, LEAF_W - 0.04, 0.06, 0.095));
  const plate = new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16);
  plate.rotateX(Math.PI / 2);
  plate.translate(LEAF_W - 0.2, 2.85, 0.13);
  brass.push(plate);
  const ring = new THREE.TorusGeometry(0.12, 0.018, 8, 28);
  ring.translate(LEAF_W - 0.2, 2.73, 0.15);
  brass.push(ring);
  return { wood: merge(wood), brass: merge(brass) };
}

export function TempleDoors({ shadows }: { shadows: boolean }) {
  const mats = useMaterials();
  const seq = useSequenceRef();
  const leaf = useMemo(buildLeaf, []);
  useEffect(
    () => () => {
      leaf.wood.dispose();
      leaf.brass.dispose();
    },
    [leaf],
  );
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const seamMat = useRef<THREE.MeshBasicMaterial>(null);
  const sillMat = useRef<THREE.MeshBasicMaterial>(null);
  const doorLight = useRef<THREE.PointLight>(null);
  const progress = useRef({ doors: 0, travel: 0 });
  const shaft = useMemo(
    () => ({ from: new THREE.Vector3(0, FLOOR + 2.9, -2.2), to: new THREE.Vector3(0, FLOOR + 0.3, 8.5) }),
    [],
  );

  useFrame(({ clock }) => {
    const p = readProgress(seq.current);
    progress.current.doors = p.doors;
    progress.current.travel = p.travel;
    // A slight settle at the end of the swing reads as heavy wood.
    const settle = p.doors >= 1 || p.doors <= 0 ? 0 : Math.sin(p.doors * Math.PI) * 0.015;
    const angle = OPEN_ANGLE * p.doors + settle;
    if (left.current) left.current.rotation.y = angle;
    if (right.current) right.current.rotation.y = -angle;
    // Lamp light flickering through the seam before the doors open.
    const flicker = 0.9 + 0.1 * Math.sin(clock.elapsedTime * 7.3) * Math.sin(clock.elapsedTime * 3.1);
    const seamFade = 1 - Math.min(1, p.doors * 3);
    if (seamMat.current) seamMat.current.opacity = 0.85 * seamFade * flicker;
    if (sillMat.current) sillMat.current.opacity = 0.7 * seamFade * flicker;
    if (doorLight.current) doorLight.current.intensity = 6 + p.doors * 30 * (1 - p.travel * 0.5);
  });

  return (
    <group>
      <group ref={left} position={[-DOOR.halfWidth, FLOOR, DOOR.z]}>
        <mesh geometry={leaf.wood} material={mats.wood} castShadow={shadows} receiveShadow={shadows} />
        <mesh geometry={leaf.brass} material={mats.brass} />
      </group>
      <group ref={right} position={[DOOR.halfWidth, FLOOR, DOOR.z]} scale={[-1, 1, 1]}>
        <mesh geometry={leaf.wood} material={mats.wood} castShadow={shadows} receiveShadow={shadows} />
        <mesh geometry={leaf.brass} material={mats.brass} />
      </group>
      <DoorGlow seamRef={seamMat} sillRef={sillMat} />
      <pointLight ref={doorLight} position={[0, FLOOR + 3.0, -3.6]} color="#ffbf6b" intensity={6} distance={18} decay={1.6} />
      <LightShaft
        from={shaft.from}
        to={shaft.to}
        radiusFrom={1.25}
        radiusTo={3.4}
        opacity={() => progress.current.doors * 0.16 * (1 - progress.current.travel)}
      />
    </group>
  );
}

function DoorGlow({
  seamRef,
  sillRef,
}: {
  seamRef: RefObject<THREE.MeshBasicMaterial>;
  sillRef: RefObject<THREE.MeshBasicMaterial>;
}) {
  const mats = useMaterials();
  const texture = mats.glowTexture;
  return (
    <group>
      <mesh position={[0, FLOOR + DOOR.height / 2, DOOR.z + 0.12]} renderOrder={6}>
        <planeGeometry args={[0.42, DOOR.height * 1.05]} />
        <meshBasicMaterial
          ref={seamRef}
          map={texture}
          color="#ffb24f"
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, FLOOR + 0.06, DOOR.z + 0.14]} renderOrder={6}>
        <planeGeometry args={[DOOR.halfWidth * 2.3, 0.3]} />
        <meshBasicMaterial
          ref={sillRef}
          map={texture}
          color="#ffb24f"
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
