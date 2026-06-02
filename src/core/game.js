import { GAME_VIEW, PLAYER_SIZE, TILE_SIZE } from '../config/constants.js';
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
    this.context = canvas.getContext('2d');
    this.input = new Input();
    this.camera = new Camera();
    this.tileMap = new TileMap();
    this.inventory = new ResourceInventory();
    this.player = new Player(
      TILE_SIZE / 2 - PLAYER_SIZE / 2,
      TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - 10)
    );
    this.crystalSystem = new CrystalSystem(this.inventory);
    this.backgroundSystem = new BackgroundSystem();
    this.renderSystem = new RenderSystem(this.context);
    this.hud = new Hud(hudElement);

    this.lastTimestamp = 0;
    this.running = false;
  }

  start() {
    this.resizeCanvas();
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
    this.camera.follow(this.player);
    this.backgroundSystem.update(deltaSeconds);

    if (this.input.wasPressed(' ', 'e', 'Enter')) {
      this.tryUseCrystal();
    }

    this.hud.update({
      inventory: this.inventory.resources,
      hint: this.crystalSystem.lastMessage
    });
  }

  tryUseCrystal() {
    const playerTile = this.player.getFacingTile();
    const isFacingCrystal = this.tileMap.isCrystal(playerTile.x, playerTile.y);
    const isCloseToCrystal = this.tileMap.isAdjacentToCrystal(this.player.getTilePosition());

    if (isFacingCrystal || isCloseToCrystal) {
      this.crystalSystem.use();
    }
  }

  render() {
    this.backgroundSystem.render(this.context, this.camera);
    this.renderSystem.renderWorld(this.tileMap, this.camera);
    this.renderSystem.renderCrystal(this.tileMap, this.camera, performance.now());
    this.renderSystem.renderPlayer(this.player, this.camera);
  }
}
