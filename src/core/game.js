import {
  ATTACK_FEEDBACK_SECONDS,
  CRYSTAL_INTERACTION_DISTANCE,
  DEFAULT_HOTBAR_SLOTS,
  GAME_VIEW,
  HOTBAR_SLOT_COUNT,
  INVENTORY_RESOURCES,
  OBJECT_TYPES,
  PICKAXE_RESOURCE_DROPS,
  PLAYER_FOOT_OFFSET,
  PLAYER_SIZE,
  PLAYER_SPAWN_TILE,
  RESOURCE_LABELS,
  TILE_SIZE,
  WORKBENCH_INTERACTION_DISTANCE
} from '../config/constants.js';
import { Input } from './input.js';
import { TouchInput } from './touch-input.js';
import { Camera } from './camera.js';
import { TileMap } from '../world/tile-map.js';
import { Player } from '../entities/player.js';
import { ResourceInventory } from '../systems/resource-inventory.js';
import { chooseWeightedDrop, CrystalSystem } from '../systems/crystal-system.js';
import { RenderSystem } from '../systems/render-system.js';
import { BackgroundSystem } from '../systems/background-system.js';
import { SaveSystem } from '../systems/save-system.js';
import { CraftingSystem } from '../systems/crafting-system.js';
import { DayNightSystem } from '../systems/day-night-system.js';
import { DropSystem } from '../systems/drop-system.js';
import { EnemySystem } from '../systems/enemy-system.js';
import { AnimalSystem } from '../systems/animal-system.js';
import { FlyingEnemySystem } from '../systems/flying-enemy-system.js';
import { ProjectileSystem } from '../systems/projectile-system.js';
import { LogSystem } from '../systems/log-system.js';
import { Hud } from '../ui/hud.js';
import { Hotbar } from '../ui/hotbar.js';
import { MenuPanels } from '../ui/menu-panels.js';
import { PointerHitboxSystem } from '../ui/pointer-hitboxes.js';

const PLACEABLE_OBJECT_ITEMS = new Set([
  OBJECT_TYPES.workbench,
  OBJECT_TYPES.torch,
  OBJECT_TYPES.campfire,
  OBJECT_TYPES.woodWall,
  OBJECT_TYPES.table,
  OBJECT_TYPES.chair
]);

