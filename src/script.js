import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader(); // Added CubeTextureLoader

// Scene
const scene = new THREE.Scene();

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
  "/textures/environmentMaps/0/px.jpg",
  "/textures/environmentMaps/0/nx.jpg",
  "/textures/environmentMaps/0/py.jpg",
  "/textures/environmentMaps/0/ny.jpg",
  "/textures/environmentMaps/0/pz.jpg",
  "/textures/environmentMaps/0/nz.jpg",
]);

// Apply the environment map to the scene background
scene.background = environmentMap;



/**
 * Ground (to receive shadows)
 */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ opacity: 0.5 })
);
ground.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
ground.position.y = -1; // Move it below the sphere
ground.receiveShadow = true; // Enable shadow receiving for the ground
scene.add(ground);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.position.set(0.25, 3, -2.25); // Position the light
directionalLight.castShadow = true; // Enable shadows for the directional light
scene.add(directionalLight);

directionalLight.shadow.mapSize.width = 1024; // Increase the shadow map resolution
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5; // Shadow camera settings
directionalLight.shadow.camera.far = 10;
directionalLight.shadow.camera.left = -5;
directionalLight.shadow.camera.right = 5;
directionalLight.shadow.camera.top = 5;
directionalLight.shadow.camera.bottom = -5;

const ambientLight = new THREE.AmbientLight(0x404040, 1); // Ambient light (soft light)
scene.add(ambientLight);

/**
 * Dat.GUI Controls
 */
gui
  .add(directionalLight, "intensity")
  .min(0)
  .max(10)
  .step(0.001)
  .name("lightIntensity");
gui
  .add(directionalLight.position, "x")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightX");
gui
  .add(directionalLight.position, "y")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightY");
gui
  .add(directionalLight.position, "z")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightZ");

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(4, 1, -4);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true; // Enable the shadow map in the renderer
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Set soft shadows for smoother edges

renderer.physicallyCorrectLights = true; // Switch to physically correct lighting

/**
 * Clock to keep track of time for animations
 */
const clock = new THREE.Clock();

/**
 * Load the model
 */
let mixer; // Declare mixer for handling animations
gltfLoader.load(
  "/models/hamburger.glb",
  (gltf) => {
    gltf.scene.scale.set(0.3, 0.3, 0.3);
    gltf.scene.position.set(0, -1, 0);
    scene.add(gltf.scene);

    updateAllMaterials();

    // Add the model to the scene
    scene.add(model);

    // Add Dat.GUI control to rotate the model around the Y-axis
    gui
      .add(model.rotation, "y")
      .min(-Math.PI)
      .max(Math.PI)
      .step(0.001)
      .name("rotation");
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  (error) => {
    console.error("Error loading model", error);
  }
);

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      child.material.envMap = environmentMap;
      child.material.envMapIntensity = 2.5;
    }
  });
};

scene.background = environmentMap;

/**
 * Animate
 */
const tick = () => {
  controls.update();

  if (mixer) {
    const deltaTime = clock.getDelta(); // Time in seconds since the last frame
    mixer.update(deltaTime); // Update animations
  }

  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
