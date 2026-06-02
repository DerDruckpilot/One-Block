import { GAME_VIEW } from '../config/constants.js';

export class BackgroundSystem {
  constructor() {
    this.time = 0;
  }

  update(deltaSeconds) {
    this.time += deltaSeconds;
  }

  render(context, camera) {
    const gradient = context.createLinearGradient(0, 0, 0, GAME_VIEW.height);
    gradient.addColorStop(0, '#71c5ff');
    gradient.addColorStop(0.55, '#bcecff');
    gradient.addColorStop(1, '#fff0bd');
    context.fillStyle = gradient;
    context.fillRect(0, 0, GAME_VIEW.width, GAME_VIEW.height);

    this.drawCloudLayer(context, camera, 0.08, 2, 0.7);
    this.drawCloudLayer(context, camera, 0.2, 5, 1);
  }

  drawCloudLayer(context, camera, parallax, driftSpeed, scale) {
    const offset = (this.time * driftSpeed - camera.x * parallax) % 260;
    const baseY = 96 + parallax * 180 - camera.y * parallax * 0.1;

    context.save();
    context.globalAlpha = 0.45 + parallax;
    context.fillStyle = '#ffffff';

    for (let i = -1; i < 6; i += 1) {
      const x = i * 260 + offset;
      const y = baseY + Math.sin(i + this.time * 0.25) * 10;
      this.drawPixelCloud(context, x, y, scale);
    }

    context.restore();
  }

  drawPixelCloud(context, x, y, scale) {
    const size = 16 * scale;
    const blocks = [
      [0, 1, 5, 2],
      [1, 0, 4, 3],
      [3, -1, 4, 4],
      [5, 0, 5, 3],
      [8, 1, 4, 2]
    ];

    for (const [bx, by, bw, bh] of blocks) {
      context.fillRect(
        Math.round(x + bx * size),
        Math.round(y + by * size),
        Math.round(bw * size),
        Math.round(bh * size)
      );
    }
  }
}
