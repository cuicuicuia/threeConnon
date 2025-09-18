import * as THREE from "three";

export default class StarField {
  constructor(scene, textureUrl, starCount = 2000, radius = 500) {
    this.scene = scene;
    this.textureLoader = new THREE.TextureLoader();
    this.starTexture = this.textureLoader.load(textureUrl);

    this.starCount = starCount;
    this.radius = radius;

    this.stars = this.createStars();
    this.scene.add(this.stars);
  }

  createStars() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);

    for (let i = 0; i < this.starCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      const r = this.radius;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions.set([x, y, z], i * 3);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 2,
      map: this.starTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }

  update(delta) {
    // 让星空缓慢旋转，看起来在动
    this.stars.rotation.y += delta * 0.02;
    this.stars.rotation.x += delta * 0.005;
  }
}
