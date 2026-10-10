"use client";

import { useEffect, useMemo, type Ref } from "react";
import { MeshStandardMaterial, Vector3, type Mesh } from "three";
import { BALL } from "./layout";

/**
 * Panel centres of a truncated icosahedron: the 12 icosahedron vertices
 * (black pentagons) and the 20 face centres (white hexagons).
 */
function panelCentres(): { pentagons: Vector3[]; hexagons: Vector3[] } {
  const phi = (1 + Math.sqrt(5)) / 2;
  const verts = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ].map(([x, y, z]) => new Vector3(x, y, z).normalize());
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  const hexagons = faces.map(([a, b, c]) =>
    new Vector3().add(verts[a]).add(verts[b]).add(verts[c]).normalize(),
  );
  return { pentagons: verts, hexagons };
}

/**
 * Football material: MeshStandardMaterial with the panel pattern computed per
 * fragment in object space, so seams stay sharp at any distance with no texture.
 */
function createBallMaterial(): MeshStandardMaterial {
  const { pentagons, hexagons } = panelCentres();
  const material = new MeshStandardMaterial({ roughness: 0.45, metalness: 0 });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPentagons = { value: pentagons };
    shader.uniforms.uHexagons = { value: hexagons };

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjectNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjectNormal = normalize(position);");

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vObjectNormal;
        uniform vec3 uPentagons[12];
        uniform vec3 uHexagons[20];`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          vec3 n = normalize(vObjectNormal);
          // Pentagons are smaller than hexagons on a real ball; weight their distance up.
          float best = 1e9; float second = 1e9; float bestIsPent = 0.0;
          for (int i = 0; i < 12; i++) {
            float d = acos(clamp(dot(n, uPentagons[i]), -1.0, 1.0)) * 1.12;
            if (d < best) { second = best; best = d; bestIsPent = 1.0; } else if (d < second) { second = d; }
          }
          for (int i = 0; i < 20; i++) {
            float d = acos(clamp(dot(n, uHexagons[i]), -1.0, 1.0));
            if (d < best) { second = best; best = d; bestIsPent = 0.0; } else if (d < second) { second = d; }
          }
          vec3 panel = mix(vec3(0.94, 0.95, 0.94), vec3(0.05, 0.06, 0.07), bestIsPent);
          float seam = 1.0 - smoothstep(0.0, 0.022, second - best);
          diffuseColor.rgb = mix(panel, vec3(0.22, 0.24, 0.25), seam * 0.85);
        }`,
      );
  };
  return material;
}

export function Ball({ ref }: { ref?: Ref<Mesh> }) {
  const material = useMemo(() => createBallMaterial(), []);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh ref={ref} position={[0, BALL.radius, 0]} castShadow material={material}>
      <icosahedronGeometry args={[BALL.radius, 12]} />
    </mesh>
  );
}
