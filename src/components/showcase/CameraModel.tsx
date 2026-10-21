"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ShowcaseState } from "./state";

export const MODEL_URL = "/assets/models/camera.glb";

type MaterialKey = "housing" | "aperture" | "glass" | "lens" | "steel" | "rubber";

type PartSpec = {
  name: string;
  material: MaterialKey;
  /** Exploded offset in normalised model units (model's longest side = 1). */
  explode: [number, number, number];
  /** Extra spin around the optical (Z) axis when exploded. */
  spin?: number;
  /** Order in which the part leaves the assembly (0 first). */
  order: number;
};

/**
 * camera.glb ships 25 child nodes under one group (index order below). Every
 * primitive uses the same grey placeholder material, so finishes are assigned
 * here to match the Figma studio renders. +Z is the optical axis (front),
 * +Y is up, the bracket hangs below the housing.
 */
const PARTS: PartSpec[] = [
  { name: "body", material: "housing", explode: [0, 0, 0], order: 0 },
  { name: "bracket", material: "housing", explode: [0, -0.16, -0.04], order: 3 },
  { name: "aperture", material: "aperture", explode: [0, 0, 0.62], spin: 0.9, order: 1 },
  { name: "glass", material: "glass", explode: [0, 0, 1], order: 0 },
  { name: "bezel", material: "housing", explode: [0, 0, 0.36], spin: -0.5, order: 2 },
  { name: "screw", material: "steel", explode: [0.3, 0, 0], order: 4 },
  { name: "screw", material: "steel", explode: [0.3, 0, 0], order: 4 },
  { name: "screw", material: "steel", explode: [-0.3, 0, 0], order: 4 },
  { name: "screw", material: "steel", explode: [-0.3, 0, 0], order: 4 },
  { name: "lens-core", material: "glass", explode: [0, 0, 0.92], spin: 1.4, order: 0 },
  { name: "lens-barrel", material: "lens", explode: [0, 0, 0.84], spin: 1.1, order: 1 },
  { name: "hdmi-socket", material: "rubber", explode: [0, 0, -0.42], order: 2 },
  { name: "hdmi-port", material: "steel", explode: [0, 0, -0.5], order: 2 },
  ...Array.from({ length: 12 }, (_, i): PartSpec => ({
    name: `gland-${i}`,
    material: [0, 1, 6, 7].includes(i) ? "rubber" : "steel",
    explode: [0, 0, -0.72],
    order: 3,
  })),
];

const MAX_ORDER = 4;

function createMaterials(): Record<MaterialKey, THREE.Material> {
  return {
    // Satin white powder-coat over the 316L shell.
    housing: new THREE.MeshPhysicalMaterial({
      color: "#f3f2ef",
      roughness: 0.42,
      metalness: 0.02,
      clearcoat: 0.55,
      clearcoatRoughness: 0.28,
      sheen: 0.25,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color("#ffffff"),
    }),
    // Red anodised iris badge.
    aperture: new THREE.MeshPhysicalMaterial({
      color: "#d8141f",
      emissive: "#4a0006",
      roughness: 0.3,
      metalness: 0.6,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15,
    }),
    // Dark coated optical glass.
    glass: new THREE.MeshPhysicalMaterial({
      color: "#050608",
      roughness: 0.02,
      metalness: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0,
      transparent: true,
      opacity: 0.5,
      envMapIntensity: 2.4,
      iridescence: 0.6,
      iridescenceIOR: 1.6,
      depthWrite: false,
    }),
    lens: new THREE.MeshStandardMaterial({ color: "#0d0d0f", roughness: 0.32, metalness: 0.75 }),
    steel: new THREE.MeshStandardMaterial({ color: "#cfd1d4", roughness: 0.22, metalness: 1 }),
    rubber: new THREE.MeshStandardMaterial({ color: "#151517", roughness: 0.7, metalness: 0.05 }),
  };
}

/** Collapse one glTF node's many same-material primitives into a single draw call. */
function mergeNode(node: THREE.Object3D): THREE.BufferGeometry | null {
  const meshes: THREE.Mesh[] = [];
  node.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });
  if (!meshes.length) return null;

  const first = meshes[0].geometry;
  const sharesVertices = meshes.every(
    (m) => m.geometry.attributes.position === first.attributes.position && m.geometry.index,
  );

  let merged: THREE.BufferGeometry;
  if (sharesVertices) {
    // The exporter wrote one vertex buffer per node and an index list per
    // primitive — concatenating the indices keeps vertices shared.
    const total = meshes.reduce((n, m) => n + m.geometry.index!.count, 0);
    const index = new Uint32Array(total);
    let offset = 0;
    for (const m of meshes) {
      index.set(m.geometry.index!.array as ArrayLike<number>, offset);
      offset += m.geometry.index!.count;
    }
    merged = new THREE.BufferGeometry();
    merged.setAttribute("position", first.attributes.position.clone());
    if (first.attributes.normal) merged.setAttribute("normal", first.attributes.normal.clone());
    merged.setIndex(new THREE.BufferAttribute(index, 1));
  } else {
    merged = mergeGeometries(meshes.map((m) => m.geometry.clone()), false)!;
  }

  merged.applyMatrix4(meshes[0].matrixWorld);
  return merged;
}

