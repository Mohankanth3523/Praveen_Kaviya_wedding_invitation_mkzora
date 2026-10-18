import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { FLOOR } from './layout';

/* -------------------------------------------------------------------------- */
/* Flames: every oil-lamp flame in the temple in two draw calls.               */
/* -------------------------------------------------------------------------- */

const flameVertex = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uScale;
  varying float vFlicker;
  void main() {
    float f = 0.86 + 0.09 * sin(uTime * 9.0 + aSeed * 31.0) + 0.05 * sin(uTime * 17.3 + aSeed * 7.0);
    vFlicker = f;
    vec3 p = position;
    p.x += 0.006 * sin(uTime * 6.0 + aSeed * 13.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * f * uScale / max(0.1, -mv.z);
  }
`;

const flameCoreFragment = /* glsl */ `
  varying float vFlicker;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    p.y = -p.y;
    float up = max(p.y + 0.25, 0.0);
    float down = min(p.y + 0.25, 0.0);
    float shape = exp(-(p.x * p.x * (16.0 + up * 22.0) + up * up * 3.2 + down * down * 26.0));
    if (shape < 0.02) discard;
    vec3 outer = vec3(1.0, 0.55, 0.16);
    vec3 inner = vec3(1.0, 0.93, 0.72);
    vec3 col = mix(outer, inner, smoothstep(0.35, 0.95, shape));
    gl_FragColor = vec4(col * shape * 1.35 * vFlicker, shape);
  }
`;

const flameHaloFragment = /* glsl */ `
  varying float vFlicker;
  uniform vec3 uColor;
  uniform float uIntensity;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(p, p);
    float a = exp(-r2 * 4.5) * uIntensity * vFlicker;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

export interface FlameSpec {
  p: THREE.Vector3;
  /** Relative size; 1 = standing lamp wick. */
  s: number;
}

