import * as THREE from 'three'
import { GUI } from 'dat.gui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { gsap } from 'gsap';
import createVShape from './functions/createVShape.js';
import extractPixelData from './functions/extractPixelData.js';
import shuffleArray from './functions/shuffleArray.js';
import createSpiral from './functions/createSpiral.js';
import displaceRandom from './functions/displaceRandom.js'
import { createNoise2D } from 'simplex-noise';

const container = document.querySelector('#img_wrapper');
let planeAspect;
let imageWidth = 150;
let imageHeight = 150;
const xOffset = imageWidth / 2;
const yOffset = imageHeight / 2;

const originalAspectRatio = 1.5;
const calculatedHeight = container.clientWidth / originalAspectRatio;
const planeHeight = 2;
const planeWidth = planeHeight * originalAspectRatio;
const numPoints = imageWidth * imageHeight
const indices = new Uint16Array(numPoints)
const offsets = new Float32Array(numPoints * 3);
const angles = new Float32Array(numPoints);
let scales = new Float32Array(numPoints);
const spheres = [];
const pixelDataLength = imageWidth * imageHeight * 4
let pixelData;

const colors = new Float32Array(numPoints * 3);

let randomDisplacement = new Float32Array(numPoints);

let t = 0;  // Time parameter for the Lissajous curves

for (let i = 0; i < numPoints; i++) {
  const random = Math.random()

  colors[i * 3 + 0] = random;
  colors[i * 3 + 1] = random;
  colors[i * 3 + 2] = random;

  indices[i] = i;
}

// Fill attributes with initial values
for (let i = 0; i < numPoints; i++) {
  const x = (i % imageWidth);
  const y = Math.floor(i / imageWidth);

  offsets[i * 3 + 0] = x - xOffset;
  offsets[i * 3 + 1] = yOffset - y;
  offsets[i * 3 + 2] = 0;

  scales[i] = 1;
  angles[i] = Math.random() * Math.PI;
}

for (let i = 0; i < (numPoints); i++) {
  randomDisplacement[i] = (Math.random() - 0.5) / 5;
}

const images = [
  '/img/giacomo2-neutral.jpg',
  '/img/bru-150.jpg'
]

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

function turnOnRandomPixels() {
  let newColors = new Float32Array(numPoints * 3);

  for (let i = 0; i < 100; i++) {
      const randomIdx = Math.floor(Math.random() * numPoints);

      newColors[randomIdx] = 1;
      newColors[randomIdx + 1] = 1;
      newColors[randomIdx + 2] = 1;

      gsap.to(colors, {
        [randomIdx * 3]: newColors[i * 3],
        [randomIdx* 3 + 1]: newColors[i * 3 + 1],
        [randomIdx * 3 + 2]: newColors[i * 3 + 2],
        duration: 1,
        ease: 'elastic.inOut(1.5, 0.5)',
        onUpdate: () => {
          mesh.geometry.attributes.instanceColor.array[i * 3] = colors[i * 3];
          mesh.geometry.attributes.instanceColor.array[i * 3 + 1] = colors[i * 3 + 1];
          mesh.geometry.attributes.instanceColor.array[i * 3 + 2] = colors[i * 3 + 2];
          mesh.geometry.attributes.instanceColor.needsUpdate = true;
        },
        delay: i * 0.01,
        repeat: -1,
        yoyo: true,
    })
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
    uRandom: { value: 0.2 },
    uNoiseFrequency: { value: 0.2 },
    uNoiseAmplitude: { value: 0 },
  },
  vertexShader: `
    attribute vec3 offset;
    attribute vec3 instanceColor;
    attribute float scale;
    attribute float indices;
    attribute float randomDisplacement;
    varying vec3 vColor;
    uniform float uTime;
    uniform float uNoiseFrequency;
    uniform float uNoiseAmplitude;

    vec4 permute(vec4 x) {
      return mod(((x*34.0)+1.0)*x, 289.0);
    }

    float snoise(vec3 v) { 
      const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;

      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      //   x0 = x0 - 0. + 0.0 * C 
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy; 
      vec3 x3 = x0 - D.yyy;     

      // Permutations
      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( 
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

      // Gradients: 7x7 points over a square, mapped onto an octahedron.
      float n_ = 1.0/7.0; // N=7
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  // mod(p,N)

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

      // Normalise gradients
      vec4 norm = 1.79284291400159 - 0.85373472095314 * 
        vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), 
        dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
        dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vColor = instanceColor;
      vec3 pos = position * scale + offset;

      // Generate separate noise values for x, y, and z displacements
      float displacementX = snoise((pos) * uNoiseFrequency + vec3(uTime, 0.0, 0.0)) * uNoiseAmplitude;
      float displacementY = snoise((pos) * uNoiseFrequency + vec3(0.0, uTime, 0.0)) * uNoiseAmplitude;
      float displacementZ = snoise((pos) * uNoiseFrequency + vec3(0.0, 0.0, uTime)) * uNoiseAmplitude;

      // Combine displacements into a vec3
      vec3 displacement = vec3(displacementX, displacementY, displacementZ);

      // Calculate the new position
      vec3 newPos = pos + displacement;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    uniform float uTime;

    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
  `,
  vertexColors: true,
});

const geometry = new THREE.SphereGeometry(0.25, 10, 10);
const bufferGeometry = new THREE.InstancedBufferGeometry().copy(geometry);

bufferGeometry.setAttribute('indices', new THREE.InstancedBufferAttribute(indices, 1, false));
bufferGeometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false));
bufferGeometry.setAttribute('scale', new THREE.InstancedBufferAttribute(scales, 1, false));
bufferGeometry.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false));
bufferGeometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));

const mesh = new THREE.InstancedMesh(bufferGeometry, material, numPoints);

mesh.instanceMatrix.needsUpdate = true;
mesh.geometry.attributes.instanceColor.needsUpdate = true;

scene.add(mesh);

let isFirstLoad = true
  
// shuffleArray(indices);

// displaceRandom(numPoints, offsets, mesh, imageWidth, imageHeight)
// createVShape(numPoints, offsets, mesh)
// createSpiral(numPoints, offsets, scales, mesh)
// loopOffset()

turnOnRandomPixels()

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
    
      newColors[j] = red;
      newColors[j + 1] = green;
      newColors[j + 2] = blue;

      const brightness = (red + green + blue) / 3;

      const minScale = 0.75;
      const maxScale = 1.05;
      const colorBasedScale = minScale + brightness * (maxScale - minScale)

      newScales[j / 3] = colorBasedScale;
    }

    for (let i = 0; i < numPoints; i++) {
      gsap.to(colors, {
        [i * 3]: newColors[i * 3],
        [i * 3 + 1]: newColors[i * 3 + 1],
        [i * 3 + 2]: newColors[i * 3 + 2],
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: () => {
          mesh.geometry.attributes.instanceColor.array[i * 3] = colors[i * 3];
          mesh.geometry.attributes.instanceColor.array[i * 3 + 1] = colors[i * 3 + 1];
          mesh.geometry.attributes.instanceColor.array[i * 3 + 2] = colors[i * 3 + 2];
          mesh.geometry.attributes.instanceColor.needsUpdate = true;
        },
        // delay: i * 0.0001
      });

      gsap.to(scales, {
        [i]: newScales[i],
        duration: 4.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          mesh.geometry.attributes.scale.array[i] = scales[i];
          mesh.geometry.attributes.scale.needsUpdate = true;
        },
      });
    }

    isFirstLoad = false;
  });
}

// displaceRandom(numPoints, offsets, mesh, imageWidth, imageHeight);

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
camera.position.z = 120;

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