export class Game {
  constructor(canvas, hudElement, options = {}) {
    this.canvas = canvas;
    this.canvas.tabIndex = 0;
    this.context = canvas.getContext('2d');
    this.input = new Input();
    this.touchInput = new TouchInput({
      actionButton: options.actionButton,
      attackButton: options.attackButton,
      joystickElement: options.joystickElement,
      joystickKnobElement: options.joystickKnobElement,
      pointerTarget: options.pointerTarget
    });
    this.camera = new Camera();
    this.tileMap = new TileMap();
    this.inventory = new ResourceInventory();
    this.player = new Player(0, 0);
    this.respawnPlayer();
    this.crystalSystem = new CrystalSystem(this.inventory);
    this.craftingSystem = new CraftingSystem(this.inventory);
    this.dropSystem = new DropSystem();
    this.dayNightSystem = new DayNightSystem();
    this.enemySystem = new EnemySystem();
    this.animalSystem = new AnimalSystem();
    this.flyingEnemySystem = new FlyingEnemySystem();
    this.projectileSystem = new ProjectileSystem();
    this.logSystem = new LogSystem();
    this.backgroundSystem = new BackgroundSystem();
    this.renderSystem = new RenderSystem(this.context);
    this.saveSystem = new SaveSystem(options.storage);
    this.hud = new Hud(hudElement);
    this.hotbar = new Hotbar(options.hotbarElement);
    this.touchControlsElement = options.touchControlsElement;
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
        this.setLog('Nicht genug Material.');
      },
      onCraft: (recipeId) => this.tryCraft(recipeId),
      onCraftSelect: (recipeId) => this.menuPanels.selectCraftingRecipe(recipeId),
      onCraftingToggle: () => this.toggleCraftingMenu(),
      onHotbarSelect: (slotIndex) => this.handleHotbarSlotClick(slotIndex),
      onInventoryItemSelect: (resource) => this.selectInventoryResource(resource),
      onInventoryTabSelect: (tabId) => this.menuPanels.selectInventoryTab(tabId),
      onInventoryToggle: () => this.toggleInventoryMenu(),
      pointerTarget: options.pointerTarget
    });

    this.lastTimestamp = 0;
    this.falling = false;
    this.debugEnabled = false;
    this.hotbarSlots = [...DEFAULT_HOTBAR_SLOTS];
    this.activeHotbarSlot = 0;
    this.selectedInventoryResource = null;
    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.craftingContext = 'normal';
    this.resetHoldSeconds = 0;
    this.autosaveSeconds = 0;
    this.saveStatus = 'new';
    this.attackFeedback = null;
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
    const pixelRatio = Math.max(1, Math.min(globalThis.devicePixelRatio || 1, 3));
    this.canvas.dataset.logicalWidth = String(GAME_VIEW.width);
    this.canvas.dataset.logicalHeight = String(GAME_VIEW.height);
    this.canvas.width = Math.round(GAME_VIEW.width * pixelRatio);
    this.canvas.height = Math.round(GAME_VIEW.height * pixelRatio);
    this.context.setTransform?.(pixelRatio, 0, 0, pixelRatio, 0, 0);
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
    const wasPaused = this.isGamePaused();
    this.handleMenuToggles();
    this.handleDebugToggle();

    const paused = this.isGamePaused();
    const gameplayPaused = wasPaused || paused;
    this.touchInput.setEnabled(!paused);
    this.input.setVirtualMovement(gameplayPaused ? { x: 0, y: 0 } : this.touchInput.getMovementVector());

    if (!gameplayPaused) {
      this.player.update(deltaSeconds, this.input, this.tileMap);
      this.handleVoidFall();
      this.camera.centerOn(this.player.getCenterPosition());
      this.backgroundSystem.update(deltaSeconds);
      this.handleEnemyEvents(this.enemySystem.update(deltaSeconds, this.tileMap, this.player));
      this.handleAnimalEvents(this.animalSystem.update(deltaSeconds, this.tileMap));
      this.flyingEnemySystem.update(deltaSeconds, this.tileMap, this.player);
      this.handleProjectileEvents(this.projectileSystem.update(deltaSeconds, this.enemySystem, this.flyingEnemySystem));
      this.handleDropCollections(this.dropSystem.update(deltaSeconds, this.player, this.inventory, this.tileMap));
      this.dayNightSystem.update(deltaSeconds);
      this.updateAttackFeedback(deltaSeconds);

      if (this.input.wasPressed(' ', 'e', 'Enter')) {
        this.tryContextAction();
      }

      this.handleHotbarSelection();

      if (this.input.wasPressed('b')) {
        this.tryPlaceSelectedItem();
      }

      if (this.input.wasPressed('f')) {
        this.tryAttackAction();
      }

      this.handleTouchActions();
      const didReset = this.handleReset(deltaSeconds);
      if (!didReset) {
        this.handleAutosave(deltaSeconds);
      }
    } else {
      this.resetHoldSeconds = 0;
      this.touchInput.consumeFramePresses();
    }

    this.hud.update({
      hint: this.crystalSystem.lastMessage,
      logs: this.logSystem.toJSON(),
      debug: this.getDebugState(),
      debugEnabled: this.debugEnabled,
      resetHoldSeconds: this.resetHoldSeconds
    });
    this.hotbar.update({
      inventory: this.inventory.resources,
      activeSlot: this.activeHotbarSlot,
      slots: this.hotbarSlots
    });
    this.menuPanels.update({
      craftingOpen: this.craftingOpen,
      craftingContext: this.craftingContext,
      activeHotbarSlot: this.activeHotbarSlot,
      hasWorkbenchAccess: this.hasWorkbenchAccess(),
      hotbarSlots: this.hotbarSlots,
      inventory: this.inventory,
      inventoryOpen: this.inventoryOpen,
      recipeStates: this.craftingSystem.getRecipeStates({
        craftingContext: this.craftingContext,
        hasWorkbenchAccess: this.craftingContext === 'workbench' ? this.hasWorkbenchAccess() : false
      }),
      selectedInventoryResource: this.selectedInventoryResource
    });
    this.updateMenuButtonStates();
    this.updateInteractiveUiState();
    this.pointerHitboxes.updateHitboxes();
  }

  tryUseCrystal() {
    if (this.isGamePaused()) return false;

    const foot = this.player.getFootPosition();
    const isCloseToCrystal = this.tileMap.isNearCrystalWorld(
      foot.x,
      foot.y,
      CRYSTAL_INTERACTION_DISTANCE
    );

    if (isCloseToCrystal) {
      const drop = this.rollCrystalDrop();
      this.spawnVisibleDrop(drop, `Kristall wirft ${RESOURCE_LABELS[drop.resource]} aus.`);
      const animalSpawn = this.animalSystem.maybeSpawn(
        this.tileMap,
        this.crystalSystem.hitCounter % 5 === 0 ? 1 : 0
      );
      if (animalSpawn.spawned && animalSpawn.message) {
        this.setLog(animalSpawn.message);
      }
      this.saveGame();
      return true;
    }

    return false;
  }

  isNearCrystal() {
    const foot = this.player.getFootPosition();
    return this.tileMap.isNearCrystalWorld(
      foot.x,
      foot.y,
      CRYSTAL_INTERACTION_DISTANCE
    );
  }

  tryContextAction() {
    if (this.isGamePaused()) return false;

    const placement = this.getPlacementPreview();
    if (placement.canPlace) {
      return this.tryPlaceSelectedItem();
    }

    if (this.hasWorkbenchAccess()) {
      return this.openWorkbenchCrafting();
    }

    if (this.isNearCrystal()) {
      this.tryUseCrystal();
      return true;
    }

    this.setLog('Keine Aktion möglich.');
    return false;
  }

  tryAttackAction() {
    if (this.isGamePaused()) return false;

    const activeItem = this.getActiveHotbarItem();

    if (activeItem === 'woodenPickaxe' && this.inventory.get('woodenPickaxe') > 0) {
      return this.usePickaxeAttack();
    }

    if (activeItem === 'woodenSpear' && this.inventory.get('woodenSpear') > 0) {
      return this.useSpearAttack();
    }

    if (activeItem === 'slingshot' && this.inventory.get('slingshot') > 0) {
      return this.useRangedAttack({
        ammo: 'stoneBall',
        projectileType: 'stoneBall',
        noAmmoMessage: 'Keine Steinkugeln.',
        shotMessage: 'Steinkugel geschossen.'
      });
    }

    if (activeItem === 'bow' && this.inventory.get('bow') > 0) {
      return this.useRangedAttack({
        ammo: 'arrow',
        projectileType: 'arrow',
        noAmmoMessage: 'Keine Pfeile.',
        shotMessage: 'Pfeil geschossen.'
      });
    }

    this.setLog('Keine Waffe ausgewählt.');
    return false;
  }

  usePickaxeAttack() {
    if (!this.isNearCrystal()) {
      this.setLog('Kein Ziel für Spitzhacke.');
      return false;
    }

    this.setCrystalHitFeedback();
    this.setLog('Du schlägst Splitter aus dem Kristall.');
    const drop = this.rollCrystalDrop(PICKAXE_RESOURCE_DROPS);
    this.spawnVisibleDrop(drop, `${RESOURCE_LABELS[drop.resource]} splittert heraus.`);
    this.saveGame();
    return true;
  }

  useSpearAttack() {
    this.setSpearAttackFeedback();
    const hit = this.enemySystem.attackWithSpear(this.player);
    if (hit.hit) {
      this.setLog(hit.message);
      this.saveGame();
      return true;
    }

    if (this.isNearCrystal()) {
      const spawn = this.enemySystem.spawnNearCrystal(this.tileMap);
      this.setLog(spawn.message);
      if (spawn.spawned) {
        this.saveGame();
      }
      return spawn.spawned;
    }

    this.setLog('Kein Ziel.');
    return false;
  }

  useRangedAttack({ ammo, projectileType, noAmmoMessage, shotMessage }) {
    if (this.inventory.get(ammo) <= 0) {
      this.setLog(noAmmoMessage);
      return false;
    }

    if (this.isNearCrystal()) {
      const spawn = this.flyingEnemySystem.spawnNearCrystal(this.tileMap);
      this.setLog(spawn.message);
      if (spawn.spawned) {
        this.saveGame();
      }
      return spawn.spawned;
    }

    const origin = this.player.getFootPosition();
    this.projectileSystem.spawn({
      type: projectileType,
      x: origin.x,
      y: origin.y - 10,
      direction: this.player.facing || { x: 0, y: -1 }
    });
    this.inventory.remove(ammo, 1);
    this.setLog(shotMessage);
    this.saveGame();
    return true;
  }

  handleTouchActions() {
    if (this.touchInput.consumeActionPress()) {
      this.tryContextAction();
    }

    if (this.touchInput.consumeAttackPress()) {
      this.tryAttackAction();
    }
  }

  setLog(message) {
    this.logSystem.add(message);
    this.crystalSystem.lastMessage = this.logSystem.latest(message);
  }

  rollCrystalDrop(dropTable = undefined) {
    this.crystalSystem.hitCounter += 1;
    const randomValue = this.crystalSystem.random();
    return dropTable ? chooseWeightedDrop(dropTable, randomValue) : chooseWeightedDrop(randomValue);
  }

  spawnVisibleDrop(drop, message) {
    const visibleDrop = this.dropSystem.spawnFromCrystal(drop, this.tileMap);
    if (!visibleDrop) {
      this.inventory.add(drop.resource, drop.amount);
      this.setLog(`${RESOURCE_LABELS[drop.resource]} eingesammelt.`);
      return false;
    }

    this.setLog(message);
    return true;
  }

  handleDropCollections(collections) {
    for (const collection of collections) {
      this.setLog(collection.message);
      this.saveGame();
    }
  }

  handleEnemyEvents(events) {
    for (const event of events) {
      if (event.type === 'void') {
        this.spawnEnemyLoot(event.tile, event.enemy);
        this.setLog('Kreatur verschwindet im Void.');
        this.saveGame();
      }
    }
  }

  handleAnimalEvents(events) {
    for (const event of events) {
      if (event.type === 'void') {
        this.setLog('Ein Huhn verschwindet im Void.');
        this.saveGame();
      }
    }
  }

  handleProjectileEvents(events) {
    for (const event of events) {
      const source = { x: event.projectile.x, y: event.projectile.y };
      if (event.targetType === 'ground') {
        const hit = this.enemySystem.applyDamage(event.target, event.projectile.damage, source);
        if (hit.defeated) {
          this.spawnEnemyLoot(event.target.lastGroundTile, event.target);
        }
        this.setLog(hit.message);
        this.saveGame();
      }

      if (event.targetType === 'flying') {
        const hit = this.flyingEnemySystem.applyDamage(event.target, event.projectile.damage, source);
        if (hit.defeated) {
          this.dropSystem.spawnNearWorld({ resource: 'fiber', amount: 1 }, this.tileMap, event.target.x, event.target.y);
        }
        this.setLog(hit.message);
        this.saveGame();
      }
    }
  }

  spawnEnemyLoot(tile, enemy) {
    const center = enemy?.getCenterPosition?.() || this.tileMap.getCrystalCenter();
    if (tile) {
      this.dropSystem.spawnAtTile({ resource: 'stone', amount: 1 }, tile);
      return;
    }
    this.dropSystem.spawnNearWorld({ resource: 'stone', amount: 1 }, this.tileMap, center.x, center.y);
  }

  setSpearAttackFeedback() {
    const foot = this.player.getFootPosition();
    this.attackFeedback = {
      type: 'spear',
      x: foot.x,
      y: foot.y,
      facing: { ...this.player.facing },
      seconds: ATTACK_FEEDBACK_SECONDS,
      duration: ATTACK_FEEDBACK_SECONDS
    };
  }

  setCrystalHitFeedback() {
    const center = this.tileMap.getCrystalCenter();
    this.attackFeedback = {
      type: 'crystalHit',
      x: center.x,
      y: center.y,
      seconds: ATTACK_FEEDBACK_SECONDS,
      duration: ATTACK_FEEDBACK_SECONDS
    };
  }

  updateAttackFeedback(deltaSeconds) {
    if (!this.attackFeedback) return;
    this.attackFeedback.seconds = Math.max(0, this.attackFeedback.seconds - deltaSeconds);
    if (this.attackFeedback.seconds <= 0) {
      this.attackFeedback = null;
    }
  }

  tryPlaceEarth() {
    return this.tryPlaceSelectedItem();
  }

  tryPlaceSelectedItem() {
    if (this.isGamePaused()) return false;

    const placement = this.getPlacementPreview();

    if (!placement.canPlace) {
      this.setLog(placement.message);
      return false;
    }

    const activeItem = this.getActiveHotbarItem();

    if (activeItem === 'earth') {
      this.tileMap.setEarth(placement.x, placement.y);
      this.inventory.remove('earth', 1);
      this.setLog('Erde platziert.');
    }

    if (activeItem === 'stone') {
      this.tileMap.setStone(placement.x, placement.y);
      this.inventory.remove('stone', 1);
      this.setLog('Stein platziert.');
    }

    if (PLACEABLE_OBJECT_ITEMS.has(activeItem)) {
      this.tileMap.setObject(placement.x, placement.y, activeItem);
      this.inventory.remove(activeItem, 1);
      this.setLog(`${RESOURCE_LABELS[activeItem]} platziert.`);
    }

    if (activeItem === 'grassSeed') {
      this.tileMap.setGrass(placement.x, placement.y);
      this.inventory.remove('grassSeed', 1);
      this.setLog('Grassamen gepflanzt.');
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
    const activeItem = this.getActiveHotbarItem();

    if (!activeItem) {
      return {
        ...target,
        canPlace: false,
        message: 'Kein Item ausgewählt.'
      };
    }

    if (PLACEABLE_OBJECT_ITEMS.has(activeItem)) {
      return this.getObjectPlacementPreview(activeItem, target, playerTile);
    }

    if (activeItem === 'grassSeed') {
      return this.getGrassSeedPlacementPreview(target);
    }

    if (activeItem === 'earth' || activeItem === 'stone') {
      return this.getFloorTilePlacementPreview(activeItem, target, playerTile);
    }

    return {
      ...target,
      canPlace: false,
      message: 'Dieses Item kann noch nicht platziert werden.'
    };
  }

  getFloorTilePlacementPreview(resource, target = this.player.getFacingTile(), playerTile = this.player.getTilePosition()) {
    const label = RESOURCE_LABELS[resource];
    const noPlacementLabel = resource === 'earth' ? 'keine Erde' : `kein ${label}`;

    if (this.inventory.get(resource) <= 0) {
      return {
        ...target,
        canPlace: false,
        message: `Nicht genug ${label}.`
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
        message: `Hier kann ${noPlacementLabel} platziert werden.`
      };
    }

    return {
      ...target,
      canPlace: true,
      message: `${label} kann platziert werden.`
    };
  }

  getWorkbenchPlacementPreview(target = this.player.getFacingTile(), playerTile = this.player.getTilePosition()) {
    return this.getObjectPlacementPreview(OBJECT_TYPES.workbench, target, playerTile);
  }

  getObjectPlacementPreview(resource, target = this.player.getFacingTile(), playerTile = this.player.getTilePosition()) {
    if (this.inventory.get(resource) <= 0) {
      return {
        ...target,
        canPlace: false,
        message: 'Nicht genug Material.'
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
        message: 'Hier kann das nicht platziert werden.'
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
      message: `${RESOURCE_LABELS[resource]} kann platziert werden.`
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
      this.setLog('Du bist in den Void gefallen und beim Kristall respawnt.');
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
    for (let index = 0; index < HOTBAR_SLOT_COUNT; index += 1) {
      if (this.input.wasPressed(String(index + 1))) {
        this.selectHotbarSlot(index);
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

  isMenuOpen() {
    return this.inventoryOpen || this.craftingOpen;
  }

  isGamePaused() {
    return this.isMenuOpen();
  }

  toggleInventoryMenu() {
    this.inventoryOpen = !this.inventoryOpen;
    if (this.inventoryOpen) {
      this.craftingOpen = false;
    } else {
      this.selectedInventoryResource = null;
    }
  }

  toggleCraftingMenu() {
    if (this.craftingOpen && this.craftingContext === 'normal') {
      this.craftingOpen = false;
      return;
    }

    this.openNormalCrafting();
  }

  openNormalCrafting() {
    this.craftingContext = 'normal';
    this.craftingOpen = true;
    this.inventoryOpen = false;
    this.selectedInventoryResource = null;
    this.menuPanels.selectCraftingRecipe('workbench');
    return true;
  }

  openWorkbenchCrafting() {
    if (!this.hasWorkbenchAccess()) {
      this.setLog('Keine Werkbank in Reichweite.');
      return false;
    }

    this.craftingContext = 'workbench';
    this.craftingOpen = true;
    this.inventoryOpen = false;
    this.selectedInventoryResource = null;
    this.menuPanels.selectCraftingRecipe('woodenPickaxe');
    this.setLog('Werkbank geöffnet.');
    return true;
  }

  tryCraft(recipeId) {
    const result = this.craftingSystem.craft(recipeId, {
      craftingContext: this.craftingContext,
      hasWorkbenchAccess: this.hasWorkbenchAccess()
    });
    this.setLog(result.message);
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

  getActiveHotbarItem() {
    return this.hotbarSlots[this.activeHotbarSlot] || null;
  }

  selectHotbarSlot(slotIndex) {
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= HOTBAR_SLOT_COUNT) return false;

    this.activeHotbarSlot = slotIndex;
    return true;
  }

  selectHotbarResource(resource) {
    if (!this.isKnownInventoryResource(resource)) return false;

    const existingIndex = this.hotbarSlots.indexOf(resource);
    if (existingIndex >= 0) {
      this.activeHotbarSlot = existingIndex;
      return true;
    }

    this.hotbarSlots[this.activeHotbarSlot] = resource;
    return true;
  }

  handleHotbarSlotClick(slotIndex) {
    if (!this.selectHotbarSlot(slotIndex)) return false;

    if (this.selectedInventoryResource) {
      this.hotbarSlots[slotIndex] = this.selectedInventoryResource;
      this.setLog(`${RESOURCE_LABELS[this.selectedInventoryResource]} in Hotbar-Slot ${slotIndex + 1}.`);
    }

    this.saveGame();
    return true;
  }

  selectInventoryResource(resource) {
    if (!this.isKnownInventoryResource(resource)) return false;

    this.selectedInventoryResource = resource;
    this.setLog(`${RESOURCE_LABELS[resource]} für Hotbar ausgewählt.`);
    return true;
  }

  isKnownInventoryResource(resource) {
    return INVENTORY_RESOURCES.includes(resource);
  }

  handleReset(deltaSeconds) {
    if (this.input.isDown('r')) {
      this.resetHoldSeconds += deltaSeconds;
      this.setLog('Reset wird vorbereitet...');

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
    this.dropSystem = new DropSystem();
    this.dayNightSystem = new DayNightSystem();
    this.animalSystem = new AnimalSystem();
    this.flyingEnemySystem = new FlyingEnemySystem();
    this.projectileSystem = new ProjectileSystem();
    this.hotbarSlots = [...DEFAULT_HOTBAR_SLOTS];
    this.activeHotbarSlot = 0;
    this.selectedInventoryResource = null;
    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.craftingContext = 'normal';
    this.respawnPlayer();
    this.resetHoldSeconds = 0;
    this.autosaveSeconds = 0;
    this.saveStatus = 'new';
    this.enemySystem.clear();
    this.animalSystem.clear();
    this.flyingEnemySystem.clear();
    this.projectileSystem.clear();
    this.dropSystem.clear();
    this.dayNightSystem.reset();
    this.attackFeedback = null;
    this.logSystem.reset('Speicherstand gelöscht. Neustart am Kristall.');
    this.crystalSystem.lastMessage = this.logSystem.latest();
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
      this.logSystem.reset('Neues Spiel gestartet.');
      this.crystalSystem.lastMessage = this.logSystem.latest();
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

    this.loadHotbarState(save);
    this.logSystem.load(save.logs);
    this.enemySystem.load(save.enemies, this.tileMap);
    this.animalSystem.load(save.animals, this.tileMap);
    this.flyingEnemySystem.load(save.flyingEnemies, this.tileMap);
    this.projectileSystem.clear();
    this.dropSystem.load(save.drops, this.tileMap);
    this.dayNightSystem.load(save.dayNightTime);

    this.setLog('Speicherstand geladen.');
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
      enemies: this.enemySystem.toJSON(),
      animals: this.animalSystem.toJSON(),
      flyingEnemies: this.flyingEnemySystem.toJSON(),
      drops: this.dropSystem.toJSON(),
      dayNightTime: this.dayNightSystem.toJSON(),
      logs: this.logSystem.toJSON(),
      hotbarSlots: [...this.hotbarSlots],
      activeHotbarSlot: this.activeHotbarSlot,
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
    this.renderSystem.renderDrops(this.dropSystem.drops, this.camera);
    this.renderSystem.renderAnimals(this.animalSystem.animals, this.camera);
    this.renderSystem.renderEnemies(this.enemySystem.enemies, this.camera);
    this.renderSystem.renderFlyingEnemies(this.flyingEnemySystem.enemies, this.camera);
    this.renderSystem.renderProjectiles(this.projectileSystem.projectiles, this.camera);
    if (!this.isGamePaused()) {
      this.renderSystem.renderPlacementPreview(this.getPlacementPreview(), this.camera);
    }
    this.renderSystem.renderAttackFeedback(this.attackFeedback, this.camera);
    this.renderSystem.renderPlayer(this.player, this.camera);
    this.renderSystem.renderLighting(this.dayNightSystem, this.tileMap, this.camera, GAME_VIEW);
  }

  updateMenuButtonStates() {
    this.inventoryButton?.classList?.toggle('is-active', this.inventoryOpen);
    this.craftingButton?.classList?.toggle('is-active', this.craftingOpen);
  }

  updateInteractiveUiState() {
    const menuOpen = this.isMenuOpen();
    if (this.hotbar.element) {
      this.hotbar.element.hidden = menuOpen;
    }
    if (this.touchControlsElement) {
      this.touchControlsElement.hidden = menuOpen;
    }
  }

  getDebugState() {
    const input = this.input.getDebugState();
    const touch = this.touchInput.getDebugState();
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
      paused: this.isGamePaused(),
      movementKeys: input.movementKeys,
      virtualMovement: input.virtualMovement,
      touch,
      lastKey: input.lastKey,
      saveStatus: this.saveStatus,
      activeHotbarSlot: this.activeHotbarSlot,
      activeHotbarItem: this.getActiveHotbarItem(),
      attackState: this.attackFeedback?.type || 'none',
      activeEnemies: this.enemySystem.activeCount(),
      activeAnimals: this.animalSystem.activeCount(),
      activeFlyingEnemies: this.flyingEnemySystem.activeCount(),
      activeProjectiles: this.projectileSystem.activeCount(),
      dayNightTime: this.dayNightSystem.time,
      dayNightPhase: this.dayNightSystem.getPhase(),
      activeDrops: this.dropSystem.drops.length
    };
  }

  loadHotbarState(save) {
    if (Array.isArray(save.hotbarSlots)) {
      this.hotbarSlots = this.normalizeHotbarSlots(save.hotbarSlots);
    } else {
      this.hotbarSlots = [...DEFAULT_HOTBAR_SLOTS];
      if (this.isKnownInventoryResource(save.activeHotbarResource)) {
        const index = this.hotbarSlots.indexOf(save.activeHotbarResource);
        this.activeHotbarSlot = index >= 0 ? index : 0;
      }
    }

    if (Number.isInteger(save.activeHotbarSlot)) {
      this.activeHotbarSlot = Math.min(Math.max(save.activeHotbarSlot, 0), HOTBAR_SLOT_COUNT - 1);
    }
  }

  normalizeHotbarSlots(slots) {
    const normalized = [];
    for (let index = 0; index < HOTBAR_SLOT_COUNT; index += 1) {
      const resource = slots[index] || null;
      normalized.push(this.isKnownInventoryResource(resource) ? resource : null);
    }
    return normalized;
  }
}
