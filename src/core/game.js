import { GAME_VIEW, TOOLS } from '../config/constants.js';
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
    this.player = new Player(0, 48);
    this.crystalSystem = new CrystalSystem(this.inventory);
    this.backgroundSystem = new BackgroundSystem();
    this.renderSystem = new RenderSystem(this.context);
    this.hud = new Hud(hudElement);

    this.selectedTool = 'fist';
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
    this.handleToolSelection();
    this.player.update(deltaSeconds, this.input, this.tileMap);
    this.camera.follow(this.player);
    this.backgroundSystem.update(deltaSeconds);

    if (this.input.wasPressed(' ', 'e', 'Enter')) {
      this.tryUseCrystal();
    }

    if (this.input.wasPressed('b')) {
      this.tryPlaceEarth();
    }

    this.hud.update({
      selectedTool: TOOLS[this.selectedTool],
      inventory: this.inventory.resources,
      hint: this.crystalSystem.lastMessage
    });
  }

  handleToolSelection() {
    if (this.input.wasPressed('1')) this.selectedTool = 'fist';
    if (this.input.wasPressed('2')) this.selectedTool = 'woodPickaxe';
    if (this.input.wasPressed('3')) this.selectedTool = 'spear';
  }

  tryUseCrystal() {
    const playerTile = this.player.getFacingTile();
    const isFacingCrystal = this.tileMap.isCrystal(playerTile.x, playerTile.y);
    const isCloseToCrystal = this.tileMap.isAdjacentToCrystal(this.player.getTilePosition());

    if (isFacingCrystal || isCloseToCrystal) {
      this.crystalSystem.use(this.selectedTool);
    }
  }

  tryPlaceEarth() {
    const target = this.player.getFacingTile();

    if (this.inventory.get('earth') <= 0) {
      this.crystalSystem.lastMessage = 'Keine Erde im Inventar.';
      return;
    }

    if (this.tileMap.canPlaceEarth(target.x, target.y)) {
      this.tileMap.setEarth(target.x, target.y);
      this.inventory.remove('earth', 1);
      this.crystalSystem.lastMessage = 'Erdblock platziert.';
    } else {
      this.crystalSystem.lastMessage = 'Hier kann kein Erdblock platziert werden.';
    }
  }

  render() {
    this.backgroundSystem.render(this.context, this.camera);
    this.renderSystem.renderWorld(this.tileMap, this.camera);
    this.renderSystem.renderCrystal(this.tileMap, this.camera, performance.now());
    this.renderSystem.renderPlayer(this.player, this.camera);
  }
}
