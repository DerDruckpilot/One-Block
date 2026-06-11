import { DROP_ANIMATION_SECONDS, OBJECT_TYPES, PLAYER_SIZE, TILE_SIZE, TILE_TYPES } from '../config/constants.js';
import { TerrainRenderer } from './terrain-renderer.js';
import { drawItemIcon, getLoadedItemIconImage } from '../ui/item-icons.js';
import {
  getBerryBushAssetPath,
  getLoadedWorldObjectImage,
  getTreeAssetSpec,
  preloadWorldObjectAssets
} from './world-object-assets.js';
import { getLoadedCrystalImage, preloadCrystalAssets } from './crystal-assets.js';

export class RenderSystem {
  constructor(context, terrainRenderer = new TerrainRenderer()) {
    this.context = context;
    this.terrainRenderer = terrainRenderer;
    preloadWorldObjectAssets();
    preloadCrystalAssets();
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

  renderCrystal(tileMap, camera, timeMs, level = 1, feedback = null) {
    const { x, y } = tileMap.crystal;
    const screenX = Math.round(x * TILE_SIZE - camera.x);
    const screenY = Math.round(y * TILE_SIZE - camera.y);
    const hover = Math.round(Math.sin(timeMs / 820) * 3);
    const pulse = (Math.sin(timeMs / 640) + 1) / 2;
    const feedbackStrength = this.getCrystalFeedbackStrength(feedback);
    const feedbackKind = feedback?.type === 'crystalHit' ? feedback.kind || 'activate' : null;

    this.terrainRenderer.drawTile(
      this.context,
      { x, y, type: TILE_TYPES.crystal },
      tileMap,
      screenX,
      screenY
    );

    const cx = screenX + TILE_SIZE / 2;
    const anchorY = screenY + TILE_SIZE + 4;
    const cy = screenY + TILE_SIZE / 2 - 18 + hover;
    const image = getLoadedCrystalImage();

    this.context.save();
    this.context.imageSmoothingEnabled = false;
    this.drawCrystalGlow(cx, cy, level, pulse, feedbackStrength, feedbackKind);
    this.drawCrystalParticles(cx, cy, timeMs, pulse);

    if (image && typeof this.context.drawImage === 'function') {
      const width = 64;
      const height = 96;
      this.context.drawImage(
        image,
        0,
        0,
        96,
        144,
        Math.round(cx - width / 2),
        Math.round(anchorY - height + hover),
        width,
        height
      );
    } else {
      this.drawCrystalFallback(cx, screenY, cy, level, pulse, hover);
    }

    this.drawCrystalParticles(cx, cy, timeMs + 900, pulse, true);
    this.context.restore();
  }

  getCrystalFeedbackStrength(feedback) {
    if (!feedback || feedback.type !== 'crystalHit' || !feedback.duration) return 0;
    return Math.max(0, Math.min(1, feedback.seconds / feedback.duration));
  }

  drawCrystalGlow(cx, cy, level, pulse, feedbackStrength, feedbackKind) {
    const baseAlpha = 0.14 + Math.min(0.1, level * 0.025) + pulse * 0.06;
    const flashAlpha = feedbackStrength * 0.34;
    const isAttack = feedbackKind === 'attack';
    const glowColor = isAttack ? '#ff4c62' : '#c776ff';
    const coreColor = isAttack ? '#ffd0d0' : '#fff0ff';
    const levelBoost = Math.max(0, level - 1) * 3;

    this.context.globalAlpha = baseAlpha + flashAlpha * 0.7;
    this.context.fillStyle = glowColor;
    this.context.fillRect(cx - 42 - levelBoost, cy - 43 - levelBoost, 84 + levelBoost * 2, 88 + levelBoost * 2);
    this.context.globalAlpha = 0.13 + pulse * 0.06 + flashAlpha;
    this.context.fillStyle = coreColor;
    this.context.fillRect(cx - 26 - levelBoost, cy - 33 - levelBoost, 52 + levelBoost * 2, 66 + levelBoost * 2);
    this.context.globalAlpha = 1;
  }

  drawCrystalParticles(cx, cy, timeMs, pulse, foreground = false) {
    const count = foreground ? 5 : 8;
    for (let i = 0; i < count; i += 1) {
      const speed = foreground ? 980 : 1250;
      const angle = timeMs / speed + i * 1.38;
      const radiusX = foreground ? 26 : 36;
      const radiusY = foreground ? 18 : 28;
      const px = Math.round(cx + Math.cos(angle) * (radiusX + (i % 3) * 3));
      const py = Math.round(cy + Math.sin(angle * 1.45) * radiusY + Math.sin(timeMs / 700 + i) * 3);
      const size = i % 4 === 0 ? 3 : 2;

      this.context.globalAlpha = foreground ? 0.52 + pulse * 0.25 : 0.28 + pulse * 0.18;
      this.context.fillStyle = i % 3 === 0 ? '#fff3ff' : '#d892ff';
      this.context.fillRect(px, py, size, size);
      if (i % 4 === 0) {
        this.context.globalAlpha *= 0.65;
        this.context.fillRect(px - 1, py + 1, size + 2, 1);
      }
    }
    this.context.globalAlpha = 1;
  }

  drawCrystalFallback(cx, screenY, cy, level, pulse, hover) {
    const legacyPulse = pulse * 4 - 2;

    this.context.save();
    this.context.fillStyle = '#31251f';
    this.context.fillRect(cx - 14, screenY + 19, 28, 7);
    this.context.fillStyle = '#6d6358';
    this.context.fillRect(cx - 12, screenY + 16, 24, 7);
    this.context.fillStyle = '#8a8173';
    this.context.fillRect(cx - 9, screenY + 15, 18, 3);
    this.context.fillStyle = '#d78cff';
    this.context.fillRect(cx - 4, screenY + 17, 8, 2);

    const levelGlow = Math.max(0, level - 1) * 3;
    this.context.globalAlpha = 0.28 + Math.min(0.18, level * 0.04);
    this.context.fillStyle = level >= 3 ? '#ff8cff' : level >= 2 ? '#b58cff' : '#d974ff';
    this.context.fillRect(cx - 17 - legacyPulse - levelGlow, cy - 19 - legacyPulse - levelGlow, 34 + legacyPulse * 2 + levelGlow * 2, 34 + legacyPulse * 2 + levelGlow * 2);
    this.context.globalAlpha = 1;

    this.context.fillStyle = '#341b78';
    this.context.fillRect(cx - 7, cy - 17 + hover, 14, 29);
    this.context.fillRect(cx - 10, cy - 10 + hover, 20, 15);
    this.context.fillStyle = '#6b2cd4';
    this.context.fillRect(cx - 5, cy - 15 + hover, 10, 27);
    this.context.fillStyle = '#a044ff';
    this.context.fillRect(cx - 9, cy - 8 + hover, 8, 15);
    this.context.fillRect(cx + 2, cy - 9 + hover, 7, 14);
    this.context.fillStyle = '#e9b7ff';
    this.context.fillRect(cx - 3, cy - 16 + hover, 5, 10);
    this.context.fillRect(cx - 5, cy - 5 + hover, 3, 5);
    this.context.fillStyle = '#ffffff';
    this.context.fillRect(cx - 1, cy - 15 + hover, 2, 6);
    this.context.fillStyle = '#c657ff';
    this.context.fillRect(cx - 15, cy - 4 + hover, 4, 7);
    this.context.fillRect(cx + 12, cy - 1 + hover, 4, 6);
    this.context.fillRect(cx - 20, cy + 7 + hover, 3, 3);
    this.context.fillRect(cx + 18, cy + 8 + hover, 3, 3);
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
      if (object.type === OBJECT_TYPES.bed) {
        this.drawBed(screenX, screenY);
      }
      if (object.type === OBJECT_TYPES.chickenNest) {
        this.drawChickenNest(screenX, screenY);
      }
      if (object.type === OBJECT_TYPES.feedTrough) {
        this.drawFeedTrough(screenX, screenY, object.feed || 0);
      }
      if (object.type === OBJECT_TYPES.waterTrough) {
        this.drawWaterTrough(screenX, screenY, object.filled === true);
      }
      if (object.type === OBJECT_TYPES.furnace) {
        this.drawFurnace(screenX, screenY);
      }
      if (object.type === OBJECT_TYPES.woodWall) {
        const renderState = tileMap.getWallDoorRenderState(object.x, object.y);
        this.drawWoodWall(screenX, screenY, renderState);
      }
      if (object.type === OBJECT_TYPES.door) {
        const renderState = tileMap.getWallDoorRenderState(object.x, object.y);
        this.drawDoor(screenX, screenY, renderState?.open === true, renderState);
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
        this.drawSapling(screenX, screenY, object.growthStage || 1, object.x, object.y);
      }
      if (object.type === OBJECT_TYPES.tree) {
        return;
      }
      if (object.type === OBJECT_TYPES.berryBush) {
        this.drawBerryBush(screenX, screenY, object.growthStage || (object.ready ? 3 : 1), object.ready === true, object.x, object.y);
      }
    });
  }

  renderForegroundObjects(tileMap, camera) {
    tileMap.forEachObject((object) => {
      if (object.type !== OBJECT_TYPES.tree) return;
      const screenX = Math.round(object.x * TILE_SIZE - camera.x);
      const screenY = Math.round(object.y * TILE_SIZE - camera.y);
      this.drawTree(screenX, screenY, object.growthStage || 3, object.x, object.y);
    });
  }

  renderForegroundBarriers(tileMap, camera, subjects = []) {
    tileMap.forEachObject((object) => {
      if (![OBJECT_TYPES.woodWall, OBJECT_TYPES.door].includes(object.type)) return;
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
      this.context.fillRect(x - 11, Math.round(drop.y - camera.y) + 9, 22, 5);
      if (getLoadedItemIconImage(drop.resource)) {
        drawItemIcon(this.context, drop.resource, x, y - 4, 28);
      } else {
        this.context.fillStyle = '#f7d979';
        this.context.fillRect(x - 6, y - 8, 12, 12);
        drawItemIcon(this.context, drop.resource, x, y - 2, 16);
      }
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
      const progress = feedback.duration ? 1 - feedback.seconds / feedback.duration : 0;
      const isAttack = feedback.kind === 'attack';
      this.context.globalAlpha = 0.72 - progress * 0.28;
      this.context.fillStyle = isAttack ? '#ffd1d1' : '#ffffff';
      this.context.fillRect(x - 12, y - 12, 24, 4);
      this.context.fillRect(x - 2, y - 22, 4, 24);
      this.context.fillStyle = isAttack ? '#ff4c62' : '#d87cff';
      this.context.fillRect(x - 18, y - 2, 36, 4);
    }
    this.context.restore();
  }

  renderPlayer(player, camera) {
    const x = Math.round(player.x - camera.x);
    const y = Math.round(player.y - camera.y);

    this.context.save();
    if (player.hitFlashSeconds > 0) {
      this.context.globalAlpha = 0.55 + Math.sin(player.hitFlashSeconds * 70) * 0.25;
    }
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

  drawBed(x, y) {
    this.context.save();
    this.context.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.context.fillRect(x + 4, y + 23, 24, 5);
    this.context.fillStyle = '#4a2d1d';
    this.context.fillRect(x + 4, y + 9, 24, 18);
    this.context.fillStyle = '#8a5a35';
    this.context.fillRect(x + 6, y + 11, 20, 14);
    this.context.fillStyle = '#d9c7ff';
    this.context.fillRect(x + 8, y + 12, 16, 5);
    this.context.fillStyle = '#7b4b8f';
    this.context.fillRect(x + 8, y + 17, 16, 7);
    this.context.fillStyle = '#2e1d14';
    this.context.fillRect(x + 4, y + 8, 4, 21);
    this.context.fillRect(x + 24, y + 8, 4, 21);
    this.context.restore();
  }

  drawChickenNest(x, y) {
    this.context.save();
    this.context.fillStyle = 'rgba(0, 0, 0, 0.16)';
    this.context.fillRect(x + 7, y + 23, 18, 4);
    this.context.fillStyle = '#5d3a20';
    this.context.fillRect(x + 8, y + 17, 16, 8);
    this.context.fillStyle = '#9b6a3f';
    this.context.fillRect(x + 6, y + 14, 20, 5);
    this.context.fillStyle = '#c49355';
    this.context.fillRect(x + 9, y + 12, 5, 3);
    this.context.fillRect(x + 18, y + 13, 5, 3);
    this.context.fillStyle = '#fff0c8';
    this.context.fillRect(x + 13, y + 17, 6, 5);
    this.context.fillStyle = '#d8b878';
    this.context.fillRect(x + 15, y + 16, 2, 1);
    this.context.restore();
  }

  drawFeedTrough(x, y, feed = 0) {
    this.context.save();
    this.context.fillStyle = 'rgba(0, 0, 0, 0.18)';
    this.context.fillRect(x + 5, y + 23, 22, 5);
    this.context.fillStyle = '#3a2418';
    this.context.fillRect(x + 5, y + 15, 22, 10);
    this.context.fillStyle = '#8a5a35';
    this.context.fillRect(x + 7, y + 16, 18, 7);
    this.context.fillStyle = feed > 0 ? '#c9a35e' : '#4d2f1e';
    this.context.fillRect(x + 9, y + 17, 14, 3);
    this.context.fillStyle = '#2e1d14';
    this.context.fillRect(x + 6, y + 24, 3, 5);
    this.context.fillRect(x + 23, y + 24, 3, 5);
    this.context.restore();
  }

  drawWaterTrough(x, y, filled = false) {
    this.context.save();
    this.context.fillStyle = 'rgba(0, 0, 0, 0.18)';
    this.context.fillRect(x + 5, y + 23, 22, 5);
    this.context.fillStyle = '#4b3a32';
    this.context.fillRect(x + 5, y + 14, 22, 11);
    this.context.fillStyle = '#8d7568';
    this.context.fillRect(x + 7, y + 16, 18, 7);
    this.context.fillStyle = filled ? '#4eb3d8' : '#4f3b30';
    this.context.fillRect(x + 9, y + 17, 14, 4);
    if (filled) {
      this.context.fillStyle = '#b9f7ff';
      this.context.fillRect(x + 11, y + 18, 5, 1);
    }
    this.context.restore();
  }

  drawFurnace(x, y) {
    this.context.save();
    this.context.fillStyle = 'rgba(0, 0, 0, 0.22)';
    this.context.fillRect(x + 5, y + 25, 22, 5);
    this.context.fillStyle = '#3b302a';
    this.context.fillRect(x + 7, y + 11, 18, 17);
    this.context.fillStyle = '#8d7568';
    this.context.fillRect(x + 8, y + 8, 16, 7);
    this.context.fillStyle = '#b39a88';
    this.context.fillRect(x + 10, y + 9, 12, 3);
    this.context.fillStyle = '#1f1714';
    this.context.fillRect(x + 11, y + 17, 10, 8);
    this.context.fillStyle = '#e07a2f';
    this.context.fillRect(x + 13, y + 20, 6, 4);
    this.context.fillStyle = '#ffce60';
    this.context.fillRect(x + 15, y + 18, 2, 5);
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
    if (palette.kind === 'wall' || palette.kind === 'door') {
      this.drawWallDoorShape(x, y, shape, palette);
      return;
    }

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
    const joint = this.getBarrierJointProfile(shape, palette);
    const horizontalTop = palette.kind === 'wall' || palette.kind === 'door'
      ? centerY - visualHeight + 4
      : centerY - half - 5;
    const horizontalHeight = palette.kind === 'wall' || palette.kind === 'door'
      ? visualHeight
      : thickness;

    this.context.fillStyle = palette.post;
    if (!skipCenterPost) {
      this.context.fillRect(centerX - half - 1, topY, thickness + 2, visualHeight);
    }

    if (single || hasVertical) {
      this.context.fillStyle = palette.main;
      const verticalSegments = joint.splitSegments
        ? [
            connections.up ? { top: y, bottom: horizontalTop + 2 } : null,
            connections.down ? { top: horizontalTop + horizontalHeight - 2, bottom: y + TILE_SIZE } : null
          ].filter(Boolean)
        : [{
            top: connections.up ? y : centerY - palette.capHeight / 2,
            bottom: connections.down ? y + TILE_SIZE : centerY + palette.capHeight / 2
          }];

      for (const segment of verticalSegments) {
        if (segment.bottom <= segment.top) continue;
        this.context.fillStyle = palette.main;
        this.context.fillRect(centerX - half, segment.top, thickness, segment.bottom - segment.top);
        this.context.fillStyle = palette.highlight;
        this.context.fillRect(centerX - half + 1, segment.top + 2, 2, Math.max(3, segment.bottom - segment.top - 4));
        if (palette.kind === 'wall' || palette.kind === 'door') {
          this.context.fillStyle = palette.accent;
          this.context.fillRect(centerX + half - 2, segment.top + 3, 2, Math.max(3, segment.bottom - segment.top - 6));
        }
      }
    }

    if (single || hasHorizontal) {
      this.context.fillStyle = palette.main;
      const left = connections.left ? x : centerX - palette.capHeight / 2;
      const right = connections.right ? x + TILE_SIZE : centerX + palette.capHeight / 2;
      const horizontalSegments = joint.splitSegments
        ? [
            connections.left ? { left, right: centerX + half } : null,
            connections.right ? { left: centerX - half, right } : null
          ].filter(Boolean)
        : [{ left, right }];

      for (const segment of horizontalSegments) {
        if (segment.right <= segment.left) continue;
        this.context.fillStyle = palette.main;
        this.context.fillRect(segment.left, horizontalTop, segment.right - segment.left, horizontalHeight);
        this.context.fillStyle = palette.highlight;
        this.context.fillRect(segment.left + 2, horizontalTop + 3, Math.max(3, segment.right - segment.left - 4), 2);
        if (palette.kind === 'fence' || palette.kind === 'gate') {
          this.context.fillRect(segment.left + 2, horizontalTop + 9, Math.max(3, segment.right - segment.left - 4), 2);
        } else {
          this.context.fillStyle = palette.accent;
          this.context.fillRect(segment.left + 3, horizontalTop + 12, Math.max(3, segment.right - segment.left - 6), 2);
          this.context.fillRect(segment.left + 3, horizontalTop + 20, Math.max(3, segment.right - segment.left - 6), 2);
        }
      }
    }

    if (joint.splitSegments) {
      this.context.fillStyle = palette.main;
      this.context.fillRect(centerX - half, horizontalTop, thickness, horizontalHeight);
      this.context.fillStyle = palette.highlight;
      this.context.fillRect(centerX - half + 1, horizontalTop + 3, 2, Math.max(3, horizontalHeight - 6));
      if (palette.kind === 'wall' || palette.kind === 'door') {
        this.context.fillStyle = palette.accent;
        this.context.fillRect(centerX + half - 2, horizontalTop + 4, 2, Math.max(3, horizontalHeight - 8));
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

  drawWallDoorShape(x, y, shape = null, palette) {
    const plan = this.getWallDoorRenderPlan(shape, palette);
    const { variant, segments, visualHeight, centerX, centerY, verticalLeft } = plan;
    const drawSolidRect = (left, top, width, height) => {
      if (width <= 0 || height <= 0) return;
      this.context.fillStyle = palette.main;
      this.context.fillRect(left, top, width, height);
      this.context.fillStyle = palette.highlight;
      this.context.fillRect(left + 2, top + 3, Math.max(2, width - 4), 2);
      this.context.fillStyle = palette.accent;
      if (width >= height) {
        this.context.fillRect(left + 3, top + 12, Math.max(2, width - 6), 2);
        this.context.fillRect(left + 3, top + 20, Math.max(2, width - 6), 2);
      } else {
        this.context.fillRect(left + width - 3, top + 3, 2, Math.max(2, height - 6));
      }
    };

    for (const segment of segments) {
      drawSolidRect(x + segment.left, y + segment.top, segment.width, segment.height);
    }

    if (palette.kind === 'door') {
      this.context.fillStyle = palette.open ? '#d9ba73' : '#f0c96b';
      const knobX = variant === 'vertical' || variant === 'single' || variant.startsWith('end-up') || variant.startsWith('end-down')
        ? centerX + 4
        : centerX + (palette.open ? 7 : 4);
      this.context.fillRect(x + knobX, y + centerY - 1, 3, 3);
      this.context.fillStyle = '#2e1d14';
      if (variant === 'single' || variant === 'vertical') {
        this.context.fillRect(x + verticalLeft - 2, y + centerY - visualHeight / 2 + 3, 2, 6);
        this.context.fillRect(x + verticalLeft - 2, y + centerY + visualHeight / 2 - 9, 2, 6);
      }
      if (palette.open) {
        this.context.fillStyle = palette.accent;
        this.context.fillRect(x + centerX + 5, y + centerY - 10, 4, 16);
      }
    }
  }

  getWallDoorRenderPlan(shape = null, palette) {
    const connections = shape?.connections || { up: false, down: false, left: false, right: false };
    const variant = shape?.variant || this.getCanonicalBarrierVariant(connections);
    const thickness = palette.thickness;
    const half = Math.floor(thickness / 2);
    const visualHeight = palette.height || palette.capHeight;
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    const horizontalTop = centerY - visualHeight + 4;
    const horizontalBottom = horizontalTop + visualHeight;
    const verticalLeft = centerX - half;
    const segments = [];
    const hasHorizontal = connections.left || connections.right;
    const hasVertical = connections.up || connections.down;

    if (!hasHorizontal && !hasVertical) {
      segments.push({ left: verticalLeft - 1, top: centerY - visualHeight / 2, width: thickness + 2, height: visualHeight });
    } else if (hasVertical && !hasHorizontal) {
      const top = connections.up ? 0 : centerY - visualHeight / 2;
      const bottom = connections.down ? TILE_SIZE : centerY + visualHeight / 2;
      segments.push({ left: verticalLeft, top, width: thickness, height: bottom - top });
    } else {
      if (connections.left) {
        segments.push({ left: 0, top: horizontalTop, width: centerX - half, height: visualHeight });
      }
      if (connections.right) {
        segments.push({ left: centerX + half, top: horizontalTop, width: TILE_SIZE - (centerX + half), height: visualHeight });
      }
      if (connections.up) {
        segments.push({ left: verticalLeft, top: 0, width: thickness, height: Math.max(0, horizontalTop) });
      }
      if (connections.down) {
        segments.push({ left: verticalLeft, top: horizontalBottom, width: thickness, height: Math.max(0, TILE_SIZE - horizontalBottom) });
      }
      segments.push({ left: verticalLeft, top: horizontalTop, width: thickness, height: visualHeight });
    }

    return {
      final: true,
      variant,
      connections,
      segments: segments.filter((segment) => segment.width > 0 && segment.height > 0),
      visualHeight,
      centerX,
      centerY,
      verticalLeft
    };
  }

  getBarrierJointProfile(shape = null, palette) {
    const connections = shape?.connections || { up: false, down: false, left: false, right: false };
    const hasHorizontal = shape?.horizontal || connections.left || connections.right;
    const hasVertical = shape?.vertical || connections.up || connections.down;
    const connectedCount = Object.values(connections).filter(Boolean).length;
    const usesSolidJoin = palette.kind === 'fence';

    return {
      splitSegments: usesSolidJoin && hasHorizontal && hasVertical,
      joint: hasHorizontal && hasVertical,
      connectedCount,
      variant: shape?.variant || 'single'
    };
  }

  getCanonicalBarrierVariant(connections = { up: false, down: false, left: false, right: false }) {
    const connected = ['up', 'right', 'down', 'left'].filter((name) => connections[name]);
    if (connected.length === 0) return 'single';
    if (connected.length === 4) return 'cross';
    if (connected.length === 3) return `tee-${['up', 'right', 'down', 'left'].find((name) => !connections[name])}`;
    if (connected.length === 2) {
      if (connections.left && connections.right) return 'horizontal';
      if (connections.up && connections.down) return 'vertical';
      const vertical = connections.up ? 'up' : 'down';
      const horizontal = connections.left ? 'left' : 'right';
      return `corner-${vertical}-${horizontal}`;
    }
    return `end-${connected[0]}`;
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
    const overlappingSubjects = subjects.filter((subject) =>
      subject &&
      subject.x >= worldLeft - margin &&
      subject.x <= worldRight + margin
    );
    const hasFrontSubject = overlappingSubjects.some((subject) => subject.y >= barrierY);
    if (hasFrontSubject) return false;

    return overlappingSubjects.some((subject) => subject.y < barrierY);
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
    const palette = this.getBarrierPalette(type, open);
    const joint = this.getBarrierJointProfile(shape, palette);
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
      variant: this.getCanonicalBarrierVariant(connections),
      splitSegments: joint.splitSegments,
      finalPlan: palette.kind === 'wall' || palette.kind === 'door'
    };
  }

  drawWorldObjectAsset(path, x, y, width, height, anchorX = 0.5, anchorY = 1) {
    const image = getLoadedWorldObjectImage(path);
    if (!image || typeof this.context.drawImage !== 'function') return false;

    const left = Math.round(x + TILE_SIZE / 2 - width * anchorX);
    const top = Math.round(y + TILE_SIZE - height * anchorY);

    this.context.save();
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(image, left, top, width, height);
    this.context.restore();
    return true;
  }

  drawSapling(x, y, stage = 1, tileX = 0, tileY = 0) {
    const tree = getTreeAssetSpec(stage, tileX, tileY);
    if (this.drawWorldObjectAsset(tree.path, x, y, tree.width, tree.height)) return;

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

  drawTree(x, y, stage = 3, tileX = 0, tileY = 0) {
    if (stage < 3) {
      this.drawSapling(x, y, 2, tileX, tileY);
      return;
    }

    const tree = getTreeAssetSpec(stage, tileX, tileY);
    if (this.drawWorldObjectAsset(tree.path, x, y, tree.width, tree.height)) return;

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

  drawBerryBush(x, y, stage = 3, ready = true, tileX = 0, tileY = 0) {
    const path = getBerryBushAssetPath(stage, ready, tileX, tileY);
    const size = stage <= 1 ? 32 : stage === 2 ? 36 : 40;
    if (this.drawWorldObjectAsset(path, x, y, size, size)) return;

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
    this.context.globalCompositeOperation = 'destination-out';

    tileMap.forEachObject((object) => {
      if (object.type !== OBJECT_TYPES.torch && object.type !== OBJECT_TYPES.campfire) return;
      const radius = object.type === OBJECT_TYPES.campfire ? 78 : 48;
      const x = object.x * TILE_SIZE + TILE_SIZE / 2 - camera.x;
      const y = object.y * TILE_SIZE + TILE_SIZE / 2 - camera.y;
      const gradient = this.context.createRadialGradient?.(x, y, radius * 0.18, x, y, radius);
      if (gradient) {
        gradient.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.86, darkness + 0.18)})`);
        gradient.addColorStop(0.62, `rgba(255, 255, 255, ${Math.min(0.5, darkness * 0.62)})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.context.fillStyle = gradient;
        this.context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      } else if (this.context.beginPath && this.context.arc && this.context.fill) {
        this.context.fillStyle = `rgba(255, 255, 255, ${Math.min(0.65, darkness)})`;
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI * 2);
        this.context.fill();
      } else {
        this.context.fillStyle = `rgba(255, 255, 255, ${Math.min(0.65, darkness)})`;
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
