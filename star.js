import * as THREE from "three";

export default class StarField {
  constructor(scene, textureUrl, starCount = 2000, radius = 2000) {
    this.scene = scene;
    this.textureLoader = new THREE.TextureLoader();
    this.starTexture = this.textureLoader.load(textureUrl);

    this.stars = this.createStars(starCount, radius);
    this.scene.add(this.stars);
  }

  createStars(starCount, radius) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    // 在球体范围内随机分布星星
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1); // 均匀分布
      const r = radius;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 10, // 星星大小
      map: this.starTexture,
      transparent: true,
      depthWrite: false, // 避免遮挡
      blending: THREE.AdditiveBlending, // 叠加发光效果
    });

    return new THREE.Points(geometry, material);
  }

  update(delta) {
    // 缓慢旋转星空
    this.stars.rotation.y += delta * 0.02;
  }
}
