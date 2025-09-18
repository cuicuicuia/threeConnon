import * as THREE from "three";
import * as CANNON from "cannon-es";
import BallControls from "./controls.js"; // 引入控制器
import StarField from "./star.js";

// === Three.js ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const starField = new StarField(scene, "./spark.png");

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000000
);
camera.position.set(0, 10, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// === 灯光 ===
// 环境光（柔和照亮整个场景）
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // 第二个参数是强度
scene.add(ambientLight);

// 太阳光（平行光，能产生阴影）
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(50, 100, 50); // 光源高高挂起，像太阳
sunLight.castShadow = true;

// 调整阴影范围，保证地板能接收阴影
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 200;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;

scene.add(sunLight);
// === Cannon.js ===
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

// 地板
const groundShape = new CANNON.Box(new CANNON.Vec3(25, 0.5, 25));
const groundBody = new CANNON.Body({
  mass: 0,
  shape: groundShape,
  position: new CANNON.Vec3(0, -0.5, 0),
});
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
  mass: 2,
  shape: new CANNON.Sphere(radius),
  position: new CANNON.Vec3(0, 10, 0),
  linearDamping: 0.5, // 加大阻尼，防止无限滑动
  angularDamping: 0.4,
});
world.addBody(ballBody);

// === 加入摩擦力 ===
const groundMaterial = new CANNON.Material("groundMaterial");
const ballMaterial = new CANNON.Material("ballMaterial");

groundBody.material = groundMaterial;
ballBody.material = ballMaterial;

const contactMaterial = new CANNON.ContactMaterial(
  groundMaterial,
  ballMaterial,
  {
    friction: 0.6, // 摩擦力
    restitution: 0.2, // 弹性
  }
);
world.addContactMaterial(contactMaterial);

// === 控制器 ===
const controls = new BallControls(ballBody, 10); // 力量调小（原来是 50）

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

  // 更新相机
  smoothCameraFollow.update();

  // 更新控制器
  controls.update();

  // 更新星空
  starField.update(delta);

  renderer.render(scene, camera);
}

// 更平滑的相机跟随
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

    // 平滑过渡
    this.camera.position.lerp(desiredCameraPosition, this.smoothness);

    // 看向球体
    const lookAtPosition = new THREE.Vector3()
      .copy(targetPosition)
      .add(new THREE.Vector3(0, 2, 0));
    this.camera.lookAt(lookAtPosition);
  }
}

// 使用平滑相机
const smoothCameraFollow = new SmoothCameraFollow(
  camera,
  ballMesh,
  20,
  15,
  0.05
);

animate();

// 响应窗口大小
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
