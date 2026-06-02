import { GAME_VIEW, PLAYER_SIZE, TILE_SIZE, TILE_TYPES } from '../config/constants.js';

export class RenderSystem {
  constructor(context) {
    this.context = context;
  }

  renderWorld(tileMap, camera) {
    tileMap.forEachTile((tile) => {
      const screenX = Math.round(tile.x * TILE_SIZE - camera.x);
      const screenY = Math.round(tile.y * TILE_SIZE - camera.y);

      if (tile.type === TILE_TYPES.earth) {
        this.drawEarthTile(screenX, screenY);
      }
    });
  }

  renderCrystal(tileMap, camera, timeMs) {
    const { x, y } = tileMap.crystal;
    const screenX = Math.round(x * TILE_SIZE - camera.x);
    const screenY = Math.round(y * TILE_SIZE - camera.y);
    const pulse = Math.sin(timeMs / 260) * 2;

    this.drawEarthTile(screenX, screenY);

    const cx = screenX + TILE_SIZE / 2;
    const cy = screenY + TILE_SIZE / 2 - 2;

    this.context.save();
    this.context.globalAlpha = 0.35;
    this.context.fillStyle = '#b48cff';
    this.context.fillRect(cx - 14 - pulse, cy - 14 - pulse, 28 + pulse * 2, 28 + pulse * 2);
    this.context.globalAlpha = 1;

    this.context.fillStyle = '#4f2a94';
    this.context.fillRect(cx - 5, cy - 12, 10, 24);
    this.context.fillStyle = '#8f63ff';
    this.context.fillRect(cx - 9, cy - 6, 18, 14);
    this.context.fillStyle = '#d9c7ff';
    this.context.fillRect(cx - 3, cy - 10, 4, 8);
    this.context.restore();
  }

  renderPlayer(player, camera) {
    const x = Math.round(player.x - camera.x);
    const y = Math.round(player.y - camera.y);

    this.context.save();
    this.context.fillStyle = 'rgba(0, 0, 0, 0.22)';
    this.context.fillRect(x + 12, y + 38, 24, 7);

    this.context.fillStyle = '#8f5f3d';
    this.context.fillRect(x + 16, y + 8, 16, 12);
    this.context.fillStyle = '#b77a52';
    this.context.fillRect(x + 14, y + 15, 20, 18);
    this.context.fillStyle = '#ded0ad';
    this.context.fillRect(x + 13, y + 27, 22, 13);
    this.context.fillStyle = '#5b3b2c';
    this.context.fillRect(x + 15, y + 5, 18, 8);
    this.context.fillStyle = '#2b1d17';
    this.context.fillRect(x + 19, y + 17, 3, 3);
    this.context.fillRect(x + 27, y + 17, 3, 3);
    this.context.fillStyle = '#8b5a36';
    this.context.fillRect(x + 12, y + 30, 4, 8);
    this.context.fillRect(x + 32, y + 30, 4, 8);
    this.context.fillRect(x + 17, y + 39, 5, 5);
    this.context.fillRect(x + 27, y + 39, 5, 5);
    this.context.restore();
  }

  drawEarthTile(x, y) {
    this.context.fillStyle = '#7a5834';
    this.context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.context.fillStyle = '#8f6b3f';
    this.context.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    this.context.fillStyle = '#6e4c2e';
    this.context.fillRect(x + 4, y + 24, 6, 3);
    this.context.fillRect(x + 20, y + 9, 5, 3);
    this.context.fillStyle = '#69a84f';
    this.context.fillRect(x + 3, y + 3, TILE_SIZE - 6, 4);
  }
}
