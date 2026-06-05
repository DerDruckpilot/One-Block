import {
  ATTACK_FEEDBACK_SECONDS,
  BED_INTERACTION_DISTANCE,
  CAMPFIRE_INTERACTION_DISTANCE,
  CRYSTAL_ENCOUNTER_DROPS,
  CRYSTAL_ENCOUNTER_DROPS_BY_LEVEL,
  CRYSTAL_DROP_TABLES,
  CRYSTAL_INTERACTION_DISTANCE,
  CRYSTAL_LEVEL_THRESHOLDS,
  DEFAULT_HOTBAR_SLOTS,
  EGG_PRODUCTION_SECONDS,
  FURNACE_INTERACTION_DISTANCE,
  GATE_INTERACTION_DISTANCE,
  GAME_VIEW,
  HUSBANDRY_INTERACTION_DISTANCE,
  HUSBANDRY_PRODUCTION_DISTANCE,
  HOTBAR_SLOT_COUNT,
  INVENTORY_RESOURCES,
  LASSO_INTERACTION_DISTANCE,
  OBJECT_TYPES,
  PICKAXE_RESOURCE_DROPS,
  PICKAXE_RESOURCE_DROPS_BY_LEVEL,
  PLAYER_FOOT_OFFSET,
  PLAYER_MAX_HP,
  PLAYER_SIZE,
  PLAYER_SPAWN_TILE,
  REMOVABLE_OBJECT_TYPES,
  RESOURCE_LABELS,
  TILE_TYPES,
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
import { PlantSystem } from '../systems/plant-system.js';
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
  OBJECT_TYPES.door,
  OBJECT_TYPES.fence,
  OBJECT_TYPES.gate,
  OBJECT_TYPES.bed,
  OBJECT_TYPES.chickenNest,
  OBJECT_TYPES.feedTrough,
  OBJECT_TYPES.waterTrough,
  OBJECT_TYPES.furnace,
  OBJECT_TYPES.table,
  OBJECT_TYPES.chair
]);

