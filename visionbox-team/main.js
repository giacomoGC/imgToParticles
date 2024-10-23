import * as THREE from 'three'
import { GUI } from 'dat.gui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { gsap } from 'gsap';
import * as perlin from 'perlin-noise';

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

const colors = new Float32Array(numPoints * 3);

for (let i = 0; i < numPoints; i++) {
  colors[i * 3 + 0] = 0.5;
  colors[i * 3 + 1] = 0.5;
  colors[i * 3 + 2] = 0.5;
}

const images = [
  '/img/giacomo2-neutral-modified.jpg',
  '/img/lo-90-bw.jpg'
]

function extractPixelData(image) {
  // Create an off-screen canvas to extract pixel data
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d');
  // Draw the image onto the canvas
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  // Get pixel data
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data; // This is a flat array containing the RGBA values of each pixel
  
  return data;
}

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
        return fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vColor = instanceColor;
      vec3 pos = (position * scale + offset) + (sin(uTime) * 5.0 * random(uv));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
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

  scales[i] = (Math.random() + 0.1) * 1.5;
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
const noise = perlin.generatePerlinNoise(imageWidth, imageHeight)

let targetPosition;
const vTopLeft = new THREE.Vector3(-44, 44, 0);
const vTopRight = new THREE.Vector3(44, 44, 0);
const vBottom = new THREE.Vector3(0, -44, 0);

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

function createVShape() {
  let newOffsets = []

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

createVShape()

function setAttributesFromImage(image, isFirstLoad) {
  const texture = new THREE.TextureLoader().load(image, (texture) => {
    pixelData = extractPixelData(texture.image)
    let newColors = new Float32Array(numPoints * 3);

    for (let i = 0; i < pixelData.length; i +=4) {
      const red = pixelData[i] / 255;
      const green = pixelData[i+1] / 255;
      const blue = pixelData[i+2] / 255;
      // const { r, g, b, a } = rgbaToGrayscale(red, green, blue, alpha);

      newColors[i + 0] = red;
      newColors[i + 1] = green;
      newColors[i + 2] = blue;
      newColors[i + 3] = 1;
    }

    for (let i = 0; i < numPoints; i++) {
      const initialScale = scales[i];
      
      // Animate each instance's scale using GSAP
      gsap.to(scales, {
        [i]: Math.random() * 1.15 + 0.5,
        duration: 1,
        ease: 'power2.inOut',
        onUpdate: () => {
          mesh.geometry.attributes.scale.array[i] = scales[i];
          mesh.geometry.attributes.scale.needsUpdate = true;
        },
        delay: i * 0.001
      });
    }

    console.log(scales)
    
    mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(newColors, 4));
    // mesh.geometry.setAttribute('scale', new THREE.InstancedBufferAttribute(newScales, 1));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.geometry.attributes.instanceColor.needsUpdate = true;
    mesh.geometry.attributes.scale.needsUpdate = true;

    isFirstLoad = false;
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
camera.position.z = 100;

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