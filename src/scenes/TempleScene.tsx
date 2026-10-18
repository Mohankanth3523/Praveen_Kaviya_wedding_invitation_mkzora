import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { createTempleTextures } from './textures';
import { createMaterials, MaterialsContext } from './materials';
import { createLayout, FLOOR, type TempleLayout } from './layout';
import { SequenceContext, type SequenceState } from './sequence';
import { Gopuram } from './Gopuram';
import { TempleDoors } from './TempleDoors';
import { TempleInterior } from './TempleInterior';
import { Mandapam } from './Mandapam';
import { CameraSequence } from './CameraSequence';
import { Garlands, Lamps, buildGarlandPlan, buildLampPlan } from './Decor';
import { Dust, Palms, Petals, Sky } from './Effects';

export interface TempleSceneProps {
  sequence: SequenceState;
  mobile: boolean;
  lowPower: boolean;
  /** Stop rendering when the stage is scrolled out of view. */
  paused: boolean;
  onReady: () => void;
  onError: (reason: string) => void;
}

/** A warm, lamp-lit environment map built from emissive panels (no HDR download). */
function TempleEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const envScene = new THREE.Scene();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(vec3(0.32,0.17,0.08), vec3(0.06,0.05,0.07), smoothstep(-0.2, 0.7, h)); gl_FragColor = vec4(c, 1.0); }',
      }),
    );
    envScene.add(sphere);
    const panelGeo = new THREE.PlaneGeometry(2.4, 1.2);
    const panelMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb15a').multiplyScalar(4) });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(Math.cos(a) * 6, 0.8 + (i % 2) * 1.2, Math.sin(a) * 6);
      panel.lookAt(0, 0, 0);
      envScene.add(panel);
    }
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(envScene, 0.04);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.55;
    pmrem.dispose();
    sphere.geometry.dispose();
    (sphere.material as THREE.Material).dispose();
    panelGeo.dispose();
    panelMat.dispose();
    return () => {
      scene.environment = null;
      rt.dispose();
    };
  }, [gl, scene]);
  return null;
}

function ReadySignal({ onReady }: { onReady: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    // Compile shaders up front so the first door swing doesn't stutter.
    try {
      gl.compile(scene, camera);
    } catch {
      /* compile is an optimisation only */
    }
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!cancelled) onReady();
      }),
    );
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [gl, scene, camera, onReady]);
  return null;
}

function SceneContent({ layout, quality, onReady }: { layout: TempleLayout; quality: 'high' | 'low'; onReady: () => void }) {
  const textures = useMemo(() => createTempleTextures(quality), [quality]);
  const materials = useMemo(() => createMaterials(textures), [textures]);
  useEffect(
    () => () => {
      materials.dispose();
      textures.dispose();
    },
    [materials, textures],
  );
  const lampPlan = useMemo(() => buildLampPlan(layout), [layout]);
  const garlandPlan = useMemo(() => buildGarlandPlan(layout), [layout]);
  const uplightTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 11, -3);
    return o;
  }, []);

  return (
    <MaterialsContext.Provider value={materials}>
      <TempleEnvironment />
      <Sky />
      <hemisphereLight args={['#5a6688', '#2a1b12', 0.6]} />
      <directionalLight position={[-14, 22, 18]} intensity={0.35} color="#8c9cc4" />
      {/* Warm uplight on the gopuram from the courtyard lamps. */}
      <primitive object={uplightTarget} />
      <spotLight
        position={[0, 0.6, 12]}
        target={uplightTarget}
        angle={0.42}
        penumbra={1}
        intensity={120}
        distance={40}
        decay={1.5}
        color="#ffb469"
      />
      {/* Porch lamps. */}
      <pointLight position={[-3.4, FLOOR + 1.9, 1.5]} color="#ffae55" intensity={9} distance={9} decay={1.6} />
      <pointLight position={[3.4, FLOOR + 1.9, 1.5]} color="#ffae55" intensity={9} distance={9} decay={1.6} />

      <Gopuram shadows={layout.shadows} />
      <TempleDoors shadows={layout.shadows} />
      <TempleInterior layout={layout} />
      <Mandapam layout={layout} />
      <Lamps plan={lampPlan} castShadow={false} />
      <Garlands plan={garlandPlan} />
      <Palms material={materials.silhouette} />
      <Dust count={layout.particleCount} zFrom={8} zTo={layout.mandapamZ + 2} />
      <Petals count={layout.petalCount} />
      <ReadySignal onReady={onReady} />
    </MaterialsContext.Provider>
  );
}

export default function TempleScene({ sequence, mobile, lowPower, paused, onReady, onError }: TempleSceneProps) {
  const [degraded, setDegraded] = useState(lowPower);
  const layout = useMemo(() => createLayout(mobile, degraded), [mobile, degraded]);
  const maxDpr = mobile ? 1.5 : 1.75;
  const [dpr, setDpr] = useState<number>(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : maxDpr));
  const seqRef = useRef<SequenceState>(sequence);
  useLayoutEffect(() => {
    seqRef.current = sequence;
  }, [sequence]);
  const fov = mobile ? 52 : 42;

  return (
    <SequenceContext.Provider value={seqRef}>
      <Canvas
        dpr={dpr}
        shadows={layout.shadows ? 'soft' : false}
        frameloop={paused ? 'never' : 'always'}
        gl={{ antialias: !mobile, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ fov, near: 0.1, far: 400, position: [0, FLOOR + 1.9, 16] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            onError('WebGL context lost');
          });
        }}
        aria-hidden="true"
        tabIndex={-1}
      >
        <color attach="background" args={['#120d0b']} />
        <fog attach="fog" args={['#1d1410', 18, 62]} />
        <PerformanceMonitor
          onDecline={() => {
            setDpr(1);
            setDegraded(true);
          }}
          flipflops={2}
          onFallback={() => setDpr(1)}
        />
        <SceneContent layout={layout} quality={lowPower ? 'low' : 'high'} onReady={onReady} />
        <CameraSequence layout={layout} pointerParallax={!mobile} />
      </Canvas>
    </SequenceContext.Provider>
  );
}
