import {
  CRYSTAL_INTERACTION_DISTANCE,
  GAME_VIEW,
  PLAYER_FOOT_OFFSET,
  PLAYER_SIZE,
  PLAYER_SPAWN_TILE,
  TILE_SIZE
} from '../config/constants.js';
import { Input } from './input.js';
import { Camera } from './camera.js';
import { TileMap } from '../world/tile-map.js';
import { Player } from '../entities/player.js';
import { ResourceInventory } from '../systems/resource-inventory.js';
import { CrystalSystem } from '../systems/crystal-system.js';
import { RenderSystem } from '../systems/render-system.js';
import { BackgroundSystem } from '../systems/background-system.js';
import { Hud } from '../ui/hud.js';

export class Game {
  constructor(canvas, hudElement) {
    this.canvas = canvas;
    this.canvas.tabIndex = 0;
    this.context = canvas.getContext('2d');
    this.input = new Input();
    this.camera = new Camera();
    this.tileMap = new TileMap();
    this.inventory = new ResourceInventory();
    this.player = new Player(0, 0);
    this.respawnPlayer();
    this.crystalSystem = new CrystalSystem(this.inventory);
    this.backgroundSystem = new BackgroundSystem();
    this.renderSystem = new RenderSystem(this.context);
    this.hud = new Hud(hudElement);

    this.lastTimestamp = 0;
    this.running = false;
  }

  start() {
    this.resizeCanvas();
    this.canvas.focus?.({ preventScroll: true });
    this.canvas.addEventListener?.('pointerdown', () => this.canvas.focus?.({ preventScroll: true }));
    window.addEventListener('resize', () => this.resizeCanvas());
    this.running = true;
    requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  resizeCanvas() {
    this.canvas.width = GAME_VIEW.width;
    this.canvas.height = GAME_VIEW.height;
  }

  loop(timestamp) {
    if (!this.running) return;

    const deltaSeconds = Math.min((timestamp - this.lastTimestamp) / 1000 || 0, 0.05);
    this.lastTimestamp = timestamp;

    this.update(deltaSeconds);
    this.render();
    this.input.consumeFramePresses();

    requestAnimationFrame((nextTimestamp) => this.loop(nextTimestamp));
  }

  update(deltaSeconds) {
    this.player.update(deltaSeconds, this.input, this.tileMap);
    this.handleVoidFall();
    this.camera.centerOn(this.player.getCenterPosition());
    this.backgroundSystem.update(deltaSeconds);

    if (this.input.wasPressed(' ', 'e', 'Enter')) {
      this.tryUseCrystal();
    }

    if (this.input.wasPressed('b')) {
      this.tryPlaceEarth();
    }

    this.hud.update({
      inventory: this.inventory.resources,
      hint: this.crystalSystem.lastMessage,
      debug: this.getDebugState()
    });
  }

  tryUseCrystal() {
    const foot = this.player.getFootPosition();
    const isCloseToCrystal = this.tileMap.isNearCrystalWorld(
      foot.x,
      foot.y,
      CRYSTAL_INTERACTION_DISTANCE
    );

    if (isCloseToCrystal) {
      this.crystalSystem.use();
    }
  }

  tryPlaceEarth() {
    const placement = this.getEarthPlacementPreview();

    if (!placement.canPlace) {
      this.crystalSystem.lastMessage = placement.message;
      return false;
    }

    this.tileMap.setEarth(placement.x, placement.y);
    this.inventory.remove('earth', 1);
    this.crystalSystem.lastMessage = 'Erde platziert.';
    return true;
  }

  getEarthPlacementPreview() {
    const target = this.player.getFacingTile();
    const playerTile = this.player.getTilePosition();

    if (this.inventory.get('earth') <= 0) {
      return {
        ...target,
        canPlace: false,
        message: 'Nicht genug Erde.'
      };
    }

    if (target.x === playerTile.x && target.y === playerTile.y) {
      return {
        ...target,
        canPlace: false,
        message: 'Zielfeld ist blockiert.'
      };
    }

    if (this.tileMap.getTile(target.x, target.y)) {
      return {
        ...target,
        canPlace: false,
        message: 'Zielfeld ist blockiert.'
      };
    }

    if (!this.tileMap.hasNeighborGround(target.x, target.y)) {
      return {
        ...target,
        canPlace: false,
        message: 'Hier kann keine Erde platziert werden.'
      };
    }

    return {
      ...target,
      canPlace: true,
      message: 'Erde kann platziert werden.'
    };
  }

  handleVoidFall() {
    const foot = this.player.getFootPosition();

    if (this.tileMap.isVoidAtWorld(foot.x, foot.y) && this.tileMap.isPastVoidFallMarginWorld(foot.x, foot.y)) {
      this.respawnPlayer();
      this.crystalSystem.lastMessage = 'Du bist in den Void gefallen und beim Kristall respawnt.';
    }
  }

  respawnPlayer() {
    const spawnX = PLAYER_SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2;
    const spawnY = PLAYER_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET);
    this.player.setPosition(spawnX, spawnY);
    this.player.facing = { x: 0, y: -1 };
  }

  render() {
    this.backgroundSystem.render(this.context, this.camera);
    this.renderSystem.renderWorld(this.tileMap, this.camera);
    this.renderSystem.renderCrystal(this.tileMap, this.camera, performance.now());
    this.renderSystem.renderPlacementPreview(this.getEarthPlacementPreview(), this.camera);
    this.renderSystem.renderPlayer(this.player, this.camera);
  }

  getDebugState() {
    const input = this.input.getDebugState();

    return {
      playerX: this.player.x,
      playerY: this.player.y,
      cameraX: this.camera.x,
      cameraY: this.camera.y,
      movementKeys: input.movementKeys,
      lastKey: input.lastKey
    };
  }
}
