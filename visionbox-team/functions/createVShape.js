import * as THREE from 'three';
import shuffleArray from './shuffleArray.js';
import { gsap } from 'gsap';

export default function createVShape(numPoints, offsets, mesh) {
  let newOffsets = []
  let targetPosition;
  const vTopLeft = new THREE.Vector3(-44, 44, 0);
  const vTopRight = new THREE.Vector3(44, 44, 0);
  const vBottom = new THREE.Vector3(0, -44, 0);

  // We'll animate points in random order!
  const indices = Array.from({ length: numPoints }, (_, i) => i); // Create an array of indices
  
  shuffleArray(indices);
  
  for (let i = 0; i < numPoints; i++) {
    let t = i / (numPoints - 1);  // Normalized parameter
    const idx = indices[i];
    const initialOffsetX = offsets[idx * 3]; // Save original offsets
    const initialOffsetY = offsets[idx * 3 + 1];

    // Interpolate positions
    if (t < 0.5) {
      // Left side of the V
      const alpha = t * 2;  // Scale to 0 to 1

      if (i % 15 === 0) {
        newOffsets[i * 3] = THREE.MathUtils.lerp(vTopLeft.x, vBottom.x, alpha);
      } else {
        newOffsets[i * 3] = THREE.MathUtils.lerp(vTopLeft.x, vBottom.x, alpha) - Math.random() * 14;
      }
      newOffsets[i * 3 + 1] = THREE.MathUtils.lerp(vTopLeft.y, vBottom.y, alpha);
    } else {
      // Right side of the V
      const alpha = (t - 0.5) * 2; // Scale to 0 to 1

      if (i % 15 === 0) {
        newOffsets[i * 3] = THREE.MathUtils.lerp(vTopRight.x, vBottom.x, alpha) - 1;
      } else {
        newOffsets[i * 3] = THREE.MathUtils.lerp(vTopRight.x, vBottom.x, alpha) - Math.random() * 3 - 1;
      }
      newOffsets[i * 3 + 1] = THREE.MathUtils.lerp(vTopRight.y, vBottom.y, alpha);
    }

    newOffsets[i * 3 + 2] = 0;
    newOffsets[i * 4 + 2] = 0;
    newOffsets[i * 5 + 2] = 0;

    gsap.to(offsets, {
      [idx * 3]: newOffsets[i * 3],
      [idx * 3 + 1]: newOffsets[i * 3 + 1],
      [idx * 3 + 2]: newOffsets[i * 3 + 2],
      duration: 2,
      ease: 'power2.inOut',
      onUpdate: () => {
        mesh.geometry.attributes.offset.array[i * 3] = offsets[i * 3];
        mesh.geometry.attributes.offset.array[i * 3 + 1] = offsets[i * 3 + 1];
        mesh.geometry.attributes.offset.array[i * 3 + 2] = offsets[i * 3 + 2];
        mesh.geometry.attributes.offset.needsUpdate = true;
      },
      // delay: i * 0.0001
    });
  }
}