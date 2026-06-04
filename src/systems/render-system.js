import { DROP_ANIMATION_SECONDS, OBJECT_TYPES, PLAYER_SIZE, RESOURCE_ICONS, TILE_SIZE, TILE_TYPES } from '../config/constants.js';
import { TerrainRenderer } from './terrain-renderer.js';

export class RenderSystem {
  constructor(context, terrainRenderer = new TerrainRenderer()) {
    this.context = context;
    this.terrainRenderer = terrainRenderer;
  }

  renderWorld(tileMap, camera) {
    this.drawIslandShadow(tileMap, camera);

    tileMap.forEachTile((tile) => {
      if (tile.type === TILE_TYPES.crystal) return;

      const screenX = Math.round(tile.x * TILE_SIZE - camera.x);
      const screenY = Math.round(tile.y * TILE_SIZE - camera.y);

      this.terrainRenderer.drawTile(this.context, tile, tileMap, screenX, screenY);
    });
  }

  renderCrystal(tileMap, camera, timeMs) {
    const { x, y } = tileMap.crystal;
    const screenX = Math.round(x * TILE_SIZE - camera.x);
    const screenY = Math.round(y * TILE_SIZE - camera.y);
    const pulse = Math.sin(timeMs / 260) * 2;

    this.terrainRenderer.drawTile(
      this.context,
      { x, y, type: TILE_TYPES.crystal },
      tileMap,
      screenX,
      screenY
    );

    const cx = screenX + TILE_SIZE / 2;
    const cy = screenY + TILE_SIZE / 2 - 2;

    this.context.save();
    this.context.fillStyle = '#31251f';
    this.context.fillRect(cx - 14, screenY + 19, 28, 7);
    this.context.fillStyle = '#6d6358';
    this.context.fillRect(cx - 12, screenY + 16, 24, 7);
    this.context.fillStyle = '#8a8173';
    this.context.fillRect(cx - 9, screenY + 15, 18, 3);
    this.context.fillStyle = '#d78cff';
    this.context.fillRect(cx - 4, screenY + 17, 8, 2);

    this.context.globalAlpha = 0.32;
    this.context.fillStyle = '#d974ff';
    this.context.fillRect(cx - 17 - pulse, cy - 19 - pulse, 34 + pulse * 2, 34 + pulse * 2);
    this.context.globalAlpha = 1;

    this.context.fillStyle = '#341b78';
    this.context.fillRect(cx - 7, cy - 17, 14, 29);
    this.context.fillRect(cx - 10, cy - 10, 20, 15);
    this.context.fillStyle = '#6b2cd4';
    this.context.fillRect(cx - 5, cy - 15, 10, 27);
    this.context.fillStyle = '#a044ff';
    this.context.fillRect(cx - 9, cy - 8, 8, 15);
    this.context.fillRect(cx + 2, cy - 9, 7, 14);
    this.context.fillStyle = '#e9b7ff';
    this.context.fillRect(cx - 3, cy - 16, 5, 10);
    this.context.fillRect(cx - 5, cy - 5, 3, 5);
    this.context.fillStyle = '#ffffff';
    this.context.fillRect(cx - 1, cy - 15, 2, 6);
    this.context.fillStyle = '#c657ff';
    this.context.fillRect(cx - 15, cy - 4, 4, 7);
    this.context.fillRect(cx + 12, cy - 1, 4, 6);
    this.context.fillRect(cx - 20, cy + 7, 3, 3);
    this.context.fillRect(cx + 18, cy + 8, 3, 3);
    this.context.restore();
  }

  renderObjects(tileMap, camera) {
    tileMap.forEachObject((object) => {
      const screenX = Math.round(object.x * TILE_SIZE - camera.x);
      const screenY = Math.round(object.y * TILE_SIZE - camera.y);

      if (object.type === OBJECT_TYPES.workbench) {
        this.drawWorkbench(screenX, screenY);
      }
      if (object.type === OBJECT_TYPES.torch) {
        this.drawTorch(screenX, screenY);
      }
      if (object.type === OBJECT_TYPES.campfire) {
        this.drawCampfire(screenX, screenY);
      }
      if (object.type === OBJECT_TYPES.woodWall) {
        this.drawWoodWall(screenX, screenY);
      }
      if (object.type === OBJECT_TYPES.table) {
        this.drawTable(screenX, screenY);
      }
      if (object.type === OBJECT_TYPES.chair) {
        this.drawChair(screenX, screenY);
      }
    });
  }

