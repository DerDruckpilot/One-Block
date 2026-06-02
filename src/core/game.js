import {
  CRYSTAL_INTERACTION_DISTANCE,
  GAME_VIEW,
  HOTBAR_RESOURCES,
  OBJECT_TYPES,
  PLAYER_FOOT_OFFSET,
  PLAYER_SIZE,
  PLAYER_SPAWN_TILE,
  TILE_SIZE,
  WORKBENCH_INTERACTION_DISTANCE
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
import { CraftingSystem } from '../systems/crafting-system.js';
import { Hud } from '../ui/hud.js';
import { Hotbar } from '../ui/hotbar.js';
import { MenuPanels } from '../ui/menu-panels.js';
import { PointerHitboxSystem } from '../ui/pointer-hitboxes.js';

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
    this.craftingSystem = new CraftingSystem(this.inventory);
    this.backgroundSystem = new BackgroundSystem();
    this.renderSystem = new RenderSystem(this.context);
    this.saveSystem = new SaveSystem(options.storage);
    this.hud = new Hud(hudElement);
    this.hotbar = new Hotbar(options.hotbarElement);
    this.menuPanels = new MenuPanels({
      craftingPanel: options.craftingPanel,
      inventoryPanel: options.inventoryPanel
    });
    this.inventoryButton = options.inventoryButton;
    this.craftingButton = options.craftingButton;
    this.pointerHitboxes = new PointerHitboxSystem({
      canvas,
      craftingButton: options.craftingButton,
      craftingPanel: options.craftingPanel,
      getCraftingOpen: () => this.craftingOpen,
      getInventoryOpen: () => this.inventoryOpen,
      hotbarElement: options.hotbarElement,
      inventoryButton: options.inventoryButton,
      inventoryPanel: options.inventoryPanel,
      onBlockedCraft: () => {
        this.crystalSystem.lastMessage = 'Nicht genug Material.';
      },
      onCraft: (recipeId) => this.tryCraft(recipeId),
      onCraftingToggle: () => this.toggleCraftingMenu(),
      onHotbarSelect: (resource) => this.selectAndSaveHotbarResource(resource),
      onInventoryToggle: () => this.toggleInventoryMenu(),
      pointerTarget: options.pointerTarget
    });

    this.lastTimestamp = 0;
    this.falling = false;
    this.debugEnabled = false;
    this.activeHotbarResource = 'earth';
    this.inventoryOpen = false;
    this.craftingOpen = false;
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
    this.handleMenuToggles();

    if (this.input.wasPressed('b')) {
      this.tryPlaceSelectedItem();
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
    this.menuPanels.update({
      craftingOpen: this.craftingOpen,
      hasWorkbenchAccess: this.hasWorkbenchAccess(),
      inventory: this.inventory,
      inventoryOpen: this.inventoryOpen,
      recipeStates: this.craftingSystem.getRecipeStates({
        hasWorkbenchAccess: this.hasWorkbenchAccess()
      })
    });
    this.updateMenuButtonStates();
    this.pointerHitboxes.updateHitboxes();
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
    return this.tryPlaceSelectedItem();
  }

  tryPlaceSelectedItem() {
    const placement = this.getPlacementPreview();

    if (!placement.canPlace) {
      this.crystalSystem.lastMessage = placement.message;
      return false;
    }

    if (this.activeHotbarResource === 'earth') {
      this.tileMap.setEarth(placement.x, placement.y);
      this.inventory.remove('earth', 1);
      this.crystalSystem.lastMessage = 'Erde platziert.';
    }

    if (this.activeHotbarResource === OBJECT_TYPES.workbench) {
      this.tileMap.setWorkbench(placement.x, placement.y);
      this.inventory.remove(OBJECT_TYPES.workbench, 1);
      this.crystalSystem.lastMessage = 'Werkbank platziert.';
      if (this.inventory.get(OBJECT_TYPES.workbench) <= 0) {
        this.selectHotbarResource('earth');
      }
    }

    if (this.activeHotbarResource === 'grassSeed') {
      this.tileMap.setGrass(placement.x, placement.y);
      this.inventory.remove('grassSeed', 1);
      this.crystalSystem.lastMessage = 'Grassamen gepflanzt.';
    }

    this.saveGame();
    return true;
  }

  getEarthPlacementPreview() {
    return this.getPlacementPreview();
  }

  getPlacementPreview() {
    const target = this.player.getFacingTile();
    const playerTile = this.player.getTilePosition();

    if (this.activeHotbarResource === OBJECT_TYPES.workbench) {
      return this.getWorkbenchPlacementPreview(target, playerTile);
    }

    if (this.activeHotbarResource === 'grassSeed') {
      return this.getGrassSeedPlacementPreview(target);
    }

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

  getWorkbenchPlacementPreview(target = this.player.getFacingTile(), playerTile = this.player.getTilePosition()) {
    if (this.inventory.get(OBJECT_TYPES.workbench) <= 0) {
      return {
        ...target,
        canPlace: false,
        message: 'Nicht genug Werkbank.'
      };
    }

    if (target.x === playerTile.x && target.y === playerTile.y) {
      return {
        ...target,
        canPlace: false,
        message: 'Zielfeld ist blockiert.'
      };
    }

    if (!this.tileMap.isGround(target.x, target.y)) {
      return {
        ...target,
        canPlace: false,
        message: 'Werkbank braucht ein vorhandenes Tile.'
      };
    }

    if (this.tileMap.isCrystal(target.x, target.y)) {
      return {
        ...target,
        canPlace: false,
        message: 'Nicht auf dem Kristall.'
      };
    }

    if (this.tileMap.getObject(target.x, target.y)) {
      return {
        ...target,
        canPlace: false,
        message: 'Zielfeld ist bereits belegt.'
      };
    }

    return {
      ...target,
      canPlace: true,
      message: 'Werkbank kann platziert werden.'
    };
  }

  getGrassSeedPlacementPreview(target = this.player.getFacingTile()) {
    if (this.inventory.get('grassSeed') <= 0) {
      return {
        ...target,
        canPlace: false,
        message: 'Nicht genug Grassamen.'
      };
    }

    if (this.tileMap.isCrystal(target.x, target.y)) {
      return {
        ...target,
        canPlace: false,
        message: 'Nicht auf dem Kristall.'
      };
    }

    if (this.tileMap.isGrass(target.x, target.y)) {
      return {
        ...target,
        canPlace: false,
        message: 'Tile ist bereits begrünt.'
      };
    }

    if (!this.tileMap.isPlantableEarth(target.x, target.y)) {
      return {
        ...target,
        canPlace: false,
        message: 'Grassamen brauchen Erde.'
      };
    }

    return {
      ...target,
      canPlace: true,
      message: 'Grassamen können gepflanzt werden.'
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

  handleMenuToggles() {
    if (this.input.wasPressed('i')) {
      this.toggleInventoryMenu();
    }

    if (this.input.wasPressed('c')) {
      this.toggleCraftingMenu();
    }
  }

  toggleInventoryMenu() {
    this.inventoryOpen = !this.inventoryOpen;
    if (this.inventoryOpen) {
      this.craftingOpen = false;
    }
  }

  toggleCraftingMenu() {
    this.craftingOpen = !this.craftingOpen;
    if (this.craftingOpen) {
      this.inventoryOpen = false;
    }
  }

  tryCraft(recipeId) {
    const result = this.craftingSystem.craft(recipeId, {
      hasWorkbenchAccess: this.hasWorkbenchAccess()
    });
    this.crystalSystem.lastMessage = result.message;
    if (result.crafted) {
      this.saveGame();
    }
    return result.crafted;
  }

  tryCraftWorkbench() {
    return this.tryCraft('workbench');
  }

  hasWorkbenchAccess() {
    const foot = this.player.getFootPosition();
    return this.tileMap.isNearObjectWorld(
      foot.x,
      foot.y,
      OBJECT_TYPES.workbench,
      WORKBENCH_INTERACTION_DISTANCE
    );
  }

  selectHotbarResource(resource) {
    if (!HOTBAR_RESOURCES.includes(resource)) return false;

    this.activeHotbarResource = resource;
    return true;
  }

  selectAndSaveHotbarResource(resource) {
    const selected = this.selectHotbarResource(resource);
    if (selected) {
      this.saveGame();
    }
    return selected;
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
    this.craftingSystem = new CraftingSystem(this.inventory);
    this.activeHotbarResource = 'earth';
    this.inventoryOpen = false;
    this.craftingOpen = false;
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
    this.tileMap.loadObjects(save.objects);

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
      objects: this.tileMap.objectsToJSON(),
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
    this.renderSystem.renderObjects(this.tileMap, this.camera);
    this.renderSystem.renderPlacementPreview(this.getPlacementPreview(), this.camera);
    this.renderSystem.renderPlayer(this.player, this.camera);
  }

  updateMenuButtonStates() {
    this.inventoryButton?.classList?.toggle('is-active', this.inventoryOpen);
    this.craftingButton?.classList?.toggle('is-active', this.craftingOpen);
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
