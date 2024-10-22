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
const scales = new Float32Array(numPoints);
const spheres = [];
const pixelDataLength = imageWidth * imageHeight * 4
let pixelData;

const colors = new Float32Array(numPoints * 3);

for (let i = 0; i < numPoints; i++) {
  colors[i * 3 + 0] = 1;
  colors[i * 3 + 1] = 0.2;
  colors[i * 3 + 2] = 1;
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

const material = new THREE.MeshBasicMaterial({
  color: `rgb(255, 255, 255)`,
  transparent: false,
  // vertexColors: true,
  //opacity: alpha / 255,
  wireframe: false,
});

const geometry = new THREE.SphereGeometry(0.25, 4, 4);

const bufferGeometry = new THREE.InstancedBufferGeometry().copy(geometry);

// Fill attributes with initial values
for (let i = 0; i < numPoints; i++) {
  const x = (i % imageWidth);
  const y = Math.floor(i / imageWidth);

  offsets[i * 3 + 0] = x - xOffset;   // X position
  offsets[i * 3 + 1] = yOffset - y;   // Y position
  offsets[i * 3 + 2] = 0;       // Z position

  scales[i] = 1;  // Initial scale for each sphere
  angles[i] = Math.random() * Math.PI;  // Random angle for rotation
}

bufferGeometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false));
bufferGeometry.setAttribute('scale', new THREE.InstancedBufferAttribute(scales, 1, false));
bufferGeometry.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false));

const noise = perlin.generatePerlinNoise(imageWidth, imageHeight)

const mesh = new THREE.InstancedMesh(bufferGeometry, material, numPoints);

// mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));

// mesh.geometry.attributes.instanceColor.needsUpdate = true;

scene.add(mesh);

const dummy = new THREE.Object3D();  // A helper object to set positions

for (let i = 0; i < numPoints; i++) {
  dummy.position.set(
    offsets[i * 3],     // X position
    offsets[i * 3 + 1], // Y position
    offsets[i * 3 + 2]  // Z position
  );

  // updateInstanceColor(i, newColor)

  dummy.updateMatrix();

  mesh.setMatrixAt(i, dummy.matrix);

  // spheres[i].material.color.set(`rgb(${red}, ${green}, ${blue})`)
}

// Make sure the instance matrix updates
// mesh.instanceMatrix.needsUpdate = true;

let isFirstLoad = true

function setAttributesFromImage(image, isFirstLoad) {
  const texture = new THREE.TextureLoader().load(image, (texture) => {
    pixelData = extractPixelData(texture.image)

    for (let i = 0; i < pixelDataLength; i += 4) {
      const red = pixelData[i];     // Red channel
      const green = pixelData[i+1]; // Green channel
      const blue = pixelData[i+2];  // Blue channel
      const alpha = pixelData[i+3]; // Alpha channel (opacity)
      // const { r, g, b, a } = rgbaToGrayscale(red, green, blue, alpha);
  
      const pixelIndex = i / 4;
      const x = pixelIndex % imageWidth;
      const y = Math.floor(pixelIndex / imageWidth);

      const randomX = noise[i];
      const randomY = noise[i + 1];

      let tl = gsap.timeline({
      
      })
      
      if(spheres[i / 4]) {
        if(!isFirstLoad) {
          // tl.to(spheres[i / 4].position, {
          //   x: randomX - xOffset,
          //   y: yOffset - randomY,
          //   z: 0,
          //   duration: 5,
          //   ease: 'power2.inOut',
          //   delay: i * 0.0001,
          // })
        }
        gsap.to(spheres[i / 4].position, {
          x: x - xOffset,
          y: yOffset - y,
          z: 0,
          duration: 5,
          ease: 'power2.inOut',
          delay: i * 0.0001,
        })

        // spheres[i / 4].position.set(x - xOffset, yOffset - y, 0);

        if(spheres[i / 4].material) {
          spheres[i / 4].material.color.set(`rgb(${red}, ${green}, ${blue})`)
          console.log(red)
        }
      }
    }
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
camera.position.z = 150;

// Handle window resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Render loop
function animate() {
  requestAnimationFrame(animate);

  // mesh.geometry.attributes.instanceColor.needsUpdate = true;

  controls.update();  // Only required if controls.enableDamping is set to true

  renderer.render(scene, camera);
}

animate();