import * as THREE from 'three';
import shuffleArray from './shuffleArray.js';
import * as perlin from 'perlin-noise';
import { gsap } from 'gsap';

export default function displaceRandom(numPoints, offsets, mesh, imageWidth, imageHeight) {
  let newOffsets = []
  let targetPosition;
  const intensity = 5

  const noise = perlin.generatePerlinNoise(imageWidth, imageHeight)

  // We'll animate points in random order!
  const indices = Array.from({ length: numPoints }, (_, i) => i); // Create an array of indices
  
  shuffleArray(indices);
  
  for (let i = 0; i < numPoints; i++) {
    let t = i / (numPoints - 1); // Normalized parameter
    const idx = indices[i];
    const initialOffsetX = offsets[idx * 3]; // Save original offsets
    const initialOffsetY = offsets[idx * 3 + 1];
  
    gsap.to(offsets, {
      [idx * 3]: offsets[idx * 3] + noise[idx] * intensity * (Math.random() - 0.5),
      [idx * 3 + 1]: offsets[idx * 3 + 1] + noise[idx + 1] * intensity * (Math.random() - 0.5),
      [idx * 3 + 2]: offsets[idx * 3 + 2] + noise[idx + 2] * intensity * (Math.random() - 0.5),
      ease: "power2.inOut",
      onUpdate: () => {
        mesh.geometry.attributes.offset.array[idx * 3] = offsets[idx * 3];
        mesh.geometry.attributes.offset.array[idx * 3 + 1] = offsets[idx * 3 + 1];
        mesh.geometry.attributes.offset.array[idx * 3 + 2] = offsets[idx * 3 + 2];
        mesh.geometry.attributes.offset.needsUpdate = true;
      },
      delay: i * 0.00001
    });
  }
}