type Part = PartSpec & {
  geometry: THREE.BufferGeometry;
  /** Assembled position (centre of the part in normalised model space). */
  home: THREE.Vector3;
};

function useCameraParts(): Part[] {
  const { scene } = useGLTF(MODEL_URL);

  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);

    let assembly: THREE.Object3D | undefined;
    scene.traverse((o) => {
      if (!assembly && o.children.length === PARTS.length) assembly = o;
    });
    const nodes = assembly?.children ?? [];

    const geometries = nodes.map(mergeNode);
    const bounds = new THREE.Box3();
    geometries.forEach((g) => {
      if (!g) return;
      g.computeBoundingBox();
      bounds.union(g.boundingBox!);
    });
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const unit = 1 / Math.max(size.x, size.y, size.z);

    return geometries.flatMap((geometry, i) => {
      const spec = PARTS[i];
      if (!geometry || !spec) return [];
      geometry.translate(-center.x, -center.y, -center.z);
      geometry.scale(unit, unit, unit);
      geometry.computeBoundingBox();
      // Pivot each part on its own centre so spins happen around its axis.
      const home = geometry.boundingBox!.getCenter(new THREE.Vector3());
      geometry.translate(-home.x, -home.y, -home.z);
      geometry.computeBoundingSphere();
      return [{ ...spec, geometry, home }];
    });
  }, [scene]);

  useEffect(() => () => parts.forEach((p) => p.geometry.dispose()), [parts]);

  return parts;
}

/** Callout anchors: which part a DOM label is pinned to. */
export const ANCHOR_PARTS: Record<string, string> = {
  glass: "glass",
  lens: "lens-barrel",
  aperture: "aperture",
  bezel: "bezel",
  housing: "body",
  bracket: "bracket",
  rear: "hdmi-socket",
};

const tmp = new THREE.Vector3();
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function CameraModel({ state: stateRef }: { state: React.RefObject<ShowcaseState> }) {
  const parts = useCameraParts();
  const materials = useMemo(() => createMaterials(), []);
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  const rig = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const { viewport, camera, size } = useThree();

  useFrame(() => {
    const state = stateRef.current;
    const group = rig.current;
    if (!group) return;

    const vp = viewport.getCurrentViewport(camera, [0, 0, 0]);
    const fit = Math.min(vp.height * 0.62, vp.width * 0.55);
    group.position.set((state.x * vp.width) / 2, (state.y * vp.height) / 2, 0);
    group.scale.setScalar(fit * state.scale);
    group.rotation.set(state.rotX + state.spinX, state.rotY, state.rotZ);

    // Explode: parts leave in waves, front optics first.
    parts.forEach((part, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const start = (part.order / (MAX_ORDER + 1)) * 0.45;
      const local = easeOut(THREE.MathUtils.clamp((state.explode - start) / (1 - start), 0, 1));
      mesh.position.set(
        part.home.x + part.explode[0] * local,
        part.home.y + part.explode[1] * local,
        part.home.z + part.explode[2] * local,
      );
      mesh.rotation.z = (part.spin ?? 0) * local;
    });

    // Pin the DOM callouts to their 3D anchors.
    group.updateMatrixWorld();
    state.anchors.forEach((el, key) => {
      const idx = parts.findIndex((p) => p.name === ANCHOR_PARTS[key]);
      const mesh = meshes.current[idx];
      if (!mesh) return;
      tmp.set(0, 0, 0);
      mesh.localToWorld(tmp);
      tmp.project(camera);
      const px = ((tmp.x + 1) / 2) * size.width;
      const py = ((1 - tmp.y) / 2) * size.height;
      el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
    });
  });

  return (
    <group ref={rig}>
      {parts.map((part, i) => (
        <mesh
          key={`${part.name}-${i}`}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          geometry={part.geometry}
          material={materials[part.material]}
          position={part.home}
          renderOrder={part.material === "glass" ? 2 : 0}
        />
      ))}
    </group>
  );
}

useGLTF.preload(MODEL_URL);
