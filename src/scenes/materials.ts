import * as THREE from 'three';
import { createContext, useContext } from 'react';
import type { TempleTextures } from './textures';

export interface TempleMaterials {
  stone: THREE.MeshStandardMaterial;
  carved: THREE.MeshStandardMaterial;
  darkStone: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  courtyard: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  gold: THREE.MeshStandardMaterial;
  marigold: THREE.MeshStandardMaterial;
  jasmine: THREE.MeshStandardMaterial;
  leaf: THREE.MeshStandardMaterial;
  clay: THREE.MeshStandardMaterial;
  silhouette: THREE.MeshBasicMaterial;
  kolam: THREE.MeshBasicMaterial;
  /** Soft radial sprite, owned by TempleTextures. */
  glowTexture: THREE.Texture;
  dispose: () => void;
}

export function createMaterials(t: TempleTextures): TempleMaterials {
  const floorTex = t.floor.clone();
  // Box UVs are world / TEX_SCALE (2.4 m). One texture tile holds 4×4 slabs;
  // 0.375 makes each slab 1.6 m square.
  floorTex.repeat.set(0.375, 0.375);
  floorTex.needsUpdate = true;
  const floorBump = t.floorBump.clone();
  floorBump.repeat.copy(floorTex.repeat);
  floorBump.needsUpdate = true;

  const m = {
    stone: new THREE.MeshStandardMaterial({
      map: t.stoneColor,
      bumpMap: t.stoneBump,
      bumpScale: 1.2,
      color: '#d9c4a6',
      roughness: 0.88,
      metalness: 0,
    }),
    carved: new THREE.MeshStandardMaterial({
      map: t.carvedColor,
      bumpMap: t.carvedBump,
      bumpScale: 2.2,
      color: '#d2b896',
      roughness: 0.9,
      metalness: 0,
    }),
    darkStone: new THREE.MeshStandardMaterial({
      map: t.carvedColor,
      color: '#5a4636',
      roughness: 0.95,
    }),
    floor: new THREE.MeshStandardMaterial({
      map: floorTex,
      bumpMap: floorBump,
      bumpScale: 0.6,
      color: '#c9b394',
      roughness: 0.42,
      metalness: 0.05,
    }),
    courtyard: new THREE.MeshStandardMaterial({
      map: floorTex,
      color: '#8f7c66',
      roughness: 0.92,
    }),
    wood: new THREE.MeshStandardMaterial({
      map: t.wood,
      color: '#c49a7a',
      roughness: 0.62,
      metalness: 0.02,
    }),
    brass: new THREE.MeshStandardMaterial({
      color: '#c99a45',
      roughness: 0.3,
      metalness: 0.92,
    }),
    gold: new THREE.MeshStandardMaterial({
      color: '#d8b064',
      roughness: 0.26,
      metalness: 1,
      emissive: '#3a2406',
      emissiveIntensity: 0.4,
    }),
    marigold: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.78, vertexColors: false }),
    jasmine: new THREE.MeshStandardMaterial({ color: '#f3ece0', roughness: 0.6, emissive: '#2b241a', emissiveIntensity: 0.3 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#2e4f1f', roughness: 0.6, side: THREE.DoubleSide }),
    clay: new THREE.MeshStandardMaterial({ color: '#8a4b2a', roughness: 0.85 }),
    silhouette: new THREE.MeshBasicMaterial({ color: '#120d0c', fog: true }),
    kolam: new THREE.MeshBasicMaterial({
      map: t.kolam,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      color: '#d9d2c4',
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  };
  return {
    ...m,
    glowTexture: t.glow,
    dispose: () => {
      Object.values(m).forEach((mat) => mat.dispose());
      floorTex.dispose();
      floorBump.dispose();
    },
  };
}

export const MaterialsContext = createContext<TempleMaterials | null>(null);

export function useMaterials(): TempleMaterials {
  const ctx = useContext(MaterialsContext);
  if (!ctx) throw new Error('MaterialsContext missing');
  return ctx;
}
