import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/*
 * NASA models. Source: NASA 3D Resources (https://science.nasa.gov/3d-resources/).
 * - Apollo Lunar Module: https://science.nasa.gov/3d-resources/apollo-lunar-module/
 *   (NASA/Michael D. Carbajal)
 * - Z2 Spacesuit: https://science.nasa.gov/3d-resources/z2-spacesuit/
 *   (NASA/LaRC/Advanced Concepts Lab)
 * File details and licence notes: research/web-assets.md.
 *
 * Each model is fetched once; every call returns a deep clone. Clones share
 * geometries and materials with the cached original, so editing a clone's
 * material changes every copy. Browser only.
 */

let loader: GLTFLoader | null = null;

function getLoader(): GLTFLoader {
  if (!loader) {
    loader = new GLTFLoader();
    // Large models are meshopt-compressed; uncompressed files load as before.
    loader.setMeshoptDecoder(MeshoptDecoder);
  }
  return loader;
}

function meshMaterials(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

let landerPromise: Promise<THREE.Object3D> | null = null;

function prepareLander(gltf: GLTF): THREE.Object3D {
  const root = gltf.scene;
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.castShadow = true;
    o.receiveShadow = true;
    for (const m of meshMaterials(o)) {
      if (!(m instanceof THREE.MeshStandardMaterial)) continue;
      // Gold-coloured parts are the thermal foil: make them shiny and metallic.
      const c = m.color;
      const foil = c.r > c.b * 1.35 && c.g > c.b * 1.1;
      m.metalness = foil ? 0.75 : 0.1;
      m.roughness = foil ? 0.38 : 0.6;
    }
  });
  return root;
}

/** Apollo Lunar Module, at the model's own scale (metres). */
export function loadLander(): Promise<THREE.Object3D> {
  if (!landerPromise) {
    landerPromise = getLoader()
      .loadAsync('/models/LunarModule.glb')
      .then(prepareLander, (error: unknown) => {
        landerPromise = null;
        throw error;
      });
  }
  return landerPromise.then((m) => m.clone(true));
}

let astronautPromise: Promise<THREE.Object3D> | null = null;

/** Centres the model on the origin and scales it to `height` scene units tall. */
function prepareAstronaut(gltf: GLTF, height: number): THREE.Object3D {
  const m = gltf.scene;
  const box = new THREE.Box3().setFromObject(m);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  m.position.sub(centre);
  const wrap = new THREE.Group();
  wrap.add(m);
  wrap.scale.setScalar(height / size.y);
  m.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    for (const mat of meshMaterials(o)) {
      mat.side = THREE.FrontSide;
      if (mat instanceof THREE.MeshStandardMaterial) mat.metalness = 0;
      mat.needsUpdate = true;
    }
  });
  return wrap;
}

/**
 * Astronaut, centred on the origin: the Z2 spacesuit (6.2 units tall) or, if
 * that file cannot load, the smaller fallback model (6 units tall).
 */
export function loadAstronaut(): Promise<THREE.Object3D> {
  if (!astronautPromise) {
    const gl = getLoader();
    astronautPromise = gl
      .loadAsync('/models/Z2Spacesuit.glb')
      .then(
        (g) => prepareAstronaut(g, 6.2),
        () =>
          gl
            .loadAsync('/models/Astronaut.glb')
            .then((g) => prepareAstronaut(g, 6)),
      )
      .catch((error: unknown) => {
        astronautPromise = null;
        throw error;
      });
  }
  return astronautPromise.then((m) => m.clone(true));
}
