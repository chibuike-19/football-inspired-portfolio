"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Raycaster, Vector2, type Object3D } from "three";

const raycaster = new Raycaster();
const pointer = new Vector2();

/** Walks up from a hit mesh to the structure tagged with `userData.landmarkId`. */
function landmarkOf(object: Object3D | null): string | null {
  for (let node = object; node; node = node.parent) {
    if (typeof node.userData.landmarkId === "string") return node.userData.landmarkId;
  }
  return null;
}

export type TapPicker = (clientX: number, clientY: number) => string | null;

/** Exposes a raycast picker to the DOM layer (the joystick lives outside the canvas). */
export function TapBridge({ register }: { register: (picker: TapPicker | null) => void }) {
  const get = useThree((s) => s.get);
  useEffect(() => {
    register((clientX, clientY) => {
      const { camera, scene, gl } = get();
      const rect = gl.domElement.getBoundingClientRect();
      pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      for (const hit of raycaster.intersectObjects(scene.children, true)) {
        const id = landmarkOf(hit.object);
        if (id) return id;
        // The first opaque thing in the way wins; keep going only through transparent nets/markers.
        const material = (hit.object as Object3D & { material?: { transparent?: boolean } }).material;
        if (!material?.transparent) return null;
      }
      return null;
    });
    return () => register(null);
  }, [get, register]);
  return null;
}
