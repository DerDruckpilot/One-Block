import { GAME_VIEW } from '../config/constants.js';

const STAR_POINTS = [
  { x: 90, y: 42, size: 2 },
  { x: 188, y: 84, size: 1 },
  { x: 296, y: 36, size: 2 },
  { x: 430, y: 74, size: 1 },
  { x: 548, y: 48, size: 2 },
  { x: 692, y: 92, size: 1 },
  { x: 826, y: 52, size: 2 },
  { x: 908, y: 118, size: 1 }
];

export class BackgroundSystem {
  constructor() {
    this.time = 0;
  }

  update(deltaSeconds) {
    this.time += deltaSeconds;
  }

  render(context, camera, dayNightSystem = null) {
    const sky = dayNightSystem?.getSkyProfile?.() || {
      top: '#71c5ff',
      middle: '#bcecff',
      bottom: '#fff0bd',
      cloudAlpha: 0.48,
      starAlpha: 0,
      warmOverlay: 0
    };

    const gradient = context.createLinearGradient(0, 0, 0, GAME_VIEW.height);
    gradient.addColorStop(0, sky.top);
    gradient.addColorStop(0.55, sky.middle);
    gradient.addColorStop(1, sky.bottom);
    context.fillStyle = gradient;
    context.fillRect(0, 0, GAME_VIEW.width, GAME_VIEW.height);

    this.drawStars(context, sky.starAlpha);
    this.drawCloudLayer(context, camera, 0.08, 2, 0.7, sky.cloudAlpha);
    this.drawCloudLayer(context, camera, 0.2, 5, 1, Math.min(0.7, sky.cloudAlpha + 0.16));

    if (sky.warmOverlay > 0) {
      context.save();
      context.globalAlpha = sky.warmOverlay;
      context.fillStyle = '#f3a45f';
      context.fillRect(0, 0, GAME_VIEW.width, GAME_VIEW.height);
      context.restore();
    }
  }

  drawStars(context, alpha = 0) {
    if (alpha <= 0) return;
    context.save();
    context.globalAlpha = Math.min(1, alpha);
    context.fillStyle = '#f8f0c8';
    for (const star of STAR_POINTS) {
      const twinkle = (Math.sin(this.time * 1.3 + star.x) + 1) * 0.5;
      const size = star.size + (twinkle > 0.7 ? 1 : 0);
      context.fillRect(star.x, star.y, size, size);
    }
    context.restore();
  }

  drawCloudLayer(context, camera, parallax, driftSpeed, scale, alpha) {
    const offset = (this.time * driftSpeed - camera.x * parallax) % 260;
    const baseY = 96 + parallax * 180 - camera.y * parallax * 0.1;

    context.save();
    context.globalAlpha = alpha;
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
