import * as THREE from 'three';

/** Interior floor height (top of the temple platform). */
export const FLOOR = 0.36;
export const DOOR = { halfWidth: 1.6, height: 5.4, z: -0.7, wallDepth: 2.4 } as const;

export interface TempleLayout {
  mobile: boolean;
  /** z of each interior pillar row. */
  pillarRows: number[];
  /** x positions of pillar columns. */
  pillarColumns: number[];
  mandapamZ: number;
  backWallZ: number;
  hallEndZ: number;
  cameraEnd: THREE.Vector3;
  targetEnd: THREE.Vector3;
  particleCount: number;
  petalCount: number;
  shadows: boolean;
}

export function createLayout(mobile: boolean, lowPower: boolean): TempleLayout {
  if (mobile) {
    const mandapamZ = -17.5;
    return {
      mobile,
      pillarRows: [-4.6, -8.2, -11.8],
      pillarColumns: [-2.8, 2.8],
      mandapamZ,
      backWallZ: mandapamZ - 5,
      hallEndZ: mandapamZ - 5,
      cameraEnd: new THREE.Vector3(0, FLOOR + 2.0, mandapamZ + 8.6),
      targetEnd: new THREE.Vector3(0, FLOOR + 2.6, mandapamZ),
      particleCount: lowPower ? 60 : 120,
      petalCount: lowPower ? 12 : 24,
      shadows: false,
    };
  }
  const mandapamZ = -25.5;
  return {
    mobile,
    pillarRows: [-4.6, -8.2, -11.8, -15.4, -19.0],
    pillarColumns: [-4.7, -2.8, 2.8, 4.7],
    mandapamZ,
    backWallZ: mandapamZ - 5,
    hallEndZ: mandapamZ - 5,
    cameraEnd: new THREE.Vector3(0, FLOOR + 2.0, mandapamZ + 7.6),
    targetEnd: new THREE.Vector3(0, FLOOR + 2.7, mandapamZ),
    particleCount: lowPower ? 160 : 360,
    petalCount: lowPower ? 30 : 64,
    shadows: !lowPower,
  };
}

/**
 * Start position adapts to the viewport so the doors and both entrance
 * pillars stay in frame on tall phone screens.
 */
export function startPose(aspect: number, fovDeg: number) {
  const halfV = Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
  const halfH = halfV * aspect;
  const needHalfWidth = 4.2; // doors + entrance pillars
  const z = THREE.MathUtils.clamp(needHalfWidth / halfH, 14, 21);
  return {
    position: new THREE.Vector3(0, FLOOR + 1.9, z),
    target: new THREE.Vector3(0, aspect < 1 ? 6.2 : 5.0, 0),
  };
}

export function buildCameraPath(aspect: number, fov: number, layout: TempleLayout) {
  const start = startPose(aspect, fov);
  const endZ = layout.cameraEnd.z;
  const positions = new THREE.CatmullRomCurve3(
    [
      start.position,
      new THREE.Vector3(0, FLOOR + 1.75, 5.5),
      new THREE.Vector3(0, FLOOR + 1.7, 1.2),
      new THREE.Vector3(0, FLOOR + 1.72, -3.4),
      new THREE.Vector3(0, FLOOR + 1.82, (-3.4 + endZ) / 2),
      layout.cameraEnd,
    ],
    false,
    'centripetal',
  );
  const targets = new THREE.CatmullRomCurve3(
    [
      start.target,
      new THREE.Vector3(0, FLOOR + 3.5, -4),
      new THREE.Vector3(0, FLOOR + 2.5, (-4 + layout.mandapamZ) / 2),
      layout.targetEnd,
    ],
    false,
    'centripetal',
  );
  return { start, positions, targets };
}
