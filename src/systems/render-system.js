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
        this.drawWoodWall(screenX, screenY, tileMap.getBarrierCollisionShape(object.x, object.y));
      }
      if (object.type === OBJECT_TYPES.door) {
        this.drawDoor(screenX, screenY, object.open, tileMap.getBarrierCollisionShape(object.x, object.y));
      }
      if (object.type === OBJECT_TYPES.table) {
        this.drawTable(screenX, screenY);
      }
      if (object.type === OBJECT_TYPES.chair) {
        this.drawChair(screenX, screenY);
      }
      if (object.type === OBJECT_TYPES.fence) {
        this.drawFence(screenX, screenY, tileMap.getBarrierCollisionShape(object.x, object.y));
      }
      if (object.type === OBJECT_TYPES.gate) {
        this.drawGate(screenX, screenY, object.open, tileMap.getBarrierCollisionShape(object.x, object.y));
      }
      if (object.type === OBJECT_TYPES.sapling) {
        this.drawSapling(screenX, screenY, object.growthStage || 1);
      }
      if (object.type === OBJECT_TYPES.tree) {
        return;
      }
      if (object.type === OBJECT_TYPES.berryBush) {
        this.drawBerryBush(screenX, screenY, object.growthStage || (object.ready ? 3 : 1), object.ready === true);
      }
    });
  }

  renderForegroundObjects(tileMap, camera) {
    tileMap.forEachObject((object) => {
      if (object.type !== OBJECT_TYPES.tree) return;
      const screenX = Math.round(object.x * TILE_SIZE - camera.x);
      const screenY = Math.round(object.y * TILE_SIZE - camera.y);
      this.drawTree(screenX, screenY, object.growthStage || 3);
    });
  }

  renderForegroundBarriers(tileMap, camera, subjects = []) {
    tileMap.forEachObject((object) => {
      if (![OBJECT_TYPES.woodWall, OBJECT_TYPES.door, OBJECT_TYPES.fence, OBJECT_TYPES.gate].includes(object.type)) return;
      const shape = tileMap.getBarrierCollisionShape(object.x, object.y);
      if (!shape.horizontal) return;
      if (!this.shouldRenderBarrierForeground(object, shape, subjects)) return;
      const screenX = Math.round(object.x * TILE_SIZE - camera.x);
      const screenY = Math.round(object.y * TILE_SIZE - camera.y);
      this.drawBarrierForeground(screenX, screenY, object.type, object.open === true, shape);
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

  drawWoodWall(x, y, shape = null) {
    this.context.save();
    this.drawBarrierShape(x, y, shape, this.getBarrierPalette(OBJECT_TYPES.woodWall));
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

  drawFence(x, y, shape = null) {
    this.context.save();
    this.drawBarrierShape(x, y, shape, this.getBarrierPalette(OBJECT_TYPES.fence));
    this.context.restore();
  }

  drawGate(x, y, open = false, shape = null) {
    this.context.save();
    this.drawGateShape(x, y, shape, this.getBarrierPalette(OBJECT_TYPES.gate, open));
    this.context.restore();
  }

  drawDoor(x, y, open = false, shape = null) {
    this.context.save();
    this.drawBarrierShape(x, y, shape, this.getBarrierPalette(OBJECT_TYPES.door, open));
    this.context.restore();
  }

  getBarrierPalette(type, open = false) {
    if (type === OBJECT_TYPES.woodWall) {
      return {
        kind: 'wall',
        post: '#3a2418',
        main: '#7a4a2c',
        highlight: '#c08a53',
        accent: '#2e1d14',
        thickness: 10,
        capHeight: 26,
        height: 28,
        open: false
      };
    }
    if (type === OBJECT_TYPES.door) {
      return {
        kind: 'door',
        post: '#2e1d14',
        main: open ? '#9b6a3f' : '#6f4328',
        highlight: open ? '#d09a5c' : '#b87b45',
        accent: open ? '#d9ba73' : '#f0c96b',
        thickness: 9,
        capHeight: 22,
        height: 26,
        open
      };
    }
    if (type === OBJECT_TYPES.fence) {
      return {
        kind: 'fence',
        post: '#3a2418',
        main: '#9a6238',
        highlight: '#b77a43',
        accent: '#6a4126',
        thickness: 6,
        capHeight: 18,
        height: 16,
        open: false
      };
    }
    if (type === OBJECT_TYPES.gate) {
      return {
        kind: 'gate',
        post: '#3a2418',
        main: open ? '#8d633f' : '#a86d3f',
        highlight: open ? '#d19a5b' : '#d49458',
        accent: open ? '#4f8f3f' : '#6a4126',
        thickness: open ? 5 : 6,
        capHeight: 20,
        height: 17,
        open
      };
    }
    return this.getBarrierPalette(OBJECT_TYPES.fence, open);
  }

  drawBarrierShape(x, y, shape = null, palette) {
    const connections = shape?.connections || { up: false, down: false, left: false, right: false };
    const hasHorizontal = shape?.horizontal || connections.left || connections.right;
    const hasVertical = shape?.vertical || connections.up || connections.down;
    const single = !hasHorizontal && !hasVertical;
    const thickness = palette.thickness;
    const half = Math.floor(thickness / 2);
    const visualHeight = palette.height || palette.capHeight;
    const centerX = x + TILE_SIZE / 2;
    const centerY = y + TILE_SIZE / 2;
    const topY = centerY - visualHeight / 2;
    const skipCenterPost = hasHorizontal && (palette.kind === 'wall' || palette.kind === 'door');

    this.context.fillStyle = palette.post;
    if (!skipCenterPost) {
      this.context.fillRect(centerX - half - 1, topY, thickness + 2, visualHeight);
    }

    if (single || hasVertical) {
      this.context.fillStyle = palette.main;
      const top = connections.up ? y : centerY - palette.capHeight / 2;
      const bottom = connections.down ? y + TILE_SIZE : centerY + palette.capHeight / 2;
      this.context.fillRect(centerX - half, top, thickness, bottom - top);
      this.context.fillStyle = palette.highlight;
      this.context.fillRect(centerX - half + 1, top + 2, 2, Math.max(3, bottom - top - 4));
      if (palette.kind === 'wall' || palette.kind === 'door') {
        this.context.fillStyle = palette.accent;
        this.context.fillRect(centerX + half - 2, top + 3, 2, Math.max(3, bottom - top - 6));
      }
    }

    if (single || hasHorizontal) {
      this.context.fillStyle = palette.main;
      const left = connections.left ? x : centerX - palette.capHeight / 2;
      const right = connections.right ? x + TILE_SIZE : centerX + palette.capHeight / 2;
      const horizontalTop = palette.kind === 'wall' || palette.kind === 'door'
        ? centerY - visualHeight + 4
        : centerY - half - 5;
      const horizontalHeight = palette.kind === 'wall' || palette.kind === 'door'
        ? visualHeight
        : thickness;
      this.context.fillRect(left, horizontalTop, right - left, horizontalHeight);
      this.context.fillStyle = palette.highlight;
      this.context.fillRect(left + 2, horizontalTop + 3, Math.max(3, right - left - 4), 2);
      if (palette.kind === 'fence' || palette.kind === 'gate') {
        this.context.fillRect(left + 2, horizontalTop + 9, Math.max(3, right - left - 4), 2);
      } else {
        this.context.fillStyle = palette.accent;
        this.context.fillRect(left + 3, horizontalTop + 12, Math.max(3, right - left - 6), 2);
        this.context.fillRect(left + 3, horizontalTop + 20, Math.max(3, right - left - 6), 2);
      }
    }

    this.context.fillStyle = palette.accent;
    if (!skipCenterPost) {
      this.context.fillRect(centerX - 3, centerY - 3, 6, 6);
    }
    if (palette.open) {
      this.context.fillRect(centerX + 5, centerY - 10, 4, 16);
    }

    if (palette.kind === 'door') {
      this.context.fillStyle = palette.accent;
      this.context.fillRect(centerX + (palette.open ? 7 : 4), centerY - 1, 3, 3);
      this.context.fillStyle = '#2e1d14';
      if (!skipCenterPost) {
        this.context.fillRect(centerX - half - 2, topY + 3, 2, 6);
        this.context.fillRect(centerX - half - 2, topY + visualHeight - 9, 2, 6);
      }
    }

    if (palette.kind === 'gate') {
      this.context.fillStyle = '#2e1d14';
      this.context.fillRect(centerX - half - 2, centerY - 8, 2, 5);
      this.context.fillStyle = palette.accent;
      this.context.fillRect(centerX + 4, centerY - 1, 3, 3);
    }
  }

  drawGateShape(x, y, shape = null, palette) {
    const connections = shape?.connections || { up: false, down: false, left: false, right: false };
    const hasHorizontal = shape?.horizontal || connections.left || connections.right;
    const hasVertical = shape?.vertical || connections.up || connections.down;
    const single = !hasHorizontal && !hasVertical;
    const centerX = x + TILE_SIZE / 2;
    const centerY = y + TILE_SIZE / 2;
    const postSize = 6;

    this.context.fillStyle = palette.post;

    if (single || hasHorizontal) {
      const leftPostX = x + 4;
      const rightPostX = x + TILE_SIZE - 10;
      const top = centerY - 11;
      const railLeft = leftPostX + postSize;
      const railWidth = rightPostX - railLeft;
      this.context.fillRect(leftPostX, top - 3, postSize, 24);
      this.context.fillRect(rightPostX, top - 3, postSize, 24);
      this.context.fillStyle = palette.main;
      if (palette.open) {
        this.context.fillRect(leftPostX + 7, top + 2, 14, 5);
        this.context.fillRect(leftPostX + 7, top + 12, 14, 5);
        this.context.fillStyle = palette.highlight;
        this.context.fillRect(leftPostX + 9, top + 3, 9, 2);
      } else {
        this.context.fillRect(railLeft, top + 2, railWidth, 5);
        this.context.fillRect(railLeft, top + 12, railWidth, 5);
        this.context.fillStyle = palette.highlight;
        this.context.fillRect(railLeft + 1, top + 3, Math.max(3, railWidth - 2), 2);
        this.context.fillRect(railLeft + 3, top + 9, Math.max(3, railWidth - 6), 3);
      }
      if (connections.left) this.context.fillRect(x, centerY - 2, leftPostX - x, 4);
      if (connections.right) this.context.fillRect(rightPostX + postSize, centerY - 2, x + TILE_SIZE - rightPostX - postSize, 4);
      this.context.fillStyle = '#2e1d14';
      this.context.fillRect(leftPostX + postSize - 1, top + 1, 2, 5);
      this.context.fillStyle = palette.accent;
      this.context.fillRect(rightPostX - 4, centerY - 1, 3, 3);
    }

    if (single || hasVertical) {
      const topPostY = y + 4;
      const bottomPostY = y + TILE_SIZE - 10;
      const left = centerX - 8;
      const railTop = topPostY + postSize;
      const railHeight = bottomPostY - railTop;
      this.context.fillStyle = palette.post;
      this.context.fillRect(left, topPostY, 16, postSize);
      this.context.fillRect(left, bottomPostY, 16, postSize);
      this.context.fillStyle = palette.main;
      if (palette.open) {
        this.context.fillRect(centerX - 4, topPostY + 7, 5, 14);
        this.context.fillRect(centerX + 4, topPostY + 7, 5, 14);
      } else {
        this.context.fillRect(centerX - 7, railTop, 5, railHeight);
        this.context.fillRect(centerX + 3, railTop, 5, railHeight);
        this.context.fillStyle = palette.highlight;
        this.context.fillRect(centerX - 6, railTop + 1, 2, Math.max(3, railHeight - 2));
      }
      if (connections.up) this.context.fillRect(centerX - 2, y, 4, topPostY - y);
      if (connections.down) this.context.fillRect(centerX - 2, bottomPostY + postSize, 4, y + TILE_SIZE - bottomPostY - postSize);
      this.context.fillStyle = '#2e1d14';
      this.context.fillRect(centerX - 8, topPostY + postSize - 1, 5, 2);
      this.context.fillStyle = palette.accent;
      this.context.fillRect(centerX + 4, bottomPostY - 4, 3, 3);
    }
  }

  drawBarrierForeground(x, y, type, open = false, shape = null) {
    const profile = this.getBarrierRenderProfile(type, open);
    const palette = this.getBarrierPalette(type, open);
    const connections = shape?.connections || { left: false, right: false };
    const left = connections.left ? x : x + 4;
    const right = connections.right ? x + TILE_SIZE : x + TILE_SIZE - 4;
    const centerY = y + TILE_SIZE / 2;

    this.context.save();
    if (profile.kind === 'wall' || profile.kind === 'door') {
      const top = centerY - (palette.height || palette.capHeight) + 4;
      const height = palette.height || palette.capHeight;
      this.context.fillStyle = palette.main;
      this.context.fillRect(left, top, right - left, height);
      this.context.fillStyle = palette.highlight;
      this.context.fillRect(left + 2, top + 3, Math.max(3, right - left - 4), 2);
      this.context.fillStyle = palette.accent;
      this.context.fillRect(left + 3, top + 12, Math.max(3, right - left - 6), 2);
      this.context.fillRect(left + 3, top + 20, Math.max(3, right - left - 6), 2);
      if (profile.kind === 'door') {
        this.context.fillStyle = palette.accent;
        this.context.fillRect(x + TILE_SIZE / 2 + 4, centerY - 15, 3, 3);
      }
    } else if (profile.kind === 'fence' || profile.kind === 'gate') {
      this.context.fillStyle = palette.main;
      this.context.fillRect(left, centerY - 10, right - left, 3);
    }
    this.context.restore();
  }

  shouldRenderBarrierForeground(object, shape = null, subjects = []) {
    const connections = shape?.connections || { left: false, right: false };
    const worldLeft = (connections.left ? object.x : object.x + 0.12) * TILE_SIZE;
    const worldRight = (connections.right ? object.x + 1 : object.x + 0.88) * TILE_SIZE;
    const barrierY = object.y * TILE_SIZE + TILE_SIZE / 2;
    const margin = TILE_SIZE * 0.35;

    return subjects.some((subject) =>
      subject &&
      subject.x >= worldLeft - margin &&
      subject.x <= worldRight + margin &&
      subject.y < barrierY
    );
  }

  getBarrierRenderProfile(type, open = false) {
    if (type === OBJECT_TYPES.woodWall) {
      return { kind: 'wall', mass: 'solid', connectsWith: 'wall', openable: false, horizontalTopOffset: -8, foregroundLayer: true };
    }
    if (type === OBJECT_TYPES.door) {
      return { kind: 'door', mass: open ? 'open-solid' : 'solid', connectsWith: 'wall', openable: true, open, horizontalTopOffset: -6, foregroundLayer: true };
    }
    if (type === OBJECT_TYPES.fence) {
      return { kind: 'fence', mass: 'open', connectsWith: 'fence', openable: false, centerPost: true, sidePosts: false, foregroundLayer: true };
    }
    if (type === OBJECT_TYPES.gate) {
      return { kind: 'gate', mass: open ? 'open-light' : 'light', connectsWith: 'fence', openable: true, open, centerPost: false, sidePosts: true, foregroundLayer: true };
    }
    return { kind: 'object', mass: 'none', connectsWith: 'none', openable: false };
  }

  getBarrierVisualVariant(type, shape = null, open = false) {
    const connections = shape?.connections || { up: false, down: false, left: false, right: false };
    const connected = Object.entries(connections)
      .filter(([, value]) => value)
      .map(([name]) => name)
      .sort();
    return {
      type,
      open: open === true,
      kind: this.getBarrierRenderProfile(type, open).kind,
      orientation: shape?.horizontal && shape?.vertical
        ? 'junction'
        : shape?.horizontal
          ? 'horizontal'
          : shape?.vertical
            ? 'vertical'
            : 'single',
      connections: connected.join('|'),
      variant: shape?.variant || 'single'
    };
  }

  drawSapling(x, y, stage = 1) {
    this.context.save();
    const leafOffset = stage >= 2 ? -4 : 0;
    this.context.fillStyle = '#5b331c';
    this.context.fillRect(x + 15, y + 16 + leafOffset, 3, 10 - leafOffset);
    this.context.fillStyle = '#4f9e42';
    this.context.fillRect(x + 10, y + 11 + leafOffset, stage >= 2 ? 10 : 8, 6);
    this.context.fillRect(x + 17, y + 9 + leafOffset, stage >= 2 ? 9 : 7, 6);
    if (stage >= 2) {
      this.context.fillStyle = '#83c85e';
      this.context.fillRect(x + 8, y + 8, 5, 4);
      this.context.fillRect(x + 21, y + 5, 5, 4);
    }
    this.context.restore();
  }

  drawTree(x, y, stage = 3) {
    if (stage < 3) {
      this.drawSapling(x, y, 2);
      return;
    }

    this.context.save();
    this.context.fillStyle = 'rgba(0, 0, 0, 0.22)';
    this.context.fillRect(x + 6, y + 25, 20, 5);
    this.context.globalAlpha = 1;
    this.context.fillStyle = '#6b3f22';
    this.context.fillRect(x + 11, y - 24, 10, 53);
    this.context.fillStyle = '#8a5a35';
    this.context.fillRect(x + 15, y - 20, 3, 43);
    this.context.fillStyle = '#2f6f35';
    this.context.fillRect(x - 23, y - 45, 24, 15);
    this.context.fillRect(x + 4, y - 56, 27, 17);
    this.context.fillRect(x + 34, y - 43, 21, 15);
    this.context.fillRect(x - 9, y - 31, 20, 16);
    this.context.fillRect(x + 18, y - 32, 22, 16);
    this.context.fillStyle = '#4f9e42';
    this.context.fillRect(x - 12, y - 50, 18, 10);
    this.context.fillRect(x + 15, y - 52, 20, 11);
    this.context.fillRect(x + 3, y - 38, 18, 10);
    this.context.fillRect(x + 27, y - 37, 16, 9);
    this.context.fillStyle = '#83c85e';
    this.context.fillRect(x - 5, y - 45, 5, 3);
    this.context.fillRect(x + 23, y - 48, 5, 3);
    this.context.fillRect(x + 39, y - 39, 5, 3);
    this.context.restore();
  }

  getTreeRenderProfile() {
    return {
      trunkOpaque: true,
      crownOpaqueLeaves: true,
      crownHasLeafGaps: true
    };
  }

  drawBerryBush(x, y, stage = 3, ready = true) {
    this.context.save();
    this.context.fillStyle = '#2f6f35';
    this.context.fillRect(x + 7, y + (stage >= 2 ? 10 : 15), stage >= 2 ? 18 : 12, stage >= 2 ? 13 : 8);
    this.context.fillStyle = '#4f9e42';
    this.context.fillRect(x + 10, y + (stage >= 2 ? 8 : 13), stage >= 3 ? 14 : 9, stage >= 2 ? 9 : 6);
    if (stage >= 3 && ready) {
      this.context.fillStyle = '#bf3158';
      this.context.fillRect(x + 11, y + 14, 3, 3);
      this.context.fillRect(x + 19, y + 17, 3, 3);
      this.context.fillRect(x + 16, y + 11, 3, 3);
    }
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

    const bottomRows = new Map();
    tileMap.forEachTile((tile) => {
      if (tileMap.getTile(tile.x, tile.y + 1)) return;
      if (!bottomRows.has(tile.y)) bottomRows.set(tile.y, []);
      bottomRows.get(tile.y).push(tile.x);
    });

    for (const [rowY, xs] of bottomRows.entries()) {
      const sorted = [...xs].sort((a, b) => a - b);
      let runStart = sorted[0];
      let previous = sorted[0];
      const drawRun = (start, end) => {
        const x = Math.round(start * TILE_SIZE - camera.x);
        const y = Math.round(rowY * TILE_SIZE - camera.y);
        const width = (end - start + 1) * TILE_SIZE;
        this.context.fillRect(x + 3, y + TILE_SIZE + 14, width - 6, 8);
      };

      for (let index = 1; index < sorted.length; index += 1) {
        if (sorted[index] === previous + 1) {
          previous = sorted[index];
          continue;
        }
        drawRun(runStart, previous);
        runStart = sorted[index];
        previous = sorted[index];
      }
      drawRun(runStart, previous);
    }

    this.context.restore();
  }

  getIslandShadowRuns(tileMap) {
    const rows = new Map();
    tileMap.forEachTile((tile) => {
      if (tileMap.getTile(tile.x, tile.y + 1)) return;
      if (!rows.has(tile.y)) rows.set(tile.y, []);
      rows.get(tile.y).push(tile.x);
    });

    const runs = [];
    for (const [y, xs] of rows.entries()) {
      const sorted = [...xs].sort((a, b) => a - b);
      if (sorted.length === 0) continue;
      let start = sorted[0];
      let end = sorted[0];
      for (let index = 1; index < sorted.length; index += 1) {
        if (sorted[index] === end + 1) {
          end = sorted[index];
          continue;
        }
        runs.push({ y, start, end });
        start = sorted[index];
        end = sorted[index];
      }
      runs.push({ y, start, end });
    }
    return runs.sort((a, b) => a.y - b.y || a.start - b.start);
  }
}