  renderDrops(drops, camera) {
    for (const drop of drops) {
      const progress = Math.min(1, drop.age / (drop.duration || DROP_ANIMATION_SECONDS));
      const arc = Math.sin(progress * Math.PI) * 18;
      const worldX = drop.startX + (drop.x - drop.startX) * progress;
      const worldY = drop.startY + (drop.y - drop.startY) * progress - arc;
      const x = Math.round(worldX - camera.x);
      const y = Math.round(worldY - camera.y);

      this.context.save();
      this.context.fillStyle = 'rgba(0, 0, 0, 0.22)';
      this.context.fillRect(x - 7, Math.round(drop.y - camera.y) + 8, 14, 4);
      this.context.fillStyle = '#f7d979';
      this.context.fillRect(x - 6, y - 8, 12, 12);
      this.context.fillStyle = '#5b3b2c';
      this.context.font = '10px monospace';
      this.context.textAlign = 'center';
      this.context.fillText?.(RESOURCE_ICONS[drop.resource] || '?', x, y + 2);
      this.context.restore();
    }
  }

  renderEnemies(enemies, camera) {
    for (const enemy of enemies) {
      const x = Math.round(enemy.x - camera.x);
      const y = Math.round(enemy.y - camera.y);
      const flash = enemy.hitFlashSeconds > 0;

      this.context.save();
      this.context.fillStyle = 'rgba(0, 0, 0, 0.24)';
      this.context.fillRect(x + 5, y + 25, 20, 5);
      this.context.fillStyle = flash ? '#ffd6d6' : '#7b2633';
      this.context.fillRect(x + 6, y + 8, 18, 18);
      this.context.fillStyle = flash ? '#ff7070' : '#b83a4b';
      this.context.fillRect(x + 9, y + 5, 12, 18);
      this.context.fillStyle = '#2a1419';
      this.context.fillRect(x + 10, y + 12, 3, 3);
      this.context.fillRect(x + 18, y + 12, 3, 3);
      this.context.fillStyle = '#e8b860';
      this.context.fillRect(x + 5, y + 3, 5, 5);
      this.context.fillRect(x + 20, y + 3, 5, 5);

      if (enemy.healthVisible) {
        const width = 28;
        const fill = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
        this.context.fillStyle = '#2a1419';
        this.context.fillRect(x + 1, y - 7, width, 5);
        this.context.fillStyle = '#64d65f';
        this.context.fillRect(x + 2, y - 6, Math.round((width - 2) * fill), 3);
      }
      this.context.restore();
    }
  }

  renderFlyingEnemies(enemies, camera) {
    for (const enemy of enemies) {
      const x = Math.round(enemy.x - camera.x);
      const y = Math.round(enemy.y - camera.y);
      const flash = enemy.hitFlashSeconds > 0;

      this.context.save();
      this.context.fillStyle = 'rgba(0, 0, 0, 0.16)';
      this.context.fillRect(x + 5, y + 29, 20, 4);
      this.context.fillStyle = flash ? '#f0d8ff' : '#49306f';
      this.context.fillRect(x + 9, y + 10, 10, 12);
      this.context.fillStyle = flash ? '#ffffff' : '#6d45a8';
      this.context.fillRect(x + 2, y + 13, 8, 5);
      this.context.fillRect(x + 18, y + 13, 8, 5);
      this.context.fillStyle = '#f7e6ff';
      this.context.fillRect(x + 11, y + 13, 2, 2);
      this.context.fillRect(x + 16, y + 13, 2, 2);

      if (enemy.healthVisible) {
        const width = 28;
        const fill = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
        this.context.fillStyle = '#2a1419';
        this.context.fillRect(x, y - 7, width, 5);
        this.context.fillStyle = '#64d65f';
        this.context.fillRect(x + 1, y - 6, Math.round((width - 2) * fill), 3);
      }
      this.context.restore();
    }
  }