const REMOVABLE_OBJECT_ITEMS = new Set(REMOVABLE_OBJECT_TYPES);
const FOOD_HEALING = {
  berry: 1,
  roastedBerries: 2,
  cookedSteak: 3,
  egg: 1,
  friedEgg: 2
};

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
    this.plantSystem = new PlantSystem();
    this.logSystem = new LogSystem();
    this.backgroundSystem = new BackgroundSystem();
    this.renderSystem = new RenderSystem(this.context);
    this.saveSystem = new SaveSystem(options.storage);
    this.hud = new Hud(hudElement, options.heartElement);
    this.hotbar = new Hotbar(options.hotbarElement);
    this.touchControlsElement = options.touchControlsElement;
    this.menuPanels = new MenuPanels({
      buildPanel: options.buildPanel,
      cookingPanel: options.cookingPanel,
      craftingPanel: options.craftingPanel,
      furnacePanel: options.furnacePanel,
      inventoryPanel: options.inventoryPanel
    });
    this.buildButton = options.buildButton;
    this.inventoryButton = options.inventoryButton;
    this.craftingButton = options.craftingButton;
    this.pointerHitboxes = new PointerHitboxSystem({
      buildButton: options.buildButton,
      buildPanel: options.buildPanel,
      canvas,
      cookingPanel: options.cookingPanel,
      craftingButton: options.craftingButton,
      craftingPanel: options.craftingPanel,
      furnacePanel: options.furnacePanel,
      getBuildOpen: () => this.buildOpen,
      getCookingOpen: () => this.cookingOpen,
      getCraftingOpen: () => this.craftingOpen,
      getFurnaceOpen: () => this.furnaceOpen,
      getInventoryOpen: () => this.inventoryOpen,
      hotbarElement: options.hotbarElement,
      inventoryButton: options.inventoryButton,
      inventoryPanel: options.inventoryPanel,
      onBlockedCook: () => {
        this.setLog('Nicht genug Zutaten.');
      },
      onBlockedCraft: () => {
        this.setLog('Nicht genug Material.');
      },
      onBlockedFurnace: () => {
        this.setLog('Nicht genug Material.');
      },
      onBuildItemSelect: (resource) => this.selectBuildResource(resource),
      onBuildRemoveToggle: () => this.toggleRemoveMode(),
      onBuildToggle: () => this.toggleBuildMenu(),
      onCook: (recipeId) => this.tryCook(recipeId),
      onCookSelect: (recipeId) => this.menuPanels.selectCookingRecipe(recipeId),
      onCraft: (recipeId) => this.tryCraft(recipeId),
      onCraftSelect: (recipeId) => this.menuPanels.selectCraftingRecipe(recipeId),
      onCraftingToggle: () => this.toggleCraftingMenu(),
      onFurnace: (recipeId) => this.tryFurnace(recipeId),
      onFurnaceSelect: (recipeId) => this.menuPanels.selectFurnaceRecipe(recipeId),
      onHotbarSelect: (slotIndex) => this.handleHotbarSlotClick(slotIndex),
      onInventoryItemSelect: (resource) => this.selectInventoryResource(resource),
      onInventoryTabSelect: (tabId) => this.menuPanels.selectInventoryTab(tabId),
      onInventoryToggle: () => this.toggleInventoryMenu(),
      onMenuClose: (menuId) => this.closeMenu(menuId),
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
    this.buildOpen = false;
    this.cookingOpen = false;
    this.furnaceOpen = false;
    this.craftingContext = 'normal';
    this.crystalLevel = 1;
    this.crystalXp = 0;
    this.pendingCrystalLevelUp = null;
    this.buildSelectedResource = null;
    this.removeMode = false;
    this.resetHoldSeconds = 0;
    this.autosaveSeconds = 0;
    this.saveStatus = 'new';
    this.attackFeedback = null;
    this.respawnTarget = { type: 'crystal' };
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
      this.handleAnimalEvents(this.animalSystem.update(deltaSeconds, this.tileMap, this.player));
      this.updateHusbandry(deltaSeconds);
      this.flyingEnemySystem.update(deltaSeconds, this.tileMap, this.player);
      this.handlePlayerContactDamage();
      this.handleProjectileEvents(this.projectileSystem.update(deltaSeconds, this.enemySystem, this.flyingEnemySystem));
      this.plantSystem.update(deltaSeconds, this.tileMap);
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

      if (this.input.wasPressed('x')) {
        this.toggleRemoveMode();
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
      hearts: this.player.getHeartStates(),
      resetHoldSeconds: this.resetHoldSeconds
    });
    this.hotbar.update({
      inventory: this.inventory.resources,
      activeSlot: this.activeHotbarSlot,
      slots: this.hotbarSlots
    });
    this.menuPanels.update({
      buildOpen: this.buildOpen,
      buildRemoveMode: this.removeMode,
      buildSelectedResource: this.buildSelectedResource,
      cookingOpen: this.cookingOpen,
      cookingRecipeStates: this.craftingSystem.getRecipeStates({ craftingContext: 'cooking' }),
      craftingOpen: this.craftingOpen,
      craftingContext: this.craftingContext,
      furnaceOpen: this.furnaceOpen,
      furnaceRecipeStates: this.craftingSystem.getRecipeStates({ craftingContext: 'furnace' }),
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
      if (this.trySpawnNightSpringDrop()) {
        this.saveGame();
        return true;
      }

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

    if (this.removeMode) {
      return this.tryRemoveTarget();
    }

    if (this.tryToggleOpenableBarrier()) {
      return true;
    }

    if (this.tryUseSelectedItem()) {
      return true;
    }

    if (this.tryUseLasso({ requireActive: true })) {
      return true;
    }

    if (this.tryUseBed()) {
      return true;
    }

    if (this.hasCampfireAccess()) {
      return this.openCookingMenu();
    }

    if (this.hasFurnaceAccess()) {
      return this.openFurnaceMenu();
    }

    if (this.hasWorkbenchAccess()) {
      return this.openWorkbenchCrafting();
    }

    if (this.tryUseHusbandryStation()) {
      return true;
    }

    if (this.tryHarvestContext()) {
      return true;
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

    if (activeItem === 'axe' && this.inventory.get('axe') > 0) {
      return this.tryHarvestTree();
    }

    if (activeItem === 'scythe' && this.inventory.get('scythe') > 0) {
      return this.tryHarvestGrass();
    }

    if (activeItem === 'lasso' && this.inventory.get('lasso') > 0) {
      return this.tryUseLasso({ requireActive: true });
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
    if (this.trySpawnNightSpringDrop()) {
      this.saveGame();
      return true;
    }

    const drop = this.rollCrystalDrop(this.getPickaxeDropTable());
    this.spawnVisibleDrop(drop, `${RESOURCE_LABELS[drop.resource]} splittert heraus.`);
    this.saveGame();
    return true;
  }

  useSpearAttack() {
    this.setSpearAttackFeedback();
    const hit = this.enemySystem.attackWithSpear(this.player);
    if (hit.hit) {
      if (hit.defeated) {
        this.spawnEnemyLoot(hit.enemy.lastGroundTile, hit.enemy);
      }
      this.setLog(hit.message);
      this.saveGame();
      return true;
    }

    if (this.isNearCrystal()) {
      return this.trySpawnCrystalEncounter();
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
      return this.trySpawnCrystalEncounter();
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
    this.advanceCrystalProgress(1);
    const randomValue = this.crystalSystem.random();
    return chooseWeightedDrop(dropTable || this.getCrystalDropTable(), randomValue);
  }

  advanceCrystalProgress(amount = 1) {
    this.crystalSystem.hitCounter += amount;
    this.crystalXp += amount;
    let nextLevel = this.crystalLevel;
    for (const threshold of CRYSTAL_LEVEL_THRESHOLDS) {
      if (this.crystalXp >= threshold.xp) {
        nextLevel = Math.max(nextLevel, threshold.level);
      }
    }
    if (nextLevel > this.crystalLevel) {
      this.crystalLevel = nextLevel;
      this.pendingCrystalLevelUp = nextLevel;
      return true;
    }
    return false;
  }

  consumeCrystalLevelUpMessage() {
    if (!this.pendingCrystalLevelUp) return false;
    this.setLog(`Kristall erreicht Stufe ${this.pendingCrystalLevelUp}.`);
    this.pendingCrystalLevelUp = null;
    return true;
  }

  getCrystalDropTable() {
    return CRYSTAL_DROP_TABLES[this.crystalLevel] || CRYSTAL_DROP_TABLES[1];
  }

  getPickaxeDropTable() {
    return PICKAXE_RESOURCE_DROPS_BY_LEVEL[this.crystalLevel] || PICKAXE_RESOURCE_DROPS;
  }

  spawnVisibleDrop(drop, message) {
    const visibleDrop = this.dropSystem.spawnFromCrystal(drop, this.tileMap);
    if (!visibleDrop) {
      this.inventory.add(drop.resource, drop.amount);
      this.setLog(`${RESOURCE_LABELS[drop.resource]} eingesammelt.`);
      this.consumeCrystalLevelUpMessage();
      return false;
    }

    this.setLog(message);
    this.consumeCrystalLevelUpMessage();
    return true;
  }

  trySpawnNightSpringDrop() {
    if (this.dayNightSystem.getPhase() !== 'Nacht') return false;
    const chance = this.crystalLevel >= 3 ? 0.28 : this.crystalLevel >= 2 ? 0.16 : 0.08;
    if (this.crystalSystem.random() >= chance) return false;

    this.advanceCrystalProgress(1);
    this.spawnVisibleDrop({ resource: 'springDrop', amount: 1 }, 'Ein Quelltropfen erscheint.');
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
          this.dropSystem.spawnNearWorld({ resource: 'rawMeat', amount: 1 }, this.tileMap, event.target.x, event.target.y);
        }
        this.setLog(hit.message);
        this.saveGame();
      }
    }
  }

  handlePlayerContactDamage() {
    const contacts = [
      ...this.enemySystem.enemies.map((enemy) => ({ enemy, damage: 1 })),
      ...this.flyingEnemySystem.enemies.map((enemy) => ({ enemy, damage: 1 }))
    ];

    for (const contact of contacts) {
      if (!this.isEntityTouchingPlayer(contact.enemy)) continue;
      if (!this.player.takeDamage(contact.damage)) return false;
      this.setLog('Du wurdest getroffen.');
      if (this.player.hp <= 0) {
        this.handlePlayerDeath('Du bist gestorben.');
      }
      this.saveGame();
      return true;
    }

    return false;
  }

  isEntityTouchingPlayer(entity) {
    const playerCenter = this.player.getCenterPosition();
    const entityCenter = entity.getCenterPosition();
    const radius = (this.player.width + entity.width) * 0.28;
    return Math.hypot(playerCenter.x - entityCenter.x, playerCenter.y - entityCenter.y) <= radius;
  }

  spawnEnemyLoot(tile, enemy) {
    const center = enemy?.getCenterPosition?.() || this.tileMap.getCrystalCenter();
    if (tile) {
      this.dropSystem.spawnNearWorld(
        { resource: 'rawMeat', amount: 1 },
        this.tileMap,
        tile.x * TILE_SIZE + TILE_SIZE / 2,
        tile.y * TILE_SIZE + TILE_SIZE / 2
      );
      return;
    }
    this.dropSystem.spawnNearWorld({ resource: 'rawMeat', amount: 1 }, this.tileMap, center.x, center.y);
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

  tryUseSelectedItem() {
    const activeItem = this.getActiveHotbarItem();
    if (FOOD_HEALING[activeItem]) {
      return this.tryEatFood(activeItem);
    }

    const placement = this.getPlacementPreview();
    if (placement.canPlace) {
      return this.tryPlaceSelectedItem();
    }

    return false;
  }

  tryEatFood(resource) {
    if (this.inventory.get(resource) <= 0) {
      this.setLog(`Keine ${RESOURCE_LABELS[resource]}.`);
      return true;
    }

    if (!this.player.heal(FOOD_HEALING[resource])) {
      this.setLog('Du bist bereits gesund.');
      return true;
    }

    this.inventory.remove(resource, 1);
    const messages = {
      berry: 'Beere gegessen.',
      roastedBerries: 'Geröstete Beeren gegessen.',
      cookedSteak: 'Steak gegessen.'
    };
    this.setLog(messages[resource] || `${RESOURCE_LABELS[resource]} gegessen.`);
    this.saveGame();
    return true;
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

    if (activeItem === 'clay') {
      this.tileMap.setClay(placement.x, placement.y);
      this.inventory.remove('clay', 1);
      this.setLog('Lehm platziert.');
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

    if (activeItem === 'springDrop') {
      this.applySpringDrop(placement);
    }

    if (activeItem === 'treeSeed') {
      this.plantSystem.plantTreeSeed(this.tileMap, placement.x, placement.y);
      this.inventory.remove('treeSeed', 1);
      this.setLog('Baumsamen gepflanzt.');
    }

    if (activeItem === 'berry') {
      this.plantSystem.plantBerryBush(this.tileMap, placement.x, placement.y);
      this.inventory.remove('berry', 1);
      this.setLog('Beerenbusch gepflanzt.');
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

    if (activeItem === 'springDrop') {
      return this.getSpringDropPlacementPreview(target);
    }

    if (activeItem === 'treeSeed' || activeItem === 'berry') {
      return this.getPlantingPlacementPreview(activeItem, target, playerTile);
    }

    if (activeItem === 'lasso') {
      return {
        ...target,
        canPlace: false,
        message: 'Kein Tier in Reichweite.'
      };
    }

    if (activeItem === 'earth' || activeItem === 'stone' || activeItem === 'clay') {
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

    if (resource === OBJECT_TYPES.bed && this.tileMap.getTile(target.x, target.y) === TILE_TYPES.water) {
      return {
        ...target,
        canPlace: false,
        message: 'Bett braucht festen Boden.'
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

  getRemovalPreview() {
    const target = this.player.getFacingTile();
    const object = this.tileMap.getObject(target.x, target.y);
    return {
      ...target,
      canPlace: Boolean(object && REMOVABLE_OBJECT_ITEMS.has(object)),
      message: object && REMOVABLE_OBJECT_ITEMS.has(object)
        ? `${RESOURCE_LABELS[object]} kann entfernt werden.`
        : 'Kein entfernbares Objekt.'
    };
  }

  tryRemoveTarget() {
    const preview = this.getRemovalPreview();
    if (!preview.canPlace) {
      this.setLog(preview.message);
      return false;
    }

    const object = this.tileMap.getObject(preview.x, preview.y);
    this.tileMap.removeObject(preview.x, preview.y);
    this.inventory.add(object, 1);
    if (object === OBJECT_TYPES.bed && this.respawnTarget?.type === 'bed' && this.respawnTarget.x === preview.x && this.respawnTarget.y === preview.y) {
      this.respawnTarget = { type: 'crystal' };
    }
    this.setLog('Objekt entfernt.');
    this.saveGame();
    return true;
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

  getSpringDropPlacementPreview(target = this.player.getFacingTile()) {
    if (this.inventory.get('springDrop') <= 0) {
      return {
        ...target,
        canPlace: false,
        message: 'Nicht genug Quelltropfen.'
      };
    }

    if (this.tileMap.isCrystal(target.x, target.y)) {
      return {
        ...target,
        canPlace: false,
        message: 'Nicht auf dem Kristall.'
      };
    }

    const tile = this.tileMap.getTile(target.x, target.y);
    if (tile === TILE_TYPES.earth || tile === TILE_TYPES.moistEarth || tile === TILE_TYPES.clay) {
      return {
        ...target,
        canPlace: true,
        message: 'Quelltropfen kann genutzt werden.'
      };
    }

    return {
      ...target,
      canPlace: false,
      message: 'Quelltropfen brauchen Erde oder Lehm.'
    };
  }

  getPlantingPlacementPreview(resource, target = this.player.getFacingTile(), playerTile = this.player.getTilePosition()) {
    if (this.inventory.get(resource) <= 0) {
      return {
        ...target,
        canPlace: false,
        message: `Nicht genug ${RESOURCE_LABELS[resource]}.`
      };
    }

    if (target.x === playerTile.x && target.y === playerTile.y) {
      return {
        ...target,
        canPlace: false,
        message: 'Zielfeld ist blockiert.'
      };
    }

    if (!this.plantSystem.canPlantOn(this.tileMap, target.x, target.y)) {
      return {
        ...target,
        canPlace: false,
        message: 'Hier kann nichts gepflanzt werden.'
      };
    }

    return {
      ...target,
      canPlace: true,
      message: `${RESOURCE_LABELS[resource]} kann gepflanzt werden.`
    };
  }

  applySpringDrop(placement) {
    const tile = this.tileMap.getTile(placement.x, placement.y);
    if (tile === TILE_TYPES.clay) {
      this.tileMap.setWater(placement.x, placement.y);
      this.inventory.remove('springDrop', 1);
      this.setLog('Eine Wasserquelle entsteht.');
      return true;
    }

    if (tile === TILE_TYPES.earth || tile === TILE_TYPES.moistEarth) {
      this.tileMap.setMoistEarth(placement.x, placement.y);
      this.inventory.remove('springDrop', 1);
      this.setLog('Die Erde wird feucht.');
      return true;
    }

    return false;
  }

  tryHarvestContext() {
    return this.tryHarvestTree() || this.tryHarvestGrass() || this.tryHarvestBerryBush();
  }

  tryHarvestTree() {
    const target = this.player.getFacingTile();
    if (this.tileMap.getObject(target.x, target.y) !== OBJECT_TYPES.tree) return false;

    if (this.inventory.get('axe') <= 0) {
      this.setLog('Dafür brauchst du eine Axt.');
      return true;
    }

    const result = this.plantSystem.fellTree(this.tileMap, target.x, target.y);
    this.setLog(result.message);
    if (result.harvested) {
      const centerX = target.x * TILE_SIZE + TILE_SIZE / 2;
      const centerY = target.y * TILE_SIZE + TILE_SIZE / 2;
      this.dropSystem.spawnNearWorld({ resource: 'rawWood', amount: this.randomIntInclusive(4, 8) }, this.tileMap, centerX, centerY);
      this.dropSystem.spawnNearWorld({ resource: 'treeSeed', amount: this.randomIntInclusive(1, 3) }, this.tileMap, centerX, centerY);
      this.saveGame();
    }
    return true;
  }

  tryHarvestGrass() {
    const target = this.player.getFacingTile();
    if (!this.tileMap.isGrass(target.x, target.y)) return false;

    if (this.inventory.get('scythe') <= 0) {
      this.setLog('Dafür brauchst du eine Sense.');
      return true;
    }

    const result = this.plantSystem.harvestGrass(this.tileMap, target.x, target.y);
    this.setLog(result.message);
    if (result.harvested) {
      this.dropSystem.spawnNearWorld(
        { resource: 'fiber', amount: 1 },
        this.tileMap,
        target.x * TILE_SIZE + TILE_SIZE / 2,
        target.y * TILE_SIZE + TILE_SIZE / 2
      );
      this.saveGame();
    }
    return true;
  }

  tryHarvestBerryBush() {
    const target = this.player.getFacingTile();
    if (this.tileMap.getObject(target.x, target.y) !== OBJECT_TYPES.berryBush) return false;

    const result = this.plantSystem.harvestBerryBush(target.x, target.y, this.tileMap);
    this.setLog(result.message);
    if (result.harvested) {
      this.dropSystem.spawnNearWorld(
        { resource: 'berry', amount: 1 },
        this.tileMap,
        target.x * TILE_SIZE + TILE_SIZE / 2,
        target.y * TILE_SIZE + TILE_SIZE / 2
      );
      this.saveGame();
    }
    return true;
  }

  tryUseLasso({ requireActive = false } = {}) {
    const activeItem = this.getActiveHotbarItem();
    if (activeItem !== 'lasso') return false;
    if (this.inventory.get('lasso') <= 0) {
      if (requireActive) {
        this.setLog('Kein Lasso.');
        return true;
      }
      return false;
    }
    const hasTethered = Boolean(this.animalSystem.getTetheredAnimal());
    const hasNearbyChicken = Boolean(this.animalSystem.findNearestChicken(this.player, LASSO_INTERACTION_DISTANCE));
    if (!hasTethered && !hasNearbyChicken) {
      if (requireActive) {
        this.setLog('Kein Tier in Reichweite.');
        return true;
      }
      return false;
    }

    const result = this.animalSystem.tetherChicken(this.player, LASSO_INTERACTION_DISTANCE);
    this.setLog(result.message);
    if (result.changed) {
      this.saveGame();
    }
    return true;
  }

  tryToggleDoor() {
    return this.tryToggleOpenableBarrier([OBJECT_TYPES.door]);
  }

  tryToggleOpenableBarrier(types = [OBJECT_TYPES.gate, OBJECT_TYPES.door]) {
    const openableTypes = new Set(types);
    const target = this.player.getFacingTile();
    const targetObject = this.tileMap.getObject(target.x, target.y);
    if (!openableTypes.has(targetObject)) {
      const foot = this.player.getFootPosition();
      let nearest = null;
      let nearestDistance = Infinity;
      this.tileMap.forEachObject((object) => {
        if (!openableTypes.has(object.type)) return;
        const center = {
          x: object.x * TILE_SIZE + TILE_SIZE / 2,
          y: object.y * TILE_SIZE + TILE_SIZE / 2
        };
        const distance = Math.hypot(foot.x - center.x, foot.y - center.y);
        if (distance <= GATE_INTERACTION_DISTANCE && distance < nearestDistance) {
          nearest = object;
          nearestDistance = distance;
        }
      });
      if (!nearest) return false;
      const open = this.tileMap.toggleOpenable(nearest.x, nearest.y);
      this.setLog(open ? `${RESOURCE_LABELS[nearest.type]} geoeffnet.` : `${RESOURCE_LABELS[nearest.type]} geschlossen.`);
      this.saveGame();
      return true;
    }

    const open = this.tileMap.toggleOpenable(target.x, target.y);
    this.setLog(open ? `${RESOURCE_LABELS[targetObject]} geoeffnet.` : `${RESOURCE_LABELS[targetObject]} geschlossen.`);
    this.saveGame();
    return true;
  }

  tryToggleGate() {
    const target = this.player.getFacingTile();
    if (this.tileMap.getObject(target.x, target.y) !== OBJECT_TYPES.gate) {
      const foot = this.player.getFootPosition();
      let nearest = null;
      let nearestDistance = Infinity;
      this.tileMap.forEachObject((object) => {
        if (object.type !== OBJECT_TYPES.gate) return;
        const center = {
          x: object.x * TILE_SIZE + TILE_SIZE / 2,
          y: object.y * TILE_SIZE + TILE_SIZE / 2
        };
        const distance = Math.hypot(foot.x - center.x, foot.y - center.y);
        if (distance <= GATE_INTERACTION_DISTANCE && distance < nearestDistance) {
          nearest = object;
          nearestDistance = distance;
        }
      });
      if (!nearest) return false;
      const open = this.tileMap.toggleGate(nearest.x, nearest.y);
      this.setLog(open ? 'Tor geöffnet.' : 'Tor geschlossen.');
      this.saveGame();
      return true;
    }

    const open = this.tileMap.toggleGate(target.x, target.y);
    this.setLog(open ? 'Tor geöffnet.' : 'Tor geschlossen.');
    this.saveGame();
    return true;
  }

  trySpawnCrystalEncounter() {
    const encounterDrops = CRYSTAL_ENCOUNTER_DROPS_BY_LEVEL[this.crystalLevel] || CRYSTAL_ENCOUNTER_DROPS;
    const choice = chooseWeightedDrop(encounterDrops, this.crystalSystem.random()).encounter;
    const spawn = choice === 'flying'
      ? this.flyingEnemySystem.spawnNearCrystal(this.tileMap)
      : this.enemySystem.spawnNearCrystal(this.tileMap);
    this.setLog(spawn.message);
    if (spawn.spawned) {
      this.saveGame();
    }
    return spawn.spawned;
  }

  randomIntInclusive(min, max) {
    return min + Math.floor(this.crystalSystem.random() * (max - min + 1));
  }

  handleVoidFall() {
    const foot = this.player.getFootPosition();
    const support = this.tileMap.getSupportStateAtWorld(foot.x, foot.y);
    this.falling = !support.supported;

    if (this.falling) {
      this.respawnPlayer({ restoreHp: true });
      this.setLog('Du bist in den Void gefallen und respawnt.');
      this.saveGame();
    }
  }

  handlePlayerDeath(message = 'Du bist gestorben.') {
    this.respawnPlayer({ restoreHp: true });
    this.setLog(message);
  }

  respawnPlayer({ restoreHp = false } = {}) {
    const spawnTile = this.getRespawnTile();
    const spawnX = spawnTile.x * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2;
    const spawnY = spawnTile.y * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET);
    this.player.setPosition(spawnX, spawnY);
    this.player.facing = { x: 0, y: -1 };
    if (restoreHp) {
      this.player.restoreHp();
    }
  }

  getRespawnTile() {
    if (this.respawnTarget?.type === 'bed' && this.isValidRespawnBed(this.respawnTarget)) {
      const tile = this.findSafeTileNear(this.respawnTarget.x, this.respawnTarget.y);
      if (tile) return tile;
    }

    this.respawnTarget = { type: 'crystal' };
    return { ...PLAYER_SPAWN_TILE };
  }

  isValidRespawnBed(target) {
    return target &&
      target.type === 'bed' &&
      Number.isInteger(target.x) &&
      Number.isInteger(target.y) &&
      this.tileMap.getObject(target.x, target.y) === OBJECT_TYPES.bed;
  }

  findSafeTileNear(x, y) {
    const candidates = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
      { x: x + 1, y: y + 1 },
      { x: x - 1, y: y + 1 },
      { x: x + 1, y: y - 1 },
      { x: x - 1, y: y - 1 }
    ];

    return candidates.find((candidate) =>
      this.tileMap.isGround(candidate.x, candidate.y) &&
      !this.tileMap.isCrystal(candidate.x, candidate.y) &&
      !this.tileMap.getObject(candidate.x, candidate.y)
    ) || null;
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
    if (this.input.wasPressed('Escape')) {
      this.closeAllMenus();
      return;
    }

    if (this.input.wasPressed('i')) {
      this.toggleInventoryMenu();
    }

    if (this.input.wasPressed('c')) {
      this.toggleCraftingMenu();
    }

    if (this.input.wasPressed('n')) {
      this.toggleBuildMenu();
    }
  }

  closeAllMenus() {
    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.buildOpen = false;
    this.cookingOpen = false;
    this.furnaceOpen = false;
    this.selectedInventoryResource = null;
    return true;
  }

  updateHusbandry(deltaSeconds) {
    let changed = false;
    this.tileMap.forEachObject((object) => {
      if (object.type !== OBJECT_TYPES.chickenNest) return;
      if (!this.hasChickenNearObject(object, HUSBANDRY_PRODUCTION_DISTANCE)) return;
      const support = this.getHusbandrySupportForNest(object);
      if (!support.supported) return;

      const nextTimer = Number(object.eggTimer || 0) + deltaSeconds;
      if (nextTimer < EGG_PRODUCTION_SECONDS) {
        this.tileMap.setObjectState(object.x, object.y, { eggTimer: nextTimer });
        return;
      }

      const centerX = object.x * TILE_SIZE + TILE_SIZE / 2;
      const centerY = object.y * TILE_SIZE + TILE_SIZE / 2;
      const drop = this.dropSystem.spawnNearWorld({ resource: 'egg', amount: 1 }, this.tileMap, centerX, centerY);
      if (drop) {
        this.setLog('Ein Ei liegt im Nest.');
      } else {
        this.inventory.add('egg', 1);
        this.setLog('Ei eingesammelt.');
      }
      this.tileMap.setObjectState(object.x, object.y, { eggTimer: nextTimer - EGG_PRODUCTION_SECONDS });
      if (support.feedTrough) {
        this.tileMap.setObjectState(support.feedTrough.x, support.feedTrough.y, {
          feed: Math.max(0, Number(support.feedTrough.feed || 0) - 1)
        });
      }
      changed = true;
    });

    if (changed) {
      this.saveGame();
    }
  }

  hasChickenNearObject(object, maxDistance) {
    const center = {
      x: object.x * TILE_SIZE + TILE_SIZE / 2,
      y: object.y * TILE_SIZE + TILE_SIZE / 2
    };
    return this.animalSystem.animals.some((animal) => {
      if (animal.type !== 'chicken') return false;
      const foot = animal.getFootPosition();
      return Math.hypot(foot.x - center.x, foot.y - center.y) <= maxDistance;
    });
  }

  getHusbandrySupportForNest(nest) {
    const feedTrough = this.findNearbyObject(nest, OBJECT_TYPES.feedTrough, HUSBANDRY_PRODUCTION_DISTANCE, (object) =>
      Number(object.feed || 0) > 0
    );
    if (feedTrough) {
      return { supported: true, feedTrough };
    }

    const waterTrough = this.findNearbyObject(nest, OBJECT_TYPES.waterTrough, HUSBANDRY_PRODUCTION_DISTANCE, (object) =>
      this.isWaterTroughFilled(object)
    );
    return { supported: Boolean(waterTrough), waterTrough };
  }

  findNearbyObject(origin, type, maxDistance, predicate = () => true) {
    let nearest = null;
    let nearestDistance = Infinity;
    const originCenter = {
      x: origin.x * TILE_SIZE + TILE_SIZE / 2,
      y: origin.y * TILE_SIZE + TILE_SIZE / 2
    };
    this.tileMap.forEachObject((object) => {
      if (object.type !== type || !predicate(object)) return;
      const center = {
        x: object.x * TILE_SIZE + TILE_SIZE / 2,
        y: object.y * TILE_SIZE + TILE_SIZE / 2
      };
      const distance = Math.hypot(originCenter.x - center.x, originCenter.y - center.y);
      if (distance <= maxDistance && distance < nearestDistance) {
        nearest = object;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  isWaterTroughFilled(object) {
    if (object.filled === true) return true;
    return this.tileMap.isWatered(object.x, object.y);
  }

  tryUseHusbandryStation() {
    const feedTrough = this.findNearestObject(OBJECT_TYPES.feedTrough, HUSBANDRY_INTERACTION_DISTANCE);
    if (feedTrough) {
      return this.fillFeedTrough(feedTrough);
    }

    const waterTrough = this.findNearestObject(OBJECT_TYPES.waterTrough, HUSBANDRY_INTERACTION_DISTANCE);
    if (waterTrough) {
      return this.fillWaterTrough(waterTrough);
    }

    const nest = this.findNearestObject(OBJECT_TYPES.chickenNest, HUSBANDRY_INTERACTION_DISTANCE);
    if (nest) {
      const support = this.getHusbandrySupportForNest(nest);
      this.setLog(support.supported ? 'Nest ist versorgt.' : 'Nest braucht Futter oder Wasser.');
      return true;
    }

    return false;
  }

  fillFeedTrough(feedTrough) {
    if (this.inventory.get('berry') > 0) {
      this.inventory.remove('berry', 1);
      this.tileMap.setObjectState(feedTrough.x, feedTrough.y, { feed: Number(feedTrough.feed || 0) + 2 });
      this.setLog('Futterstelle mit Beeren gefuellt.');
      this.saveGame();
      return true;
    }
    if (this.inventory.get('grassSeed') >= 2) {
      this.inventory.remove('grassSeed', 2);
      this.tileMap.setObjectState(feedTrough.x, feedTrough.y, { feed: Number(feedTrough.feed || 0) + 1 });
      this.setLog('Futterstelle mit Grassamen gefuellt.');
      this.saveGame();
      return true;
    }
    this.setLog('Kein Futter verfuegbar.');
    return true;
  }

  fillWaterTrough(waterTrough) {
    if (this.isWaterTroughFilled(waterTrough)) {
      this.tileMap.setObjectState(waterTrough.x, waterTrough.y, { filled: true });
      this.setLog('Wassertrug ist gefuellt.');
      this.saveGame();
      return true;
    }
    this.setLog('Wassertrug braucht eine Wasserquelle in der Naehe.');
    return true;
  }

  isMenuOpen() {
    return this.inventoryOpen || this.craftingOpen || this.buildOpen || this.cookingOpen || this.furnaceOpen;
  }

  isGamePaused() {
    return this.isMenuOpen();
  }

  toggleInventoryMenu() {
    this.inventoryOpen = !this.inventoryOpen;
    if (this.inventoryOpen) {
      this.craftingOpen = false;
      this.buildOpen = false;
      this.cookingOpen = false;
      this.furnaceOpen = false;
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
    this.buildOpen = false;
    this.cookingOpen = false;
    this.furnaceOpen = false;
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
    this.buildOpen = false;
    this.cookingOpen = false;
    this.furnaceOpen = false;
    this.selectedInventoryResource = null;
    this.menuPanels.selectCraftingRecipe('woodenPickaxe');
    this.setLog('Werkbank geöffnet.');
    return true;
  }

  toggleBuildMenu() {
    this.buildOpen = !this.buildOpen;
    if (this.buildOpen) {
      this.inventoryOpen = false;
      this.craftingOpen = false;
      this.cookingOpen = false;
      this.furnaceOpen = false;
      this.selectedInventoryResource = null;
    }
  }

  closeMenu(menuId) {
    if (menuId === 'inventory') {
      this.inventoryOpen = false;
      this.selectedInventoryResource = null;
      return true;
    }
    if (menuId === 'crafting') {
      this.craftingOpen = false;
      return true;
    }
    if (menuId === 'build') {
      this.buildOpen = false;
      return true;
    }
    if (menuId === 'cooking') {
      this.cookingOpen = false;
      return true;
    }
    if (menuId === 'furnace') {
      this.furnaceOpen = false;
      return true;
    }
    return false;
  }

  selectBuildResource(resource) {
    if (!this.isKnownInventoryResource(resource)) return false;
    this.removeMode = false;
    this.buildSelectedResource = resource;
    this.selectHotbarResource(resource);
    this.setLog(`${RESOURCE_LABELS[resource]} zum Bauen ausgewählt.`);
    this.saveGame();
    return true;
  }

  toggleRemoveMode() {
    this.removeMode = !this.removeMode;
    if (this.removeMode) {
      this.buildSelectedResource = null;
    }
    this.setLog(this.removeMode ? 'Entfernen aktiv.' : 'Entfernen aus.');
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

  hasCampfireAccess() {
    const foot = this.player.getFootPosition();
    return this.tileMap.isNearObjectWorld(
      foot.x,
      foot.y,
      OBJECT_TYPES.campfire,
      CAMPFIRE_INTERACTION_DISTANCE
    );
  }

  hasFurnaceAccess() {
    const foot = this.player.getFootPosition();
    return this.tileMap.isNearObjectWorld(
      foot.x,
      foot.y,
      OBJECT_TYPES.furnace,
      FURNACE_INTERACTION_DISTANCE
    );
  }

  findNearestObject(type, maxDistance) {
    const foot = this.player.getFootPosition();
    let nearest = null;
    let nearestDistance = Infinity;
    this.tileMap.forEachObject((object) => {
      if (object.type !== type) return;
      const center = {
        x: object.x * TILE_SIZE + TILE_SIZE / 2,
        y: object.y * TILE_SIZE + TILE_SIZE / 2
      };
      const distance = Math.hypot(foot.x - center.x, foot.y - center.y);
      if (distance <= maxDistance && distance < nearestDistance) {
        nearest = object;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  tryUseBed() {
    const bed = this.findNearestObject(OBJECT_TYPES.bed, BED_INTERACTION_DISTANCE);
    if (!bed) return false;

    if (!this.isActiveRespawnBed(bed)) {
      this.respawnTarget = { type: 'bed', x: bed.x, y: bed.y };
      this.setLog('Respawnpunkt gesetzt.');
      this.saveGame();
      return true;
    }

    if (this.dayNightSystem.getPhaseId() === 'night') {
      this.dayNightSystem.sleepUntilMorning();
      this.setLog('Du schläfst bis zum Morgen.');
    } else {
      this.dayNightSystem.sleepUntilNight();
      this.setLog('Du schläfst bis zur Nacht.');
    }
    this.saveGame();
    return true;
  }

  isActiveRespawnBed(object) {
    return this.respawnTarget?.type === 'bed' &&
      this.respawnTarget.x === object.x &&
      this.respawnTarget.y === object.y;
  }

  openCookingMenu() {
    if (!this.hasCampfireAccess()) {
      this.setLog('Kein Lagerfeuer in Reichweite.');
      return false;
    }

    this.cookingOpen = true;
    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.buildOpen = false;
    this.furnaceOpen = false;
    this.selectedInventoryResource = null;
    this.menuPanels.selectCookingRecipe('roastedBerries');
    this.setLog('Koch-Menü geöffnet.');
    return true;
  }

  tryCook(recipeId) {
    const result = this.craftingSystem.craft(recipeId, {
      craftingContext: 'cooking',
      hasWorkbenchAccess: false
    });

    const messages = {
      roastedBerries: 'Geroestete Beeren gekocht.',
      cookedSteak: 'Steak gebraten.',
      friedEgg: 'Ei gebraten.'
    };
    this.setLog(result.crafted ? (messages[recipeId] || result.message) : result.message);
    if (result.crafted) {
      this.saveGame();
    }
    return result.crafted;
  }

  openFurnaceMenu() {
    if (!this.hasFurnaceAccess()) {
      this.setLog('Kein Ofen in Reichweite.');
      return false;
    }

    this.furnaceOpen = true;
    this.cookingOpen = false;
    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.buildOpen = false;
    this.selectedInventoryResource = null;
    this.menuPanels.selectFurnaceRecipe('clayBrick');
    this.setLog('Ofen geoeffnet.');
    return true;
  }

  tryFurnace(recipeId) {
    const result = this.craftingSystem.craft(recipeId, {
      craftingContext: 'furnace',
      hasWorkbenchAccess: false
    });

    const messages = {
      clayBrick: 'Lehmziegel gebrannt.',
      bowl: 'Tonschale gebrannt.',
      jug: 'Tonkrug gebrannt.'
    };
    this.setLog(result.crafted ? (messages[recipeId] || result.message) : result.message);
    if (result.crafted) {
      this.saveGame();
    }
    return result.crafted;
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
    this.buildOpen = false;
    this.cookingOpen = false;
    this.furnaceOpen = false;
    this.craftingContext = 'normal';
    this.crystalLevel = 1;
    this.crystalXp = 0;
    this.pendingCrystalLevelUp = null;
    this.buildSelectedResource = null;
    this.removeMode = false;
    this.respawnTarget = { type: 'crystal' };
    this.respawnPlayer();
    this.player.restoreHp();
    this.resetHoldSeconds = 0;
    this.autosaveSeconds = 0;
    this.saveStatus = 'new';
    this.enemySystem.clear();
    this.animalSystem.clear();
    this.flyingEnemySystem.clear();
    this.projectileSystem.clear();
    this.plantSystem.clear();
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
    this.plantSystem.load(save.plants, save.grassCooldowns, this.tileMap);

    this.inventory.load(save.resources);
    this.player.setHp(Number.isFinite(save.player?.hp) ? save.player.hp : PLAYER_MAX_HP);
    this.respawnTarget = this.normalizeRespawnTarget(save.respawnTarget);

    if (save.player && Number.isFinite(save.player.x) && Number.isFinite(save.player.y)) {
      this.player.setPosition(save.player.x, save.player.y);
      this.player.facing = save.player.facing || { x: 0, y: -1 };

      if (!this.tileMap.isPlayerSupported(this.player)) {
        this.respawnPlayer();
      }
    }

    this.loadHotbarState(save);
    if (this.isKnownInventoryResource(save.buildSelectedResource)) {
      this.buildSelectedResource = save.buildSelectedResource;
    }
    this.removeMode = save.removeMode === true;
    this.logSystem.load(save.logs);
    this.enemySystem.load(save.enemies, this.tileMap);
    this.animalSystem.load(save.animals, this.tileMap);
    this.flyingEnemySystem.load(save.flyingEnemies, this.tileMap);
    this.projectileSystem.clear();
    this.dropSystem.load(save.drops, this.tileMap);
    this.dayNightSystem.load(save.dayNightTime);
    this.crystalLevel = Number.isInteger(save.crystalLevel) ? Math.max(1, Math.min(3, save.crystalLevel)) : 1;
    this.crystalXp = Number.isFinite(save.crystalXp) ? Math.max(0, save.crystalXp) : 0;
    this.crystalSystem.hitCounter = Number.isFinite(save.crystalInteractions) ? Math.max(0, save.crystalInteractions) : this.crystalXp;

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

  normalizeRespawnTarget(target) {
    if (
      target?.type === 'bed' &&
      Number.isInteger(target.x) &&
      Number.isInteger(target.y) &&
      this.tileMap.getObject(target.x, target.y) === OBJECT_TYPES.bed
    ) {
      return { type: 'bed', x: target.x, y: target.y };
    }
    return { type: 'crystal' };
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
      plants: this.plantSystem.toJSON(),
      grassCooldowns: this.plantSystem.grassCooldownsToJSON(),
      dayNightTime: this.dayNightSystem.toJSON(),
      crystalLevel: this.crystalLevel,
      crystalXp: this.crystalXp,
      crystalInteractions: this.crystalSystem.hitCounter,
      logs: this.logSystem.toJSON(),
      hotbarSlots: [...this.hotbarSlots],
      activeHotbarSlot: this.activeHotbarSlot,
      buildSelectedResource: this.buildSelectedResource,
      removeMode: this.removeMode,
      respawnTarget: this.respawnTarget,
      player: {
        x: this.player.x,
        y: this.player.y,
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        facing: this.player.facing
      }
    });
    this.saveStatus = saved ? 'saved' : 'error';
    return saved;
  }

  render() {
    this.backgroundSystem.render(this.context, this.camera, this.dayNightSystem);
    this.renderSystem.renderWorld(this.tileMap, this.camera);
    this.renderSystem.renderCrystal(this.tileMap, this.camera, performance.now(), this.crystalLevel);
    this.renderSystem.renderObjects(this.tileMap, this.camera);
    this.renderSystem.renderDrops(this.dropSystem.drops, this.camera);
    this.renderSystem.renderAnimals(this.animalSystem.animals, this.camera);
    this.renderSystem.renderEnemies(this.enemySystem.enemies, this.camera);
    this.renderSystem.renderFlyingEnemies(this.flyingEnemySystem.enemies, this.camera);
    this.renderSystem.renderProjectiles(this.projectileSystem.projectiles, this.camera);
    if (!this.isGamePaused()) {
      this.renderSystem.renderPlacementPreview(this.removeMode ? this.getRemovalPreview() : this.getPlacementPreview(), this.camera);
    }
    this.renderSystem.renderAttackFeedback(this.attackFeedback, this.camera);
    this.renderSystem.renderPlayer(this.player, this.camera);
    this.renderSystem.renderForegroundBarriers(this.tileMap, this.camera, this.getBarrierDepthSubjects());
    this.renderSystem.renderForegroundObjects(this.tileMap, this.camera);
    this.renderSystem.renderLighting(this.dayNightSystem, this.tileMap, this.camera, GAME_VIEW);
  }

  getBarrierDepthSubjects() {
    const subjects = [this.player.getFootPosition()];
    for (const animal of this.animalSystem.animals) {
      subjects.push(animal.getFootPosition());
    }
    for (const enemy of this.enemySystem.enemies) {
      subjects.push(enemy.getFootPosition());
    }
    for (const enemy of this.flyingEnemySystem.enemies) {
      const center = enemy.getCenterPosition();
      subjects.push({ x: center.x, y: center.y + enemy.height / 2 });
    }
    return subjects;
  }

  updateMenuButtonStates() {
    this.buildButton?.classList?.toggle('is-active', this.buildOpen);
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
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      damageCooldown: this.player.damageCooldownSeconds,
      respawnTarget: this.respawnTarget?.type || 'crystal',
      activeMenu: this.cookingOpen
        ? 'cooking'
        : this.furnaceOpen
          ? 'furnace'
          : this.craftingOpen
            ? `crafting:${this.craftingContext}`
            : this.inventoryOpen
              ? 'inventory'
              : this.buildOpen
                ? 'build'
                : 'none',
      crystalLevel: this.crystalLevel,
      crystalXp: this.crystalXp,
      buildOpen: this.buildOpen,
      removeMode: this.removeMode,
      buildSelectedResource: this.buildSelectedResource || 'none',
      attackState: this.attackFeedback?.type || 'none',
      activeEnemies: this.enemySystem.activeCount(),
      activeAnimals: this.animalSystem.activeCount(),
      activeFlyingEnemies: this.flyingEnemySystem.activeCount(),
      activeProjectiles: this.projectileSystem.activeCount(),
      activePlants: this.plantSystem.plants.size,
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
