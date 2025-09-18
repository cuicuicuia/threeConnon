import * as THREE from "three";
import * as CANNON from "cannon-es";
import BallControls from "./controls.js"; // 引入控制器
import StarField from "./star.js";

// === Three.js ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// === 星空 ===
const starField = new StarField(scene, "./spark.png", 30000, 1500);

// === 相机 ===
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000000
);
camera.position.set(0, 10, 20);

// === 渲染器 ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// === 灯光 ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(50, 100, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 200;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
scene.add(sunLight);

// === Cannon.js 世界 ===
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

// === 地板 ===
const groundShape = new CANNON.Box(new CANNON.Vec3(250, 0.5, 250));
const groundBody = new CANNON.Body({
  mass: 0,
  shape: groundShape,
  position: new CANNON.Vec3(0, -0.5, 0),
});
world.addBody(groundBody);

// THREE 地板（半透明线框）
const groundMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(250, 250),
  new THREE.MeshStandardMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  })
);
groundMesh.rotation.x = -Math.PI / 2;

// 线框
const gridHelper = new THREE.GridHelper(250, 40, 0xffffff, 0xffffff);
gridHelper.material.opacity = 0.2;
gridHelper.material.transparent = true;

groundMesh.receiveShadow = true;
scene.add(groundMesh, gridHelper);

// === 球体 ===
const radius = 1;
const ballBody = new CANNON.Body({
  mass: 2,
  shape: new CANNON.Sphere(radius),
  position: new CANNON.Vec3(0, 10, 0),
  linearDamping: 0.5,
  angularDamping: 0.93,
});
world.addBody(ballBody);
// 球体 Mesh
const ballMesh = new THREE.Mesh(
  new THREE.SphereGeometry(radius, 32, 32),
  new THREE.MeshStandardMaterial({
    map: new THREE.TextureLoader().load("./earth.jpg"),
    aoMap: new THREE.TextureLoader().load("./earth.jpg"),
  })
);
ballMesh.castShadow = true;
scene.add(ballMesh);

// === 摩擦力 ===
const groundMaterial = new CANNON.Material("groundMaterial");
const ballMaterial = new CANNON.Material("ballMaterial");
groundBody.material = groundMaterial;
ballBody.material = ballMaterial;

const contactMaterial = new CANNON.ContactMaterial(
  groundMaterial,
  ballMaterial,
  {
    friction: 0.6,
    restitution: 0.2,
  }
);
world.addContactMaterial(contactMaterial);

// === 控制器 ===
const controls = new BallControls(ballBody, 10);

// === 平滑相机跟随 ===
class SmoothCameraFollow {
  constructor(camera, target, distance = 20, height = 15, smoothness = 0.1) {
    this.camera = camera;
    this.target = target;
    this.distance = distance;
    this.height = height;
    this.smoothness = smoothness;
  }

  update() {
    const targetPosition = new THREE.Vector3().copy(this.target.position);
    const desiredCameraPosition = new THREE.Vector3()
      .copy(targetPosition)
      .add(new THREE.Vector3(0, this.height, this.distance));
    this.camera.position.lerp(desiredCameraPosition, this.smoothness);
    const lookAtPosition = new THREE.Vector3()
      .copy(targetPosition)
      .add(new THREE.Vector3(0, 2, 0));
    this.camera.lookAt(lookAtPosition);
  }
}

const smoothCameraFollow = new SmoothCameraFollow(
  camera,
  ballMesh,
  20,
  15,
  0.05
);

// === 动画循环 ===
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  world.step(1 / 60, delta, 3);

  // 同步物理
  ballMesh.position.copy(ballBody.position);
  ballMesh.quaternion.copy(ballBody.quaternion);

  // 更新控制器和相机
  controls.update();
  smoothCameraFollow.update();

  // 更新星空
  starField.update(delta);

  renderer.render(scene, camera);
}

animate();

// === 窗口缩放 ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