export function Flames({ flames, size = 0.1 }: { flames: FlameSpec[]; size?: number }) {
  const { size: viewport, camera } = useThree();
  const dpr = useThree((s) => s.viewport.dpr);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(flames.length * 3);
    const seed = new Float32Array(flames.length);
    const sz = new Float32Array(flames.length);
    flames.forEach(({ p, s }, i) => {
      pos.set([p.x, p.y, p.z], i * 3);
      seed[i] = Math.random();
      sz[i] = size * s * (0.85 + Math.random() * 0.3);
    });
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    return g;
  }, [flames, size]);

  const haloGeometry = useMemo(() => {
    const g = geometry.clone();
    const sz = g.getAttribute('aSize') as THREE.BufferAttribute;
    for (let i = 0; i < sz.count; i++) sz.setX(i, sz.getX(i) * 7.5);
    return g;
  }, [geometry]);

  const uniforms = useMemo(
    () => ({
      core: { uTime: { value: 0 }, uScale: { value: 600 } },
      halo: {
        uTime: { value: 0 },
        uScale: { value: 600 },
        uColor: { value: new THREE.Color('#ff9d3c') },
        uIntensity: { value: 0.32 },
      },
    }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      haloGeometry.dispose();
    },
    [geometry, haloGeometry],
  );

  useFrame(({ clock }) => {
    const cam = camera as THREE.PerspectiveCamera;
    const scale = (viewport.height * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    uniforms.core.uTime.value = uniforms.halo.uTime.value = clock.elapsedTime;
    uniforms.core.uScale.value = uniforms.halo.uScale.value = scale;
  });

  return (
    <group>
      <points geometry={haloGeometry} frustumCulled={false} renderOrder={2}>
        <shaderMaterial
          vertexShader={flameVertex}
          fragmentShader={flameHaloFragment}
          uniforms={uniforms.halo}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points geometry={geometry} frustumCulled={false} renderOrder={3}>
        <shaderMaterial
          vertexShader={flameVertex}
          fragmentShader={flameCoreFragment}
          uniforms={uniforms.core}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Floating dust in lamp light — animated entirely on the GPU.                 */
/* -------------------------------------------------------------------------- */

const dustVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * 0.12 + aSeed * 40.0;
    p.x += sin(t * 1.3) * 0.35;
    p.y += sin(t * 0.9 + aSeed * 3.0) * 0.25 + mod(uTime * 0.03 + aSeed * 4.0, 1.0) * 0.4;
    p.z += cos(t * 1.1) * 0.35;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float d = -mv.z;
    vAlpha = smoothstep(0.4, 2.5, d) * (1.0 - smoothstep(14.0, 26.0, d)) * (0.5 + 0.5 * sin(uTime * 0.7 + aSeed * 20.0));
    gl_PointSize = 0.022 * uScale / max(0.2, d);
  }
`;
const dustFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float a = exp(-dot(p, p) * 3.0) * vAlpha * 0.55;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vec3(1.0, 0.82, 0.55) * a, a);
  }
`;

export function Dust({ count, zFrom, zTo }: { count: number; zFrom: number; zTo: number }) {
  const { size: viewport, camera } = useThree();
  const dpr = useThree((s) => s.viewport.dpr);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 1] = FLOOR + 0.3 + Math.random() * 4.6;
      pos[i * 3 + 2] = zFrom + (zTo - zFrom) * Math.random();
      seed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count, zFrom, zTo]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uScale: { value: 600 } }), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    const cam = camera as THREE.PerspectiveCamera;
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uScale.value = (viewport.height * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
  });
  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={4}>
      <shaderMaterial
        vertexShader={dustVertex}
        fragmentShader={dustFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* -------------------------------------------------------------------------- */
/* Light shaft: soft additive volume fading along its length.                  */
/* -------------------------------------------------------------------------- */

const shaftVertex = /* glsl */ `
  varying float vAlong;
  varying float vFacing;
  void main() {
    vAlong = uv.y;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec3 n = normalize(mat3(modelMatrix) * normal);
    vec3 v = normalize(cameraPosition - world.xyz);
    vFacing = abs(dot(n, v));
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const shaftFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlong;
  varying float vFacing;
  void main() {
    float a = pow(vAlong, 1.6) * pow(vFacing, 2.2) * uOpacity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

export interface ShaftHandle {
  setOpacity: (o: number) => void;
}

/**
 * A cone of light from `from` (bright, uv.y = 1) to `to` (faded).
 * `opacity` may be a number or a function evaluated every frame.
 */
export function LightShaft({
  from,
  to,
  radiusFrom,
  radiusTo,
  color = '#ffc76b',
  opacity,
  sides = 24,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  radiusFrom: number;
  radiusTo: number;
  color?: string;
  opacity: number | (() => number);
  sides?: number;
}) {
  const geometry = useMemo(() => {
    const len = from.distanceTo(to);
    // CylinderGeometry top (+y) is uv.y = 1 → make the top the source.
    const g = new THREE.CylinderGeometry(radiusFrom, radiusTo, len, sides, 1, true);
    g.translate(0, -len / 2, 0);
    return g;
  }, [from, to, radiusFrom, radiusTo, sides]);
  const quaternion = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  }, [from, to]);
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(color) }, uOpacity: { value: typeof opacity === 'number' ? opacity : 0 } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color],
  );
  const meshRef = useRef<THREE.Mesh>(null);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const o = typeof opacity === 'function' ? opacity() : opacity;
    uniforms.uOpacity.value = o;
    if (meshRef.current) meshRef.current.visible = o > 0.002;
  });
  return (
    <mesh ref={meshRef} geometry={geometry} position={from} quaternion={quaternion} renderOrder={5} frustumCulled={false}>
      <shaderMaterial
        vertexShader={shaftVertex}
        fragmentShader={shaftFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* -------------------------------------------------------------------------- */
/* Pre-dawn sky with a warm horizon and a few fading stars.                    */
/* -------------------------------------------------------------------------- */

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = /* glsl */ `
  varying vec3 vDir;
  uniform float uTime;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  void main() {
    float h = clamp(vDir.y, -0.2, 1.0);
    vec3 horizon = vec3(0.86, 0.5, 0.3);
    vec3 low = vec3(0.42, 0.26, 0.3);
    vec3 mid = vec3(0.13, 0.12, 0.22);
    vec3 top = vec3(0.04, 0.05, 0.11);
    vec3 col = mix(horizon, low, smoothstep(0.0, 0.08, h));
    col = mix(col, mid, smoothstep(0.08, 0.3, h));
    col = mix(col, top, smoothstep(0.3, 0.85, h));
    // Glow toward the east (behind the gopuram, slightly left).
    float sun = pow(max(dot(normalize(vDir), normalize(vec3(-0.25, 0.04, -1.0))), 0.0), 18.0);
    col += vec3(0.9, 0.5, 0.25) * sun * 0.35;
    // Stars only high up, gently twinkling.
    vec3 cell = floor(vDir * 180.0);
    float s = hash(cell);
    float star = step(0.9965, s) * smoothstep(0.3, 0.7, h) * (0.6 + 0.4 * sin(uTime * 1.5 + s * 100.0));
    col += vec3(star) * 0.8;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Sky() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[150, 32, 16]} />
      <shaderMaterial
        vertexShader={skyVertex}
        fragmentShader={skyFragment}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

/* -------------------------------------------------------------------------- */
/* Coconut palm silhouettes beside the gopuram.                                */
/* -------------------------------------------------------------------------- */

export function Palms({ material }: { material: THREE.Material }) {
  const geometry = useMemo(() => {
    const leaf = new THREE.Shape();
    leaf.moveTo(0, 0);
    leaf.quadraticCurveTo(0.35, 1.2, 0, 2.6);
    leaf.quadraticCurveTo(-0.35, 1.2, 0, 0);
    const parts: THREE.BufferGeometry[] = [];
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.6, 5, 0),
      new THREE.Vector3(1.2, 10, 0),
    );
    parts.push(new THREE.TubeGeometry(curve, 12, 0.16, 6, false));
    for (let i = 0; i < 11; i++) {
      const g = new THREE.ShapeGeometry(leaf, 6);
      const a = (i / 11) * Math.PI * 2;
      g.rotateX(-Math.PI / 2 + 0.9 + (i % 2) * 0.3);
      g.rotateY(a);
      g.translate(1.2, 10, 0);
      parts.push(g);
    }
    const merged = parts.map((g) => (g.index ? g.toNonIndexed() : g));
    merged.forEach((g) => {
      g.deleteAttribute('uv');
    });
    const out = new THREE.BufferGeometry();
    let total = 0;
    merged.forEach((g) => (total += g.attributes.position.count));
    const pos = new Float32Array(total * 3);
    let offset = 0;
    merged.forEach((g) => {
      pos.set(g.attributes.position.array as Float32Array, offset);
      offset += g.attributes.position.array.length;
      g.dispose();
    });
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return out;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const placements: [number, number, number, number, number][] = [
    [-12.5, 0, -7, 0.2, 1.05],
    [-15.5, 0, -12, 0.9, 0.9],
    [12.8, 0, -8, 2.9, 1.0],
    [16.5, 0, -14, 2.5, 1.15],
  ];
  return (
    <group>
      {placements.map(([x, y, z, r, s], i) => (
        <mesh key={i} geometry={geometry} material={material} position={[x, y, z]} rotation={[0, r, 0]} scale={s} />
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Falling petals that follow the camera — marigold, rose and jasmine.         */
/* -------------------------------------------------------------------------- */

const PETAL_COLORS = ['#e8891c', '#f2a531', '#b3192e', '#f5efe2', '#e8891c'];

export function Petals({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const state = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        p: new THREE.Vector3(),
        v: 0.22 + Math.random() * 0.22,
        spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(2),
        phase: Math.random() * Math.PI * 2,
        alive: false,
      })),
    [count],
  );
  const geometry = useMemo(() => {
    const g = new THREE.CircleGeometry(0.045, 8);
    g.scale(1.6, 1, 1);
    return g;
  }, []);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.set(PETAL_COLORS[i % PETAL_COLORS.length]);
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const rel = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    camera.getWorldDirection(forward);
    for (let i = 0; i < count; i++) {
      const s = state[i];
      rel.subVectors(s.p, camera.position);
      const ahead = rel.dot(forward);
      if (!s.alive || s.p.y < FLOOR + 0.02 || ahead < 0.4 || ahead > 10) {
        // Respawn above and ahead of the camera.
        const dist = 1.5 + Math.random() * 7;
        s.p.copy(camera.position).addScaledVector(forward, dist);
        s.p.x += (Math.random() - 0.5) * 6;
        s.p.y = camera.position.y + 1.2 + Math.random() * 2.5;
        s.alive = true;
      }
      s.p.y -= s.v * dt;
      s.p.x += Math.sin(t * 0.8 + s.phase) * 0.12 * dt;
      s.p.z += Math.cos(t * 0.6 + s.phase) * 0.08 * dt;
      dummy.position.copy(s.p);
      dummy.rotation.set(t * s.spin.x + s.phase, t * s.spin.y, t * s.spin.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, count]} frustumCulled={false}>
      <meshLambertMaterial side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
