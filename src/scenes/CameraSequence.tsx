import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { buildCameraPath, type TempleLayout } from './layout';
import { readProgress, useSequenceRef } from './sequence';

const ZERO = new THREE.Vector2(0, 0);

/**
 * Drives the camera from the temple entrance, through the doorway and down
 * the pillared hall to the mandapam. Purely a renderer of the shared
 * sequence clock — it never changes the phase itself.
 */
export function CameraSequence({ layout, pointerParallax }: { layout: TempleLayout; pointerParallax: boolean }) {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const seq = useSequenceRef();
  const aspectKey = Math.round((size.width / Math.max(1, size.height)) * 20) / 20;
  const path = useMemo(() => buildCameraPath(aspectKey, cam.fov, layout), [aspectKey, cam.fov, layout]);
  const look = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3());
  const parallax = useRef(new THREE.Vector2());

  useFrame(({ clock, pointer }, delta) => {
    const p = readProgress(seq.current);
    const t = clock.elapsedTime;
    const reduced = seq.current.reducedMotion;
    const u = p.travel;
    if (u <= 0) {
      pos.current.copy(path.start.position);
      look.current.copy(path.start.target);
    } else {
      path.positions.getPointAt(u, pos.current);
      path.targets.getPointAt(u, look.current);
    }
    if (!reduced) {
      // Barely-there breathing while the visitor reads the intro; it fades
      // out smoothly as the camera starts to travel, so there is no jump.
      const sway = 1 - u;
      pos.current.x += Math.sin(t * 0.16) * 0.22 * sway;
      pos.current.y += Math.sin(t * 0.23) * 0.06 * sway;
    }

    // Subtle pointer parallax once settled (desktop only, never during travel).
    const settled = u >= 1;
    const want = settled && pointerParallax && !reduced ? pointer : ZERO;
    const k = 1 - Math.exp(-delta * 2.5);
    parallax.current.x += (want.x - parallax.current.x) * k;
    parallax.current.y += (want.y - parallax.current.y) * k;
    pos.current.x += parallax.current.x * 0.32;
    pos.current.y += parallax.current.y * 0.14;

    cam.position.copy(pos.current);
    cam.lookAt(look.current);
  });

  return null;
}
