import * as THREE from 'three'
import { GUI } from 'dat.gui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { gsap } from 'gsap';
import createVShape from './functions/createVShape.js';
import extractPixelData from './functions/extractPixelData.js';
import shuffleArray from './functions/shuffleArray.js';
import createSpiral from './functions/createSpiral.js';
import displaceRandom from './functions/displaceRandom.js'

const container = document.querySelector('#img_wrapper');
let planeAspect;
let imageWidth = 90;
let imageHeight = 90;
const xOffset = imageWidth / 2;
const yOffset = imageHeight / 2;

const originalAspectRatio = 1.5;
const calculatedHeight = container.clientWidth / originalAspectRatio;
const planeHeight = 2;
const planeWidth = planeHeight * originalAspectRatio;
const numPoints = 90 * 90
const offsets = new Float32Array(numPoints * 3);
const angles = new Float32Array(numPoints);
let scales = new Float32Array(numPoints);
const spheres = [];
const pixelDataLength = imageWidth * imageHeight * 4
let pixelData;

const colors = new Float32Array(numPoints * 4);

for (let i = 0; i < numPoints; i++) {
  colors[i * 3 + 0] = 0.5;
  colors[i * 3 + 1] = 0.5;
  colors[i * 3 + 2] = 0.5;
  colors[i * 3 + 3] = 1;
}

const images = [
  '/img/giacomo2-neutral-modified.jpg',
  '/img/lo-90-bw.jpg'
]

function updateInstanceColor(index, newColor) {
  colors[index * 3 + 0] = newColor.r; // Red
  colors[index * 3 + 1] = newColor.g; // Green
  colors[index * 3 + 2] = newColor.b; // Blue
  
  mesh.geometry.attributes.instanceColor.needsUpdate = true;
}

function rgbaToGrayscale(r, g, b, a) {
  const grayscale = 0.299 * r + 0.587 * g + 0.114 * b;

  return { r: grayscale, g: grayscale, b: grayscale, a: a };
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.01 }
  },
  vertexShader: `
    attribute vec3 offset;
    attribute float scale;
    attribute vec3 instanceColor;
    varying vec3 vColor;
    uniform float uTime;

    float random(vec2 uv) {
      return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float randomInRange(vec2 uv) {
        return random(uv) * 2.0 - 1.0;
    }

    void main() {
      vColor = instanceColor;
      vec3 pos = position;
      vec3 newPos = (position * scale + offset);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
  `,
  vertexColors: true,
});

const geometry = new THREE.SphereGeometry(0.25, 4, 4);
const bufferGeometry = new THREE.InstancedBufferGeometry().copy(geometry);

// Fill attributes with initial values
for (let i = 0; i < numPoints; i++) {
  const x = (i % imageWidth);
  const y = Math.floor(i / imageWidth);

  offsets[i * 3 + 0] = x - xOffset;
  offsets[i * 3 + 1] = yOffset - y;
  offsets[i * 3 + 2] = 0;

  scales[i] = (Math.random() + 0.5) * 1.2;
  angles[i] = Math.random() * Math.PI;
}

bufferGeometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false));
bufferGeometry.setAttribute('scale', new THREE.InstancedBufferAttribute(scales, 1, false));
bufferGeometry.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false));
bufferGeometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));

const mesh = new THREE.InstancedMesh(bufferGeometry, material, numPoints);

mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));
mesh.instanceMatrix.needsUpdate = true;
mesh.geometry.attributes.instanceColor.needsUpdate = true;

scene.add(mesh);

let isFirstLoad = true

let newScales = scales
const indices = Array.from({ length: numPoints }, (_, i) => i); // Create an array of indices
  
shuffleArray(indices);

for (let i = 0; i < numPoints; i++) {
  const initialScale = scales[i];
  const idx = indices[i];
  
  // Animate each instance's scale using GSAP
  gsap.to(scales, {
    [idx]: Math.random() * 1.15 + 0.5,
    duration: 2,
    ease: 'power2.inOut',
    onUpdate: () => {
      mesh.geometry.attributes.scale.array[idx] = newScales[idx];
      mesh.geometry.attributes.scale.needsUpdate = true;
    },
    delay: i * 0.001,
    yoyo: true,
    repeat: -1,
  });
}

// displaceRandom(numPoints, offsets, mesh, imageWidth, imageHeight)

// createVShape(numPoints, offsets, mesh)
//createSpiral(numPoints, offsets, scales, mesh)

function setAttributesFromImage(image, isFirstLoad) {
  const texture = new THREE.TextureLoader().load(image, (texture) => {
    pixelData = extractPixelData(texture.image)
    let newColors = new Float32Array(numPoints * 4);

    for (let i = 0; i < pixelData.length; i +=4) {
      const red = pixelData[i] / 255;
      const green = pixelData[i+1] / 255;
      const blue = pixelData[i+2] / 255;
      const alpha = pixelData[i+3] / 255;
      // const { r, g, b, a } = rgbaToGrayscale(red, green, blue, alpha);

      newColors[i + 0] = red;
      newColors[i + 1] = green;
      newColors[i + 2] = blue;
      newColors[i + 3] = alpha;
    }

    for (let i = 0; i < numPoints; i++) {
      const r = newColors[i * 4 + 0]; // Red
      const g = newColors[i * 4 + 1]; // Green
      const b = newColors[i * 4 + 2]; // Blue
      const a = 0.5;

      gsap.to(newColors, {
        [i * 4 + 0]: r, // Animate red channel
        [i * 4 + 1]: g, // Animate green channel
        [i * 4 + 2]: b,
        [i * 4 + 3]: a,
        duration: 12, // Duration of animation
        ease: 'power2.inOut',
        onUpdate: () => {
          // Update the geometry color attributes during animation
          mesh.geometry.attributes.instanceColor.array[i * 4 + 0] = newColors[i * 4 + 0]; // Update red channel
          mesh.geometry.attributes.instanceColor.array[i * 4 + 1] = newColors[i * 4 + 1]; // Update green channel
          mesh.geometry.attributes.instanceColor.array[i * 4 + 2] = newColors[i * 4 + 2]; // Update blue channel
          mesh.geometry.attributes.instanceColor.array[i * 4 + 3] = 0.5; // Update blue channel
          mesh.geometry.attributes.instanceColor.needsUpdate = true;
        }
      });
    }

    console.log(mesh.geometry.attributes.instanceColor)
    
    // mesh.geometry.setAttribute('scale', new THREE.InstancedBufferAttribute(newScales, 1));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.geometry.attributes.scale.needsUpdate = true;

    isFirstLoad = false;

    // mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(newColors, 4));

  });
}

let count = 0

document.querySelector('#controls button').onclick = function() {
  setAttributesFromImage(images[count])
  isFirstLoad = false;

  count++
}

// Light
const ambientLight = new THREE.AmbientLight(0x404040, 15);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 5);
pointLight.position.set(5, 5, 5);

//scene.add(pointLight);

console.log(scene)

// Set camera position
camera.position.z = 80;

// Handle window resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Render loop
function animate() {
  requestAnimationFrame(animate);

  material.uniforms.uTime.value += 0.001

  controls.update();  // Only required if controls.enableDamping is set to true

  renderer.render(scene, camera);
}

animate();