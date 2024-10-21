import * as THREE from 'three'
import { GUI } from 'dat.gui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const container = document.querySelector('#img_wrapper');
let imageAspect;
let planeAspect;
let imageWidth;
let imageHeight;
const originalAspectRatio = 1.499;
const calculatedHeight = container.clientWidth / originalAspectRatio;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Instanced buffer geometry 
const bufferGeometry = new THREE.InstancedBufferGeometry();

// positions
const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
positions.setXYZ(0, -0.5, 0.5, 0.0);
positions.setXYZ(1, 0.5, 0.5, 0.0);
positions.setXYZ(2, -0.5, -0.5, 0.0);
positions.setXYZ(3, 0.5, -0.5, 0.0);

bufferGeometry.setAttribute('position', positions);

// uvs
const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
uvs.setXYZ(0, 0.0, 0.0);
uvs.setXYZ(1, 1.0, 0.0);
uvs.setXYZ(2, 0.0, 1.0);
uvs.setXYZ(3, 1.0, 1.0);

bufferGeometry.setAttribute('uv', uvs);

// index
bufferGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array([ 0, 2, 1, 2, 3, 1 ]), 1));

// Texture/img
const texture = new THREE.TextureLoader().load("img/lo.jpg", (texture) => {
  // 2440 × 1627
  imageAspect = texture.image.width / texture.image.height;
  
  const planeHeight = 2;
  const planeWidth = planeHeight * imageAspect;
  const numPoints = 2440 * 1627
  const indices = new Uint16Array(numPoints);
  const offsets = new Float32Array(numPoints * 3);
  const angles = new Float32Array(numPoints);
  
  for (let i = 0; i < numPoints; i++) {
    offsets[i * 3 + 0] = i % 1;
    offsets[i * 3 + 1] = Math.floor(i / 1);
  
    indices[i] = i;
  
    angles[i] = Math.random() * Math.PI;
  }
  
  bufferGeometry.setAttribute('pindex', new THREE.InstancedBufferAttribute(indices, 1, false));
  bufferGeometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false));
  bufferGeometry.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false));

  const material = new THREE.MeshStandardMaterial({
    color: 0xba00b2,
    metalness: 0.7,
    roughness: 0.45,
    side: THREE.DoubleSide,
    // emissive: new THREE.Color(0x00ff00),
    // emissiveIntensity: 0.1,
    wireframe: false,
  });

  // Extract pixel position and opacity from image
  for (let y = 0; y < texture.image.height; y++) {
    for (let x = 0; x < texture.image.width; x++) {
      const index = (y * texture.image.width + x) * 4;  // Get pixel index in the data array

      //const r = data[index];      // Red value
      //const g = data[index + 1];  // Green value
      //const b = data[index + 2];  // Blue value
      //const a = data[index + 3];  // Alpha value

      // If pixel is not transparent (alpha > 0)
      //if (a > 0) {
        // Create a small geometry (like a sphere or box)
        const geometry = new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize); // Or use SphereGeometry

        // Create a material using the pixel color
        const materialz = new THREE.MeshBasicMaterial({ color: `rgb(${r}, ${g}, ${b})` });

        // Create the mesh
        const pixelMesh = new THREE.Mesh(geometry, material);

        // Set the position of the geometry based on pixel position
        pixelMesh.position.set(
          (x - offsetX) * pixelSize,   // X position
          -(y - offsetY) * pixelSize,  // Y position (inverted for correct orientation)
          0                            // Z position (can add depth if needed)
        );

        // Add the mesh to the scene
        scene.add(pixelMesh);
      //}
    }
  }
});

// Light
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Set camera position
camera.position.z = 5;

// Handle window resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Render loop
function animate() {
  requestAnimationFrame(animate);

  controls.update();  // Only required if controls.enableDamping is set to true

  renderer.render(scene, camera);
}

animate();