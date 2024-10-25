export default function setAttributesFromImage(image, isFirstLoad = false, mesh) {
  const texture = new THREE.TextureLoader().load(image, (texture) => {
    pixelData = extractPixelData(texture.image);

    let newColors = new Float32Array(numPoints * 3);
    let oldColors = new Float32Array(mesh.geometry.attributes.instanceColor.array);

    let tl = gsap.timeline({
      paused: true,
    })

    for (let i = 0, j = 0; i < pixelData.length; i += 4, j += 3) {
      const red = pixelData[i] / 255;
      const green = pixelData[i + 1] / 255;
      const blue = pixelData[i + 2] / 255;
    
      newColors[j] = red;      // Red at index j
      newColors[j + 1] = green; // Green at index j + 1
      newColors[j + 2] = blue;  // Blue at index j + 2
    }

    for (let i = 0; i < numPoints; i++) {
      const r = newColors[i * 3 + 0];
      const g = newColors[i * 3 + 1];
      const b = newColors[i * 3 + 2];

      gsap.to(oldColors, {
        [i * 3]: r,
        [i * 3 + 1]: g,
        [i * 3 + 2]: b,
        duration: 0.2,
        ease: "elastic.inOut(1.5, 0.5)",
        delay: i * 0.0002,
        onUpdate: function() {
          mesh.geometry.attributes.instanceColor.array[i * 3 + 0] = r;
          mesh.geometry.attributes.instanceColor.array[i * 3 + 1] = g;
          mesh.geometry.attributes.instanceColor.array[i * 3 + 2] = b;
          mesh.geometry.attributes.instanceColor.needsUpdate = true;
        },
        onComplete: function() {
          //console.log(mesh.geometry.attributes.instanceColor.array[1 * 3 + 0], mesh.geometry.attributes.instanceColor.array[1 * 3 + 1], mesh.geometry.attributes.instanceColor.array[1 * 3 + 2])
          //console.log(mesh.geometry.attributes.instanceColor.array)
        }
      });
    }

    // mesh.geometry.setAttribute('scale', new THREE.InstancedBufferAttribute(newScales, 1));
    // mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(newColors, 4));
    mesh.instanceMatrix.needsUpdate = true;
    // mesh.geometry.attributes.instanceColor.needsUpdate = true;
    mesh.geometry.attributes.scale.needsUpdate = true;

    isFirstLoad = false;
  });
}