  renderAnimals(animals, camera) {
    for (const animal of animals) {
      const x = Math.round(animal.x - camera.x);
      const y = Math.round(animal.y - camera.y);

      this.context.save();
      this.context.fillStyle = 'rgba(0, 0, 0, 0.16)';
      this.context.fillRect(x + 5, y + 20, 15, 4);
      this.context.fillStyle = '#f5e6ba';
      this.context.fillRect(x + 6, y + 8, 13, 11);
      this.context.fillStyle = '#fff7d6';
      this.context.fillRect(x + 10, y + 4, 9, 8);
      this.context.fillStyle = '#d8792b';
      this.context.fillRect(x + 18, y + 8, 4, 3);
      this.context.fillStyle = '#3b2a1d';
      this.context.fillRect(x + 14, y + 7, 2, 2);
      this.context.fillStyle = '#d8792b';
      this.context.fillRect(x + 9, y + 19, 2, 4);
      this.context.fillRect(x + 16, y + 19, 2, 4);
      this.context.restore();
    }
  }

  renderProjectiles(projectiles, camera) {
    for (const projectile of projectiles) {
      const x = Math.round(projectile.x - camera.x);
      const y = Math.round(projectile.y - camera.y + Math.sin(projectile.distance / 16) * 2);

      this.context.save();
      if (projectile.type === 'arrow') {
        this.context.fillStyle = '#e6d4a8';
        this.context.fillRect(x - 6, y - 1, 12, 2);
        this.context.fillStyle = '#f5f5f5';
        this.context.fillRect(x - 8, y - 3, 3, 6);
      } else {
        this.context.fillStyle = '#6d6f73';
        this.context.fillRect(x - 3, y - 3, 6, 6);
        this.context.fillStyle = '#b5b8bc';
        this.context.fillRect(x - 1, y - 3, 2, 2);
      }
      this.context.restore();
    }
  }

