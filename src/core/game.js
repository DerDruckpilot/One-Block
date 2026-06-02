import {
  CRYSTAL_INTERACTION_DISTANCE,
  GAME_VIEW,
  HOTBAR_RESOURCES,
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
import { SaveSystem } from '../systems/save-system.js';
import { Hud } from '../ui/hud.js';
import { Hotbar } from '../ui/hotbar.js';

export class Game {
  constructor(canvas, hudElement, options = {}) {
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
    this.saveSystem = new SaveSystem(options.storage);
    this.hud = new Hud(hudElement);
    this.hotbar = new Hotbar(options.hotbarElement, (resource) => {
      this.selectHotbarResource(resource);
      this.saveGame();
    });

    this.lastTimestamp = 0;
    this.falling = false;
    this.debugEnabled = false;
    this.activeHotbarResource = 'earth';
    this.resetHoldSeconds = 0;
    this.autosaveSeconds = 0;
    this.saveStatus = 'new';
    this.running = false;
    this.loadGame();
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
    this.falling = false;
    this.player.update(deltaSeconds, this.input, this.tileMap);
    this.handleVoidFall();
    this.camera.centerOn(this.player.getCenterPosition());
    this.backgroundSystem.update(deltaSeconds);

    if (this.input.wasPressed(' ', 'e', 'Enter')) {
      this.tryUseCrystal();
    }

    this.handleHotbarSelection();

    if (this.input.wasPressed('b')) {
      this.tryPlaceEarth();
    }

    this.handleDebugToggle();
    const didReset = this.handleReset(deltaSeconds);
    if (!didReset) {
      this.handleAutosave(deltaSeconds);
    }

    this.hud.update({
      hint: this.crystalSystem.lastMessage,
      debug: this.getDebugState(),
      debugEnabled: this.debugEnabled,
      resetHoldSeconds: this.resetHoldSeconds
    });
    this.hotbar.update({
      inventory: this.inventory.resources,
      activeResource: this.activeHotbarResource
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
      this.saveGame();
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
    this.saveGame();
    return true;
  }

  getEarthPlacementPreview() {
    const target = this.player.getFacingTile();
    const playerTile = this.player.getTilePosition();

    if (this.activeHotbarResource !== 'earth') {
      return {
        ...target,
        canPlace: false,
        message: 'Dieses Item kann noch nicht platziert werden.'
      };
    }

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
    const support = this.tileMap.getSupportStateAtWorld(foot.x, foot.y);
    this.falling = !support.supported;

    if (this.falling) {
      this.respawnPlayer();
      this.crystalSystem.lastMessage = 'Du bist in den Void gefallen und beim Kristall respawnt.';
      this.saveGame();
    }
  }

  respawnPlayer() {
    const spawnX = PLAYER_SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2;
    const spawnY = PLAYER_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET);
    this.player.setPosition(spawnX, spawnY);
    this.player.facing = { x: 0, y: -1 };
  }

  handleDebugToggle() {
    if (this.input.wasPressed('p')) {
      this.debugEnabled = !this.debugEnabled;
    }
  }

  handleHotbarSelection() {
    for (let index = 0; index < HOTBAR_RESOURCES.length; index += 1) {
      if (this.input.wasPressed(String(index + 1))) {
        this.selectHotbarResource(HOTBAR_RESOURCES[index]);
        this.saveGame();
      }
    }
  }

  selectHotbarResource(resource) {
    if (!HOTBAR_RESOURCES.includes(resource)) return false;

    this.activeHotbarResource = resource;
    return true;
  }

  handleReset(deltaSeconds) {
    if (this.input.isDown('r')) {
      this.resetHoldSeconds += deltaSeconds;
      this.crystalSystem.lastMessage = 'Reset wird vorbereitet...';

      if (this.resetHoldSeconds >= 2) {
        this.resetGame();
        return true;
      }
      return false;
    }

    this.resetHoldSeconds = 0;
    return false;
  }

  resetGame() {
    this.saveSystem.clear();
    this.tileMap = new TileMap();
    this.inventory = new ResourceInventory();
    this.crystalSystem = new CrystalSystem(this.inventory);
    this.activeHotbarResource = 'earth';
    this.respawnPlayer();
    this.resetHoldSeconds = 0;
    this.autosaveSeconds = 0;
    this.saveStatus = 'new';
    this.crystalSystem.lastMessage = 'Speicherstand gelöscht. Neustart am Kristall.';
  }

  handleAutosave(deltaSeconds) {
    this.autosaveSeconds += deltaSeconds;

    if (this.autosaveSeconds >= 1) {
      this.saveGame();
      this.autosaveSeconds = 0;
    }
  }

  loadGame() {
    const save = this.saveSystem.load();
    if (!this.isValidSave(save)) {
      this.saveStatus = 'new';
      this.crystalSystem.lastMessage = 'Neues Spiel gestartet.';
      return false;
    }

    this.tileMap.loadTiles(save.tiles);

    this.inventory.load(save.resources);

    if (save.player && Number.isFinite(save.player.x) && Number.isFinite(save.player.y)) {
      this.player.setPosition(save.player.x, save.player.y);
      this.player.facing = save.player.facing || { x: 0, y: -1 };

      if (!this.tileMap.isPlayerSupported(this.player)) {
        this.respawnPlayer();
      }
    }

    this.selectHotbarResource(save.activeHotbarResource || 'earth');

    this.crystalSystem.lastMessage = 'Speicherstand geladen.';
    this.saveStatus = 'loaded';
    return true;
  }

  isValidSave(save) {
    return Boolean(
      save &&
      save.version === 1 &&
      Array.isArray(save.tiles) &&
      save.resources &&
      typeof save.resources === 'object'
    );
  }

  saveGame() {
    const saved = this.saveSystem.save({
      tiles: this.tileMap.toJSON(),
      resources: this.inventory.toJSON(),
      activeHotbarResource: this.activeHotbarResource,
      player: {
        x: this.player.x,
        y: this.player.y,
        facing: this.player.facing
      }
    });
    this.saveStatus = saved ? 'saved' : 'error';
    return saved;
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
    const foot = this.player.getFootPosition();
    const support = this.tileMap.getSupportStateAtWorld(foot.x, foot.y);

    return {
      playerX: this.player.x,
      playerY: this.player.y,
      cameraX: this.camera.x,
      cameraY: this.camera.y,
      supportTileX: support.tile.x,
      supportTileY: support.tile.y,
      supported: support.supported,
      inVoid: support.inVoid,
      falling: this.falling,
      movementKeys: input.movementKeys,
      lastKey: input.lastKey,
      saveStatus: this.saveStatus
    };
  }
}
