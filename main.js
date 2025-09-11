import * as THREE from "three";
import * as CANNON from "cannon-es";

// === Three.js ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 10, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 灯光
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
light.castShadow = true;
scene.add(light);

// === Cannon.js ===
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

// 地板
const groundBody = new CANNON.Body({
  mass: 0, // static
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const groundMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x888888 })
);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// 球体
const radius = 1;
const ballBody = new CANNON.Body({
  mass: 5,
  shape: new CANNON.Sphere(radius),
  position: new CANNON.Vec3(0, 10, 0),
});
world.addBody(ballBody);

const ballMesh = new THREE.Mesh(
  new THREE.SphereGeometry(radius, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xff4444 })
);
ballMesh.castShadow = true;
scene.add(ballMesh);

// === 动画循环 ===
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  world.step(1 / 60, delta, 3);

  // 同步物理 → 渲染
  ballMesh.position.copy(ballBody.position);
  ballMesh.quaternion.copy(ballBody.quaternion);

  renderer.render(scene, camera);
}

animate();

// 响应窗口大小
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
