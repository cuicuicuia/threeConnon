// controls.js
import * as CANNON from "cannon-es";

export default class BallControls {
  constructor(ballBody, speed = 10) {
    this.ballBody = ballBody;
    this.speed = speed;
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
    };

    // 监听键盘
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));
  }

  onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (this.keys[key] !== undefined) this.keys[key] = true;
  }

  onKeyUp(event) {
    const key = event.key.toLowerCase();
    if (this.keys[key] !== undefined) this.keys[key] = false;
  }

  update() {
    const force = new CANNON.Vec3(0, 0, 0);

    if (this.keys.w) force.z -= this.speed; // 前
    if (this.keys.s) force.z += this.speed; // 后
    if (this.keys.a) force.x -= this.speed; // 左
    if (this.keys.d) force.x += this.speed; // 右

    if (!force.almostZero()) {
      this.ballBody.applyForce(force, this.ballBody.position);
    }
  }
}