  renderAttackFeedback(feedback, camera) {
    if (!feedback || feedback.seconds <= 0) return;

    this.context.save();
    if (feedback.type === 'spear') {
      const progress = 1 - feedback.seconds / feedback.duration;
      const originX = Math.round(feedback.x - camera.x);
      const originY = Math.round(feedback.y - camera.y);
      const facing = feedback.facing || { x: 0, y: -1 };
      const endX = originX + facing.x * 50;
      const endY = originY + facing.y * 50;
      this.context.globalAlpha = 0.76 - progress * 0.36;
      this.context.strokeStyle = '#ffe082';
      this.context.lineWidth = 5;
      this.context.beginPath?.();
      if (this.context.moveTo && this.context.lineTo && this.context.stroke) {
        this.context.moveTo(originX, originY);
        this.context.lineTo(endX, endY);
        this.context.stroke();
      } else {
        this.context.fillStyle = '#ffe082';
        this.context.fillRect(Math.min(originX, endX), Math.min(originY, endY), Math.max(4, Math.abs(endX - originX) || 4), Math.max(4, Math.abs(endY - originY) || 4));
      }
    }

    if (feedback.type === 'crystalHit') {
      const x = Math.round(feedback.x - camera.x);
      const y = Math.round(feedback.y - camera.y);
      this.context.globalAlpha = 0.72;
      this.context.fillStyle = '#ffffff';
      this.context.fillRect(x - 12, y - 12, 24, 4);
      this.context.fillRect(x - 2, y - 22, 4, 24);
      this.context.fillStyle = '#d87cff';
      this.context.fillRect(x - 18, y - 2, 36, 4);
    }
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

  renderPlacementPreview(preview, camera) {
    const x = Math.round(preview.x * TILE_SIZE - camera.x);
    const y = Math.round(preview.y * TILE_SIZE - camera.y);

    this.context.save();
    this.context.globalAlpha = preview.canPlace ? 0.62 : 0.68;
    this.context.fillStyle = preview.canPlace ? '#9dff72' : '#8f1f2d';
    this.context.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    this.context.globalAlpha = 1;
    this.context.strokeStyle = preview.canPlace ? '#ecffe7' : '#ffb1b1';
    this.context.lineWidth = 3;
    this.context.strokeRect(x + 3.5, y + 3.5, TILE_SIZE - 7, TILE_SIZE - 7);
    this.context.restore();
  }

  drawWorkbench(x, y) {
    this.context.save();
    this.context.fillStyle = '#3a2418';
    this.context.fillRect(x + 6, y + 15, 20, 12);
    this.context.fillStyle = '#8a5a35';
    this.context.fillRect(x + 5, y + 11, 22, 8);
    this.context.fillStyle = '#b57a45';
    this.context.fillRect(x + 7, y + 9, 18, 5);
    this.context.fillStyle = '#2e1d14';
    this.context.fillRect(x + 8, y + 24, 4, 6);
    this.context.fillRect(x + 20, y + 24, 4, 6);
    this.context.fillStyle = '#d2a06a';
    this.context.fillRect(x + 10, y + 11, 4, 3);
    this.context.fillRect(x + 18, y + 11, 4, 3);
    this.context.restore();
  }

  drawTorch(x, y) {
    this.context.save();
    this.context.fillStyle = '#5b331c';
    this.context.fillRect(x + 14, y + 12, 4, 16);
    this.context.fillStyle = '#ffb33c';
    this.context.fillRect(x + 12, y + 8, 8, 7);
    this.context.fillStyle = '#ffe889';
    this.context.fillRect(x + 14, y + 6, 4, 6);
    this.context.restore();
  }

  drawCampfire(x, y) {
    this.context.save();
    this.context.fillStyle = '#3b281d';
    this.context.fillRect(x + 7, y + 22, 18, 5);
    this.context.fillStyle = '#8a5a35';
    this.context.fillRect(x + 6, y + 19, 20, 4);
    this.context.fillStyle = '#e7442e';
    this.context.fillRect(x + 11, y + 11, 10, 10);
    this.context.fillStyle = '#ffb33c';
    this.context.fillRect(x + 13, y + 8, 6, 11);
    this.context.fillStyle = '#ffe889';
    this.context.fillRect(x + 15, y + 10, 2, 7);
    this.context.restore();
  }

  drawWoodWall(x, y) {
    this.context.save();
    this.context.fillStyle = '#3a2418';
    this.context.fillRect(x + 5, y + 6, 22, 23);
    this.context.fillStyle = '#8a5a35';
    this.context.fillRect(x + 7, y + 8, 5, 19);
    this.context.fillRect(x + 14, y + 8, 5, 19);
    this.context.fillRect(x + 21, y + 8, 4, 19);
    this.context.fillStyle = '#c08a53';
    this.context.fillRect(x + 7, y + 12, 18, 2);
    this.context.restore();
  }

  drawTable(x, y) {
    this.context.save();
    this.context.fillStyle = '#3a2418';
    this.context.fillRect(x + 7, y + 15, 18, 8);
    this.context.fillStyle = '#b57a45';
    this.context.fillRect(x + 5, y + 11, 22, 7);
    this.context.fillStyle = '#2e1d14';
    this.context.fillRect(x + 8, y + 22, 3, 7);
    this.context.fillRect(x + 21, y + 22, 3, 7);
    this.context.restore();
  }

  drawChair(x, y) {
    this.context.save();
    this.context.fillStyle = '#7d4e2d';
    this.context.fillRect(x + 11, y + 8, 10, 13);
    this.context.fillStyle = '#b57a45';
    this.context.fillRect(x + 9, y + 19, 14, 7);
    this.context.fillStyle = '#2e1d14';
    this.context.fillRect(x + 10, y + 25, 3, 5);
    this.context.fillRect(x + 20, y + 25, 3, 5);
    this.context.restore();
  }

  renderLighting(dayNightSystem, tileMap, camera, view) {
    const darkness = dayNightSystem.getDarkness();
    if (darkness <= 0) return;

    this.context.save();
    this.context.fillStyle = `rgba(12, 20, 43, ${darkness})`;
    this.context.fillRect(0, 0, view.width, view.height);

    tileMap.forEachObject((object) => {
      if (object.type !== OBJECT_TYPES.torch && object.type !== OBJECT_TYPES.campfire) return;
      const radius = object.type === OBJECT_TYPES.campfire ? 78 : 48;
      const x = object.x * TILE_SIZE + TILE_SIZE / 2 - camera.x;
      const y = object.y * TILE_SIZE + TILE_SIZE / 2 - camera.y;
      this.context.globalAlpha = object.type === OBJECT_TYPES.campfire ? 0.26 : 0.18;
      this.context.fillStyle = '#ffe889';
      if (this.context.beginPath && this.context.arc && this.context.fill) {
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI * 2);
        this.context.fill();
      } else {
        this.context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
    });
    this.context.restore();
  }

  drawIslandShadow(tileMap, camera) {
    this.context.save();
    this.context.globalAlpha = 0.08;
    this.context.fillStyle = '#223149';

    tileMap.forEachTile((tile) => {
      const x = Math.round(tile.x * TILE_SIZE - camera.x);
      const y = Math.round(tile.y * TILE_SIZE - camera.y);
      this.context.fillRect(x + 3, y + TILE_SIZE + 14, TILE_SIZE - 6, 8);
    });

    this.context.restore();
  }
}
