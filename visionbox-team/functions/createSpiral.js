import * as THREE from 'three';
import shuffleArray from './shuffleArray.js';
import { gsap } from 'gsap';

export default function createSpiral(numPoints, offsets, scales, mesh) {
  const a = 0.3; // Controls the starting radius of the spiral
  const b = 1; // Controls how tightly the spiral winds
  const zFactor = 3; // Controls the Z displacement factor (how far the points spread in the Z direction)
  let newOffsets = []
  let newScales = []

  const indices = Array.from({ length: numPoints }, (_, i) => i); // Create an array of indices
  
  shuffleArray(indices);

  for (let i = 0; i < numPoints; i++) {
    const idx = indices[i];
    const t = i / (numPoints - 1); // Normalized value between 0 and 1
    const theta = t * Math.PI * 10; // Controls the number of spiral loops

    const r = a + b * theta; // Spiral radius grows with theta
    const x = r * Math.cos(theta); // X position using polar coordinates
    const y = r * Math.sin(theta); // Y position using polar coordinates
    const z = zFactor * theta; // Z position grows with theta to form a 3D spiral

    // Set the offsets for each point (X, Y, Z)
    newOffsets[i * 3] = x;    // X position
    newOffsets[i * 3 + 1] = y;  // Y position
    newOffsets[i * 3 + 2] = z;  // Z position for 3D displacement

    newScales[i] = Math.random() * 0.5 + 0.5; // Randomize scale a bit for variation

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

    gsap.to(scales, {
      [idx]: newScales[i],
      duration: 2,
      ease: 'power2.inOut',
      onUpdate: () => {
        mesh.geometry.attributes.scale.array[i] = scales[i];
        mesh.geometry.attributes.scale.needsUpdate = true;
      },
      // delay: i * 0.0001
    });
  }

  // Mark the geometry as needing an update
  mesh.geometry.attributes.offset.needsUpdate = true;
  mesh.geometry.attributes.scale.needsUpdate = true;
}