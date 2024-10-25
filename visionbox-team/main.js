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
const indices = new Uint16Array(numPoints)
const offsets = new Float32Array(numPoints * 3);
const angles = new Float32Array(numPoints);
let scales = new Float32Array(numPoints);
const spheres = [];
const pixelDataLength = imageWidth * imageHeight * 4
let pixelData;

const colors = new Float32Array(numPoints * 3);

let randomDisplacement = new Float32Array(numPoints);

const A_x = 50;  // Amplitude in x direction
const A_y = 50;  // Amplitude in y direction
const A_z = 50;  // Amplitude in z direction

const frequencyX = 3;  // Frequency for x-axis
const frequencyY = 2;  // Frequency for y-axis
const frequencyZ = 4;  // Frequency for z-axis

const phaseX = 0;  // Phase shift for x-axis
const phaseY = Math.PI / 2;  // Phase shift for y-axis
const phaseZ = Math.PI / 4;  // Phase shift for z-axis

let t = 0;  // Time parameter for the Lissajous curves


for (let i = 0; i < numPoints; i++) {
  colors[i * 3 + 0] = 0.5;
  colors[i * 3 + 1] = 0.5;
  colors[i * 3 + 2] = 0.5;

  indices[i] = i;
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

function loopScale() {
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
}

function loopOffset() {
  let tl = gsap.timeline({
    paused: true,
    repeat: -1,
  })
  for (let i = 0; i < numPoints; i++) {
    const initialOffset = offsets[i];
    const idx = indices[i];
    const random = (Math.sin(Math.random()) - 0.5);
    
    tl.to(offsets, {
      [i * 3]: offsets[i * 3],
      [i * 3 + 1]: `+=${random}`,
      [i * 3 + 2]: offsets[i * 3 + 2],
      duration: 3,
      ease: 'power2.inOut',
      onUpdate: () => {
        mesh.geometry.attributes.offset.array[i] = offsets[i];
        mesh.geometry.attributes.offset.needsUpdate = true;
      },
      // delay: i * 0.001,
      //yoyo: true,
    });
  }
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.01 },
    uRandom: { value: 1.0 },
  },
  vertexShader: `
    attribute vec3 offset;
    attribute vec3 instanceColor;
    attribute float scale;
    attribute float indices;
    attribute float randomDisplacement;
    varying vec3 vColor;
    uniform float uTime;

    void main() {
      vColor = instanceColor;
      vec3 pos = position;

      vec3 newPos = (position * scale + offset) + (sin(uTime * randomDisplacement * 3.0) - 0.5);

      // float colorBasedDisplacement = (vColor.r + vColor.g + vColor.b) - 0.5;

      //newPos = vec3(newPos.x + colorBasedDisplacement, newPos.y + colorBasedDisplacement, newPos.y + colorBasedDisplacement);

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

  scales[i] = Math.random() * 1.1 + 1;
  angles[i] = Math.random() * Math.PI;
}

for (let i = 0; i < (numPoints); i++) {
  randomDisplacement[i] = Math.random();
}

bufferGeometry.setAttribute('indices', new THREE.InstancedBufferAttribute(indices, 1, false));
bufferGeometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false));
bufferGeometry.setAttribute('scale', new THREE.InstancedBufferAttribute(scales, 1, false));
bufferGeometry.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false));
bufferGeometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));
bufferGeometry.setAttribute('randomDisplacement', new THREE.InstancedBufferAttribute(randomDisplacement, 1));

const mesh = new THREE.InstancedMesh(bufferGeometry, material, numPoints);

mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));
mesh.instanceMatrix.needsUpdate = true;
mesh.geometry.attributes.instanceColor.needsUpdate = true;

scene.add(mesh);

let isFirstLoad = true
  
// shuffleArray(indices);

// displaceRandom(numPoints, offsets, mesh, imageWidth, imageHeight)
// createVShape(numPoints, offsets, mesh)
// createSpiral(numPoints, offsets, scales, mesh)
// loopOffset()

// displaceRandom(numPoints, offsets, mesh, imageWidth, imageHeight)

function setAttributesFromImage(image, isFirstLoad = false) {
  const texture = new THREE.TextureLoader().load(image, (texture) => {
    pixelData = extractPixelData(texture.image);

    let newColors = new Float32Array(numPoints * 3);
    let oldColors = new Float32Array(mesh.geometry.attributes.instanceColor.array);

    let newScales = new Float32Array(numPoints)

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

      const brightness = (red + green + blue) / 3;

      const minScale = 1.5;
      const maxScale = 3;
      const colorBasedScale = minScale + brightness * (maxScale - minScale)

      newScales[j / 3] = colorBasedScale;
    }

    mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(newColors, 3));
    mesh.geometry.setAttribute('scale', new THREE.InstancedBufferAttribute(newScales, 1));
    mesh.geometry.attributes.instanceColor.needsUpdate = true;
    mesh.geometry.attributes.scale.needsUpdate = true;
    // mesh.geometry.setAttribute('scale', new THREE.InstancedBufferAttribute(newScales, 1));
    // mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(newColors, 4));
    // mesh.instanceMatrix.needsUpdate = true;
    // mesh.geometry.attributes.instanceColor.needsUpdate = true;
    mesh.geometry.attributes.scale.needsUpdate = true;

    isFirstLoad = false;
  });
}

displaceRandom(numPoints, offsets, mesh, imageWidth, imageHeight);

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