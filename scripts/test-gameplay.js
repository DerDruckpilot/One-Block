import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  DAY_NIGHT_CYCLE_SECONDS,
  DAY_NIGHT_PHASES,
  DAY_NIGHT_START_TIME,
  CRYSTAL_INTERACTION_DISTANCE,
  CRYSTAL_LEVEL_THRESHOLDS,
  DEFAULT_HOTBAR_SLOTS,
  EGG_PRODUCTION_SECONDS,
  FURNACE_INTERACTION_DISTANCE,
  GAME_VIEW,
  HOTBAR_SLOT_COUNT,
  BOW_RANGE,
  BERRY_BUSH_GROW_SECONDS,
  CRYSTAL_ENCOUNTER_DROPS,
  FLYING_ENEMY_MAX_TILE_DISTANCE,
  GATE_INTERACTION_DISTANCE,
  LASSO_INTERACTION_DISTANCE,
  OBJECT_TYPES,
  PICKAXE_RESOURCE_DROPS,
  PLAYER_FOOT_OFFSET,
  PLAYER_MAX_HP,
  PLAYER_SIZE,
  PLAYER_SPAWN_TILE,
  RESOURCE_LABELS,
  SAPLING_GROW_SECONDS,
  SLINGSHOT_RANGE,
  TILE_SIZE
} from '../src/config/constants.js';
import { Camera } from '../src/core/camera.js';
import { Animal } from '../src/entities/animal.js';
import { Enemy } from '../src/entities/enemy.js';
import { TouchInput } from '../src/core/touch-input.js';
import { Player } from '../src/entities/player.js';
import { SAVE_KEY, SaveSystem } from '../src/systems/save-system.js';
import { TileMap } from '../src/world/tile-map.js';
import { ResourceInventory } from '../src/systems/resource-inventory.js';
import { chooseWeightedDrop, CrystalSystem } from '../src/systems/crystal-system.js';
import { CraftingSystem } from '../src/systems/crafting-system.js';
import { EnemySystem } from '../src/systems/enemy-system.js';
import { DropSystem } from '../src/systems/drop-system.js';
import { LogSystem } from '../src/systems/log-system.js';
import { TerrainRenderer } from '../src/systems/terrain-renderer.js';
import { Hud } from '../src/ui/hud.js';
import { Hotbar } from '../src/ui/hotbar.js';
import { MenuPanels } from '../src/ui/menu-panels.js';
import { isPortraitViewport, updateOrientationState } from '../src/ui/orientation.js';
import { PointerHitboxSystem } from '../src/ui/pointer-hitboxes.js';

const inputWith = (...pressedKeys) => ({
  isDown: (...keys) => keys.some((key) => pressedKeys.includes(key))
});

const createSpawnedPlayer = () => new Player(
  PLAYER_SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
  PLAYER_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
);

const setGamePlayerOnTile = (game, x, y, facing = { x: 1, y: 0 }) => {
  game.player.setPosition(
    x * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    y * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = facing;
};

const createMemoryStorage = () => {
  const data = new Map();
  return {
    calls: {
      getItem: 0,
      removeItem: 0,
      setItem: 0
    },
    getItem(key) {
      this.calls.getItem += 1;
      return data.get(key) || null;
    },
    removeItem(key) {
      this.calls.removeItem += 1;
      data.delete(key);
    },
    setItem(key, value) {
      this.calls.setItem += 1;
      data.set(key, value);
    }
  };
};

const createRectElement = (rect, options = {}) => ({
  hidden: options.hidden || false,
  innerHTML: '',
  dataset: options.dataset || {},
  disabled: options.disabled || false,
  classList: {
    toggle() {}
  },
  getBoundingClientRect() {
    return {
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height
    };
  },
  querySelector(selector) {
    return options.querySelector?.(selector) || null;
  },
  querySelectorAll(selector) {
    return options.querySelectorAll?.(selector) || [];
  }
});

const createPointerEvent = (clientX, clientY) => ({
  clientX,
  clientY,
  pointerId: 1,
  defaultPrevented: false,
  propagationStopped: false,
  preventDefault() {
    this.defaultPrevented = true;
  },
  stopPropagation() {
    this.propagationStopped = true;
  }
});

const createInteractiveRectElement = (rect, options = {}) => {
  const listeners = {};
  const classNames = new Set();

  return {
    ...createRectElement(rect, options),
    classList: {
      add(className) {
        classNames.add(className);
      },
      remove(className) {
        classNames.delete(className);
      },
      contains(className) {
        return classNames.has(className);
      },
      toggle() {}
    },
    style: {},
    listeners,
    addEventListener(type, callback) {
      listeners[type] = callback;
    },
    setPointerCapture() {},
    releasePointerCapture() {}
  };
};

const createDrawContext = () => {
  const calls = [];
  return {
    calls,
    fillStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    strokeStyle: '',
    fillRect(...args) {
      calls.push({ fn: 'fillRect', args, fillStyle: this.fillStyle, globalAlpha: this.globalAlpha });
    },
    arc(...args) {
      calls.push({ fn: 'arc', args, fillStyle: this.fillStyle });
    },
    beginPath() {
      calls.push({ fn: 'beginPath' });
    },
    createLinearGradient() {
      const stops = [];
      return {
        stops,
        addColorStop(offset, color) {
          stops.push({ offset, color });
        }
      };
    },
    createRadialGradient() {
      const stops = [];
      return {
        stops,
        addColorStop(offset, color) {
          stops.push({ offset, color });
        }
      };
    },
    fill() {
      calls.push({ fn: 'fill', fillStyle: this.fillStyle });
    },
    fillText(...args) {
      calls.push({ fn: 'fillText', args, fillStyle: this.fillStyle });
    },
    restore() {
      calls.push({ fn: 'restore' });
    },
    save() {
      calls.push({ fn: 'save' });
    },
    strokeRect(...args) {
      calls.push({ fn: 'strokeRect', args, strokeStyle: this.strokeStyle });
    }
  };
};

const map = new TileMap();

{
  const indexHtml = readFileSync('index.html', 'utf8');
  const styles = readFileSync('src/styles.css', 'utf8');
  const mainScript = readFileSync('src/main.js', 'utf8');

  assert.equal(indexHtml.includes('maximum-scale=1'), true, 'mobile viewport caps pinch and double-tap zoom scale');
  assert.equal(indexHtml.includes('user-scalable=no'), true, 'mobile viewport disables browser double-tap zoom');
  assert.equal(styles.includes('touch-action: pan-y'), true, 'menu panels keep vertical touch scrolling enabled');
  assert.equal(styles.includes('-webkit-overflow-scrolling: touch'), true, 'menu panels keep momentum scrolling on mobile Safari');
  assert.equal(styles.includes('width: min(100vw, calc(100vh * 16 / 9))'), false, 'game canvas no longer letterboxes landscape into a fixed 16:9 box');
  assert.equal(styles.includes('height: 100dvh;'), true, 'game canvas fills the dynamic viewport height');
  assert.equal(styles.includes('bottom: max(6px, calc(env(safe-area-inset-bottom) + 6px));'), true, 'mobile hotbar sits close to the safe-area edge');
  assert.equal(mainScript.includes("closest?.('#inventory-panel, #crafting-panel, #build-panel, #cooking-panel, #furnace-panel')"), true, 'menu touch events are exempt from gameplay touch prevention');
}

{
  assert.equal(isPortraitViewport({ width: 390, height: 844 }), true, 'portrait viewport is detected');
  assert.equal(isPortraitViewport({ width: 844, height: 390 }), false, 'landscape viewport is detected');

  const classNames = new Set();
  const root = {
    classList: {
      toggle(className, enabled) {
        if (enabled) classNames.add(className);
        else classNames.delete(className);
      }
    }
  };

  assert.equal(updateOrientationState({ root, viewport: { innerWidth: 390, innerHeight: 844 } }), 'portrait', 'orientation state reports portrait');
  assert.equal(classNames.has('is-portrait'), true, 'orientation state marks portrait root class');
  assert.equal(updateOrientationState({ root, viewport: { innerWidth: 844, innerHeight: 390 } }), 'landscape', 'orientation state reports landscape');
  assert.equal(classNames.has('is-landscape'), true, 'orientation state marks landscape root class');
}

{
  const listeners = {};
  globalThis.window = {
    addEventListener(type, callback) {
      listeners[type] = callback;
    }
  };

  const { Input } = await import(`../src/core/input.js?test=${Date.now()}`);
  const input = new Input();
  let prevented = false;

  listeners.keydown({
    key: 'ArrowRight',
    preventDefault() {
      prevented = true;
    }
  });

  assert.equal(input.isDown('ArrowRight'), true, 'keydown registers arrow movement');
  assert.equal(input.getDebugState().lastKey, 'ArrowRight', 'input tracks last key');
  assert.deepEqual(input.getMovementKeys(), ['ArrowRight'], 'input exposes active movement keys');
  assert.equal(prevented, true, 'arrow key default behavior is prevented');

  listeners.keydown({
    key: 'b',
    preventDefault() {}
  });

  assert.equal(input.wasPressed('b'), true, 'keydown registers earth placement key');

  prevented = false;
  listeners.keydown({
    key: '3',
    preventDefault() {
      prevented = true;
    }
  });
  assert.equal(input.wasPressed('3'), true, 'keydown registers hotbar slot key');
  assert.equal(prevented, true, 'hotbar slot key default behavior is prevented');

  prevented = false;
  listeners.keydown({
    key: 'I',
    preventDefault() {
      prevented = true;
    }
  });
  assert.equal(input.wasPressed('i'), true, 'keydown registers inventory key');
  assert.equal(prevented, true, 'inventory key default behavior is prevented');

  prevented = false;
  listeners.keydown({
    key: 'C',
    preventDefault() {
      prevented = true;
    }
  });
  assert.equal(input.wasPressed('c'), true, 'keydown registers crafting key');
  assert.equal(prevented, true, 'crafting key default behavior is prevented');

  input.consumeFramePresses();
  prevented = false;
  listeners.keydown({
    key: 'C',
    target: { tagName: 'INPUT' },
    preventDefault() {
      prevented = true;
    }
  });
  assert.equal(input.wasPressed('c'), false, 'typing in an input does not trigger game shortcuts');
  assert.equal(prevented, false, 'typing in an input is not prevented by game input');

  prevented = false;
  listeners.keydown({
    key: 'P',
    preventDefault() {
      prevented = true;
    }
  });
  assert.equal(input.wasPressed('p'), true, 'keydown registers P debug key');
  assert.equal(input.getDebugState().lastKey, 'p', 'input normalizes P debug key');
  assert.equal(prevented, true, 'P default behavior is prevented');

  prevented = false;
  listeners.keydown({
    key: 'r',
    preventDefault() {
      prevented = true;
    }
  });
  assert.equal(input.isDown('r'), true, 'keydown keeps reset key held');
  assert.equal(prevented, true, 'reset key default behavior is prevented');

  listeners.keyup({
    key: 'ArrowRight',
    preventDefault() {}
  });

  assert.equal(input.isDown('ArrowRight'), false, 'keyup clears arrow movement');
}

{
  const player = createSpawnedPlayer();
  const startX = player.x;

  player.update(0.25, inputWith('d'), map);

  assert.ok(player.x > startX, 'player moves freely to the right');
}

{
  const joystick = createInteractiveRectElement({ left: 0, top: 0, width: 100, height: 100 });
  const knob = createInteractiveRectElement({ left: 0, top: 0, width: 40, height: 40 });
  const actionButton = createInteractiveRectElement({ left: 200, top: 0, width: 80, height: 80 });
  const touchInput = new TouchInput({
    actionButton,
    joystickElement: joystick,
    joystickKnobElement: knob
  });

  joystick.listeners.pointerdown({ ...createPointerEvent(50, 50), pointerId: 11 });
  joystick.listeners.pointermove({ ...createPointerEvent(100, 50), pointerId: 11 });
  actionButton.listeners.pointerdown({ ...createPointerEvent(220, 20), pointerId: 22 });

  assert.ok(touchInput.getMovementVector().x > 0.9, 'joystick input produces a rightward movement vector');
  assert.equal(touchInput.getDebugState().joystickActive, true, 'joystick keeps its own active pointer');
  assert.equal(touchInput.getDebugState().actionPressed, true, 'action button tracks its own touch pointer');
  assert.equal(touchInput.getDebugState().pointerCount, 2, 'multi-touch separates joystick and action pointers');
  assert.equal(touchInput.consumeActionPress(), true, 'action press can be consumed once');
  assert.equal(touchInput.consumeActionPress(), false, 'consumed action press does not repeat');

  actionButton.listeners.pointerup({ ...createPointerEvent(220, 20), pointerId: 22 });
  assert.equal(touchInput.getDebugState().joystickActive, true, 'releasing action does not cancel joystick movement');
  joystick.listeners.pointercancel({ ...createPointerEvent(100, 50), pointerId: 11 });
  assert.deepEqual(touchInput.getMovementVector(), { x: 0, y: 0 }, 'pointercancel clears joystick movement');
}

{
  const previousWidth = globalThis.innerWidth;
  globalThis.innerWidth = 800;
  const pointerListeners = {};
  const pointerTarget = {
    addEventListener(type, callback) {
      pointerListeners[type] = callback;
    }
  };
  const joystick = createInteractiveRectElement({ left: 64, top: 144, width: 112, height: 112 });
  const knob = createInteractiveRectElement({ left: 44, top: 44, width: 40, height: 40 });
  const touchInput = new TouchInput({
    joystickElement: joystick,
    joystickKnobElement: knob,
    pointerTarget
  });
  const freeTarget = { closest: () => null };

  pointerListeners.pointerdown({ ...createPointerEvent(120, 200), pointerId: 61, target: freeTarget });
  assert.equal(touchInput.getDebugState().joystickActive, true, 'dynamic joystick starts from a free left-side touch');
  assert.deepEqual(touchInput.getDebugState().joystickOrigin, { x: 120, y: 200 }, 'dynamic joystick origin is the touch start point');
  assert.equal(joystick.hidden, false, 'dynamic joystick becomes visible while held');
  assert.equal(joystick.style.left, '120px', 'dynamic joystick is positioned at the touch origin');

  pointerListeners.pointermove({ ...createPointerEvent(176, 200), pointerId: 61, target: freeTarget });
  assert.ok(touchInput.getMovementVector().x > 0.9, 'dynamic joystick movement is relative to the origin');

  pointerListeners.pointerup({ ...createPointerEvent(176, 200), pointerId: 61, target: freeTarget });
  assert.equal(joystick.hidden, true, 'dynamic joystick hides after release');
  assert.deepEqual(touchInput.getMovementVector(), { x: 0, y: 0 }, 'dynamic joystick clears movement after release');
  globalThis.innerWidth = previousWidth;
}

{
  const previousWidth = globalThis.innerWidth;
  globalThis.innerWidth = 800;
  const pointerListeners = {};
  const pointerTarget = {
    addEventListener(type, callback) {
      pointerListeners[type] = callback;
    }
  };
  const joystick = createInteractiveRectElement({ left: 0, top: 0, width: 112, height: 112 });
  const touchInput = new TouchInput({
    joystickElement: joystick,
    pointerTarget
  });
  const uiTarget = { closest: () => ({}) };

  pointerListeners.pointerdown({ ...createPointerEvent(120, 200), pointerId: 62, target: uiTarget });
  assert.equal(touchInput.getDebugState().joystickActive, false, 'dynamic joystick does not start over UI');
  assert.equal(joystick.hidden, true, 'dynamic joystick stays hidden when UI blocks the touch');
  pointerListeners.pointerdown({ ...createPointerEvent(620, 200), pointerId: 63, target: { closest: () => null } });
  assert.equal(touchInput.getDebugState().joystickActive, false, 'dynamic joystick does not start in the right screen half');
  pointerListeners.pointerdown({ ...createPointerEvent(120, 200), pointerId: 64, pointerType: 'mouse', target: { closest: () => null } });
  assert.equal(touchInput.getDebugState().joystickActive, false, 'dynamic joystick does not start from desktop mouse clicks');
  globalThis.innerWidth = previousWidth;
}

{
  const log = new LogSystem();
  for (let index = 1; index <= 7; index += 1) {
    log.add(`Eintrag ${index}`);
  }

  assert.deepEqual(
    log.toJSON(),
    ['Eintrag 7', 'Eintrag 6', 'Eintrag 5', 'Eintrag 4', 'Eintrag 3'],
    'log system keeps the latest five entries newest-first'
  );
}

{
  const player = createSpawnedPlayer();
  const startX = player.x;
  const input = inputWith();
  input.getVirtualMovement = () => ({ x: 1, y: 0 });

  player.update(0.25, input, map);

  assert.ok(player.x > startX, 'virtual joystick movement moves the player');
}

{
  const supportedPoint = map.tileToWorld(1, 1);
  const voidPoint = map.tileToWorld(2, 1);

  assert.equal(
    map.isPositionSupportedByTile(supportedPoint.x + TILE_SIZE / 2, supportedPoint.y + TILE_SIZE / 2),
    true,
    'player stand point on an existing tile is safe'
  );
  assert.equal(
    map.isPositionSupportedByTile(voidPoint.x + TILE_SIZE / 2, voidPoint.y + TILE_SIZE / 2),
    false,
    'player stand point directly beside an existing tile is void'
  );
}

{
  const terrainMap = new TileMap();
  terrainMap.setGrass(1, 0);
  terrainMap.setStone(2, 0);
  const context = createDrawContext();
  const terrainRenderer = new TerrainRenderer();

  terrainRenderer.drawTile(context, { x: 1, y: 0, type: 'grass' }, terrainMap, 32, 0);
  terrainRenderer.drawTile(context, { x: 2, y: 0, type: 'stone' }, terrainMap, 64, 0);

  assert.ok(context.calls.filter((call) => call.fn === 'fillRect').length > 12, 'terrain renderer draws structured pixel-art tile layers');
  assert.equal(terrainMap.isGround(1, 0), true, 'grass remains a support tile after renderer changes');
  assert.equal(terrainMap.isGround(2, 0), true, 'stone remains a support tile after renderer changes');
}

{
  const player = createSpawnedPlayer();

  for (let i = 0; i < 20; i += 1) {
    player.update(0.05, inputWith('w'), map);
  }

  assert.notEqual(player.getTilePosition().y, map.crystal.y, 'player does not walk through the crystal');
}

{
  const player = createSpawnedPlayer();

  for (let i = 0; i < 20; i += 1) {
    player.update(0.05, inputWith('d'), map);
  }

  const foot = player.getFootPosition();
  assert.equal(map.isVoidAtWorld(foot.x, foot.y), true, 'player can leave the island and reach the void');
  assert.equal(map.isGroundAtWorld(foot.x, foot.y), false, 'void starts as soon as the foot point has no tile under it');
}

{
  const rowMap = new TileMap();
  for (let y = 2; y <= 8; y += 1) {
    rowMap.setEarth(0, y);
  }

  const onRow = rowMap.tileToWorld(0, 7);
  const besideRow = rowMap.tileToWorld(1, 7);

  assert.equal(
    rowMap.isPositionSupportedByTile(onRow.x + TILE_SIZE / 2, onRow.y + TILE_SIZE / 2),
    true,
    'long placed tile row is safe on the actual row'
  );
  assert.equal(
    rowMap.isPositionSupportedByTile(besideRow.x + TILE_SIZE / 2, besideRow.y + TILE_SIZE / 2),
    false,
    'long placed tile row does not create safe space beside it'
  );
}

{
  const lShapeMap = new TileMap();
  lShapeMap.setEarth(2, 0);
  lShapeMap.setEarth(3, 0);
  lShapeMap.setEarth(4, 0);

  const safeOnArm = lShapeMap.tileToWorld(4, 0);
  const gapInOldBounds = lShapeMap.tileToWorld(4, 1);

  assert.equal(
    lShapeMap.isGroundAtWorld(safeOnArm.x + TILE_SIZE / 2, safeOnArm.y + TILE_SIZE / 2),
    true,
    'placed earth tiles are safe individually'
  );
  assert.equal(
    lShapeMap.isGroundAtWorld(gapInOldBounds.x + TILE_SIZE / 2, gapInOldBounds.y + TILE_SIZE / 2),
    false,
    'missing tiles inside a wider island shape are still void'
  );
}

{
  const holeMap = new TileMap();
  for (let y = 2; y <= 4; y += 1) {
    for (let x = 2; x <= 4; x += 1) {
      if (x !== 3 || y !== 3) {
        holeMap.setEarth(x, y);
      }
    }
  }

  const solid = holeMap.tileToWorld(2, 3);
  const hole = holeMap.tileToWorld(3, 3);

  assert.equal(
    holeMap.isPositionSupportedByTile(solid.x + TILE_SIZE / 2, solid.y + TILE_SIZE / 2),
    true,
    'built tile inside a structure is safe'
  );
  assert.equal(
    holeMap.isPositionSupportedByTile(hole.x + TILE_SIZE / 2, hole.y + TILE_SIZE / 2),
    false,
    'hole inside a built structure is void'
  );
}

{
  const player = createSpawnedPlayer();
  assert.equal(map.isPlayerSupported(player), true, 'spawned player is supported by a real tile');
}

{
  const player = createSpawnedPlayer();
  const foot = player.getFootPosition();

  assert.equal(
    map.isNearCrystalWorld(foot.x, foot.y, CRYSTAL_INTERACTION_DISTANCE),
    true,
    'spawn tile is close enough to activate the crystal'
  );
}

{
  globalThis.window = { addEventListener() {} };
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.player.setPosition(TILE_SIZE * 5, TILE_SIZE * 5);
  game.handleVoidFall();

  assert.deepEqual(game.player.getTilePosition(), PLAYER_SPAWN_TILE, 'void fall respawns beside the crystal');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.tileMap.setEarth(2, 0);
  game.tileMap.setEarth(3, 0);
  game.tileMap.setEarth(4, 0);
  game.player.setPosition(
    4 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );

  game.handleVoidFall();

  assert.deepEqual(game.player.getTilePosition(), PLAYER_SPAWN_TILE, 'gap inside extended island shape triggers respawn');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  assert.deepEqual(game.hotbarSlots, DEFAULT_HOTBAR_SLOTS, 'new games start with the default four hotbar slots');
  assert.equal(game.activeHotbarSlot, 0, 'first hotbar slot is active by default');
  assert.equal(game.getActiveHotbarItem(), 'earth', 'earth is the default active hotbar item');
  game.input.pressedThisFrame.add('2');
  game.handleHotbarSelection();
  assert.equal(game.activeHotbarSlot, 1, 'number keys select hotbar slots');
  assert.equal(game.getActiveHotbarItem(), 'rawWood', 'active hotbar item follows the selected slot');

  game.selectHotbarResource('fiber');
  assert.equal(game.activeHotbarSlot, 2, 'selecting an assigned resource activates its slot');
  game.hotbarSlots[2] = null;
  assert.equal(game.getActiveHotbarItem(), null, 'hotbar slots may be empty');
  assert.equal(game.selectHotbarResource('unknown'), false, 'hotbar selection rejects unknown resources');
  assert.equal(game.activeHotbarSlot, 2, 'invalid hotbar resource does not change selection');

  game.hotbarSlots = ['torch', 'campfire', 'woodWall', 'table'];
  game.selectInventoryResource('chair');
  game.handleHotbarSlotClick(3);
  assert.equal(game.hotbarSlots.length, HOTBAR_SLOT_COUNT, 'hotbar keeps exactly four slots after assigning new items');
  assert.deepEqual(game.hotbarSlots, ['torch', 'campfire', 'woodWall', 'chair'], 'inventory hotbar assignment replaces a slot instead of adding one');
}

{
  const element = {
    innerHTML: ''
  };
  const hotbar = new Hotbar(element);

  hotbar.update({
    inventory: { earth: 2, rawWood: 3, fiber: 4, grassSeed: 5 },
    activeSlot: 1,
    slots: ['earth', 'rawWood', 'fiber', 'grassSeed']
  });

  assert.equal((element.innerHTML.match(/data-hotbar-slot=/g) || []).length, HOTBAR_SLOT_COUNT, 'hotbar renders exactly four slots');
  assert.equal(element.innerHTML.includes('data-resource="earth"'), true, 'hotbar renders earth slot');
  assert.equal(element.innerHTML.includes('data-resource="rawWood"'), true, 'hotbar renders raw wood slot');
  assert.equal(element.innerHTML.includes('is-active'), true, 'hotbar marks the active slot');

  hotbar.update({
    inventory: { earth: 2, rawWood: 3, fiber: 4, grassSeed: 5, workbench: 1 },
    activeSlot: 0,
    slots: ['workbench', null, 'fiber', 'grassSeed']
  });
  assert.equal(element.innerHTML.includes('data-resource="workbench"'), true, 'hotbar shows workbench once available');
  assert.equal(element.innerHTML.includes('is-empty'), true, 'hotbar can render empty assigned slots');
}

{
  let pointerdown = null;
  const pointerTarget = {
    addEventListener(type, callback) {
      if (type === 'pointerdown') pointerdown = callback;
    }
  };
  let selectedSlot = null;
  const canvas = {
    width: 960,
    height: 540,
    dataset: {
      logicalWidth: '960',
      logicalHeight: '540'
    },
    focus() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 480, height: 270 };
    }
  };
  const hotbarSlot = createRectElement(
    { left: 100, top: 400, width: 80, height: 56 },
    { dataset: { hotbarSlot: '3', resource: 'grassSeed' } }
  );
  const hitboxes = new PointerHitboxSystem({
    canvas,
    hotbarElement: createRectElement(
      { left: 90, top: 390, width: 100, height: 76 },
      { querySelectorAll: () => [hotbarSlot] }
    ),
    onHotbarSelect(slotIndex) {
      selectedSlot = slotIndex;
    },
    pointerTarget
  });

  const canvasPoint = hitboxes.clientToCanvasPoint(240, 135);
  assert.equal(canvasPoint.x, 480, 'pointer maps browser x coordinate into canvas space');
  assert.equal(canvasPoint.y, 270, 'pointer maps browser y coordinate into canvas space');

  const event = createPointerEvent(120, 420);
  pointerdown(event);

  assert.equal(selectedSlot, 3, 'hotbar slot can be selected by pointer hitbox');
  assert.equal(event.defaultPrevented, true, 'hotbar UI pointer event is consumed');
  assert.equal(event.propagationStopped, true, 'hotbar UI pointer event does not leak into gameplay');
}

{
  let pointerdown = null;
  const pointerTarget = {
    addEventListener(type, callback) {
      if (type === 'pointerdown') pointerdown = callback;
    }
  };
  const canvas = {
    width: 1920,
    height: 1080,
    dataset: {
      logicalWidth: '960',
      logicalHeight: '540'
    },
    focus() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 480, height: 270 };
    }
  };
  let inventoryToggled = false;
  let hotbarSelected = false;
  const overlappingButton = createRectElement({ left: 100, top: 100, width: 80, height: 50 });
  const overlappingSlot = createRectElement(
    { left: 100, top: 100, width: 80, height: 50 },
    { dataset: { hotbarSlot: '0', resource: 'earth' } }
  );
  const hitboxes = new PointerHitboxSystem({
    canvas,
    hotbarElement: createRectElement(
      { left: 90, top: 90, width: 120, height: 80 },
      { querySelectorAll: () => [overlappingSlot] }
    ),
    inventoryButton: overlappingButton,
    onHotbarSelect() {
      hotbarSelected = true;
    },
    onInventoryToggle() {
      inventoryToggled = true;
    },
    pointerTarget
  });

  const canvasPoint = hitboxes.clientToCanvasPoint(240, 135);
  assert.equal(canvasPoint.x, 480, 'pointer mapping uses logical canvas width instead of DPR backing width');
  assert.equal(canvasPoint.y, 270, 'pointer mapping uses logical canvas height instead of DPR backing height');

  pointerdown(createPointerEvent(120, 120));
  assert.equal(inventoryToggled, true, 'top menu hitbox wins over overlapping lower-priority hotbar');
  assert.equal(hotbarSelected, false, 'lower-priority hotbar hitbox is not triggered by top menu click');
}

{
  const previousPixelRatio = globalThis.devicePixelRatio;
  globalThis.devicePixelRatio = 2;
  const context = {
    transform: null,
    setTransform(...args) {
      this.transform = args;
    }
  };
  const canvas = {
    dataset: {},
    focus() {},
    addEventListener() {},
    getContext: () => context
  };
  const { Game } = await import('../src/core/game.js');
  const game = new Game(canvas, { innerHTML: '' });

  game.resizeCanvas();

  assert.equal(canvas.width, GAME_VIEW.width * 2, 'canvas backing width scales with devicePixelRatio');
  assert.equal(canvas.height, GAME_VIEW.height * 2, 'canvas backing height scales with devicePixelRatio');
  assert.equal(canvas.dataset.logicalWidth, String(GAME_VIEW.width), 'canvas stores logical width for pointer mapping');
  assert.deepEqual(context.transform, [2, 0, 0, 2, 0, 0], 'render context is scaled back to logical game units');
  globalThis.devicePixelRatio = previousPixelRatio;
}

{
  let pointerdown = null;
  const pointerTarget = {
    addEventListener(type, callback) {
      if (type === 'pointerdown') pointerdown = callback;
    }
  };
  const canvas = {
    width: 960,
    height: 540,
    focus() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 960, height: 540 };
    }
  };
  const inventoryItem = createRectElement(
    { left: 320, top: 150, width: 260, height: 32 },
    { dataset: { inventoryResource: 'stone' } }
  );
  const inventoryHotbarSlot = createRectElement(
    { left: 420, top: 260, width: 80, height: 56 },
    { dataset: { inventoryHotbarSlot: '1' } }
  );
  const inventoryPanel = createRectElement(
    { left: 300, top: 90, width: 360, height: 260 },
    {
      querySelectorAll: (selector) => {
        if (selector === '[data-inventory-resource]') return [inventoryItem];
        if (selector === '[data-inventory-hotbar-slot]') return [inventoryHotbarSlot];
        return [];
      }
    }
  );

  const { Game } = await import('../src/core/game.js');
  const game = new Game(
    {
      getContext: () => ({}),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 })
    },
    { innerHTML: '' },
    {
      inventoryPanel,
      pointerTarget
    }
  );
  game.inventoryOpen = true;

  pointerdown(createPointerEvent(330, 160));
  assert.equal(game.selectedInventoryResource, 'stone', 'inventory item click selects an item for hotbar assignment');

  pointerdown(createPointerEvent(430, 270));
  assert.equal(game.hotbarSlots[1], 'stone', 'clicking the inventory hotbar assigns the selected inventory item');
  assert.equal(game.activeHotbarSlot, 1, 'assigned hotbar slot becomes active');
}

{
  let pointerdown = null;
  const pointerTarget = {
    addEventListener(type, callback) {
      if (type === 'pointerdown') pointerdown = callback;
    }
  };
  const canvas = {
    width: 960,
    height: 540,
    focus() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 960, height: 540 };
    }
  };
  const tabButton = createRectElement(
    { left: 310, top: 120, width: 96, height: 40 },
    { dataset: { inventoryTab: 'tools' } }
  );
  const inventoryPanel = createRectElement(
    { left: 300, top: 90, width: 360, height: 220 },
    { querySelectorAll: () => [tabButton] }
  );
  const recipeButton = createRectElement(
    { left: 330, top: 140, width: 150, height: 42 },
    { dataset: { craftSelect: 'woodenSpear' } }
  );
  const craftingPanel = createRectElement(
    { left: 300, top: 90, width: 360, height: 220 },
    { querySelectorAll: () => [recipeButton] }
  );
  let selectedTab = null;
  let selectedRecipe = null;
  const hitboxes = new PointerHitboxSystem({
    canvas,
    craftingPanel,
    getCraftingOpen: () => false,
    getInventoryOpen: () => true,
    inventoryPanel,
    onCraftSelect(recipeId) {
      selectedRecipe = recipeId;
    },
    onInventoryTabSelect(tabId) {
      selectedTab = tabId;
    },
    pointerTarget
  });

  pointerdown(createPointerEvent(320, 130));
  assert.equal(selectedTab, 'tools', 'inventory tab can be selected by pointer hitbox');

  hitboxes.getCraftingOpen = () => true;
  hitboxes.getInventoryOpen = () => false;
  pointerdown(createPointerEvent(340, 150));
  assert.equal(selectedRecipe, 'woodenSpear', 'crafting recipe can be selected by pointer hitbox');
}

{
  let pointerdown = null;
  const pointerTarget = {
    addEventListener(type, callback) {
      if (type === 'pointerdown') pointerdown = callback;
    }
  };
  const canvas = {
    width: 960,
    height: 540,
    focus() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 960, height: 540 };
    }
  };
  const hotbarSlot = createRectElement(
    { left: 420, top: 460, width: 80, height: 56 },
    { dataset: { hotbarSlot: '2', resource: 'fiber' } }
  );
  let selectedSlot = null;
  const hitboxes = new PointerHitboxSystem({
    canvas,
    getInventoryOpen: () => true,
    hotbarElement: createRectElement(
      { left: 410, top: 450, width: 100, height: 76 },
      { querySelectorAll: () => [hotbarSlot] }
    ),
    onHotbarSelect(slotIndex) {
      selectedSlot = slotIndex;
    },
    pointerTarget
  });

  pointerdown(createPointerEvent(430, 470));
  assert.equal(selectedSlot, null, 'normal hotbar hitbox is inactive while a menu is open');

  hitboxes.getInventoryOpen = () => false;
  pointerdown(createPointerEvent(430, 470));
  assert.equal(selectedSlot, 2, 'normal hotbar hitbox works again after menus close');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.input.pressedThisFrame.add('i');
  game.handleMenuToggles();
  assert.equal(game.inventoryOpen, true, 'I opens inventory');
  assert.equal(game.craftingOpen, false, 'opening inventory keeps crafting closed');
  game.input.consumeFramePresses();

  game.input.pressedThisFrame.add('i');
  game.handleMenuToggles();
  assert.equal(game.inventoryOpen, false, 'I closes inventory');
  game.input.consumeFramePresses();

  game.input.pressedThisFrame.add('c');
  game.handleMenuToggles();
  assert.equal(game.craftingOpen, true, 'C opens crafting');
  assert.equal(game.craftingContext, 'normal', 'C opens normal crafting context');
  assert.equal(game.inventoryOpen, false, 'opening crafting keeps inventory closed');
  game.input.consumeFramePresses();

  game.input.pressedThisFrame.add('c');
  game.handleMenuToggles();
  assert.equal(game.craftingOpen, false, 'C closes crafting');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  assert.equal(game.isGamePaused(), false, 'new game starts unpaused');
  game.inventoryOpen = true;
  assert.equal(game.isGamePaused(), true, 'open inventory pauses the game');
  game.inventoryOpen = false;
  game.craftingOpen = true;
  game.craftingContext = 'normal';
  assert.equal(game.isGamePaused(), true, 'open normal crafting pauses the game');
  game.craftingContext = 'workbench';
  assert.equal(game.isGamePaused(), true, 'open workbench crafting pauses the game');
  game.craftingOpen = false;
  assert.equal(game.isGamePaused(), false, 'closing menus unpauses the game');
}

{
  const actionButton = createInteractiveRectElement({ left: 800, top: 400, width: 80, height: 80 });
  const attackButton = createInteractiveRectElement({ left: 720, top: 400, width: 80, height: 80 });
  const joystick = createInteractiveRectElement({ left: 0, top: 0, width: 100, height: 100 });
  const knob = createInteractiveRectElement({ left: 35, top: 35, width: 30, height: 30 });
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, {
    actionButton,
    attackButton,
    joystickElement: joystick,
    joystickKnobElement: knob
  });

  game.inventory.add('earth', 1);
  game.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };
  game.inventoryOpen = true;
  const startX = game.player.x;
  const startY = game.player.y;
  game.input.keys.add('d');
  joystick.listeners.pointerdown({ ...createPointerEvent(50, 50), pointerId: 41 });
  joystick.listeners.pointermove({ ...createPointerEvent(100, 50), pointerId: 41 });
  actionButton.listeners.pointerdown({ ...createPointerEvent(820, 420), pointerId: 42 });
  attackButton.listeners.pointerdown({ ...createPointerEvent(740, 420), pointerId: 43 });

  game.update(0.2);

  assert.equal(game.player.x, startX, 'paused game ignores keyboard and joystick movement');
  assert.equal(game.player.y, startY, 'paused game keeps the player position stable');
  assert.equal(game.tileMap.getTile(2, 0), null, 'paused game ignores action placement');
  assert.equal(game.inventory.get('earth'), 1, 'paused placement does not consume inventory');
  assert.equal(game.tryPlaceSelectedItem(), false, 'direct placement is blocked while paused');
  assert.equal(game.tryUseCrystal(), false, 'direct crystal interaction is blocked while paused');
  assert.equal(game.tryAttackAction(), false, 'direct attack is blocked while paused');
  assert.equal(game.touchInput.getDebugState().enabled, false, 'touch input is disabled while paused');
  game.enemySystem.spawnNearCrystal(game.tileMap);
  const enemy = game.enemySystem.enemies[0];
  const enemyX = enemy.x;
  const enemyY = enemy.y;
  game.update(0.5);
  assert.deepEqual({ x: enemy.x, y: enemy.y }, { x: enemyX, y: enemyY }, 'paused game stops enemy movement');

  game.input.pressedThisFrame.add('i');
  game.input.pressedThisFrame.add('b');
  game.update(0.016);
  assert.equal(game.inventoryOpen, false, 'menu close key closes inventory');
  assert.equal(game.tileMap.getTile(2, 0), null, 'gameplay stays paused for the frame that closes a menu');
}

{
  const hotbarElement = { hidden: false, innerHTML: '' };
  const touchControlsElement = { hidden: false };
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, {
    hotbarElement,
    touchControlsElement
  });

  game.inventoryOpen = true;
  game.update(0.016);
  assert.equal(hotbarElement.hidden, true, 'normal hotbar is hidden while a menu is open');
  assert.equal(touchControlsElement.hidden, true, 'touch controls are hidden while a menu is open');
  assert.equal(game.getDebugState().paused, true, 'debug state exposes the pause state');

  game.inventoryOpen = false;
  game.update(0.016);
  assert.equal(hotbarElement.hidden, false, 'normal hotbar returns when menus close');
  assert.equal(touchControlsElement.hidden, false, 'touch controls return when menus close');
  assert.equal(game.getDebugState().paused, false, 'debug state updates after unpausing');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  const startTime = game.dayNightSystem.time;
  game.update(12);
  assert.ok(game.dayNightSystem.time > startTime, 'day-night time advances during active gameplay');

  game.inventoryOpen = true;
  const pausedTime = game.dayNightSystem.time;
  game.update(12);
  assert.equal(game.dayNightSystem.time, pausedTime, 'day-night time pauses while a menu is open');

  game.dayNightSystem.load(0.47);
  assert.equal(game.dayNightSystem.getPhase(), 'Dämmerung', 'day-night system reports dusk phase');
  assert.equal(game.getDebugState().dayNightPhase, 'Dämmerung', 'debug state exposes day-night phase');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  assert.equal(game.openWorkbenchCrafting(), false, 'workbench crafting does not open away from a placed workbench');
  assert.equal(game.craftingOpen, false, 'failed workbench crafting open keeps menus closed');
  assert.equal(game.crystalSystem.lastMessage, 'Keine Werkbank in Reichweite.', 'failed workbench crafting open writes a clear log');

  game.tileMap.setWorkbench(1, 1);
  assert.equal(game.openWorkbenchCrafting(), true, 'workbench crafting opens near a placed workbench');
  assert.equal(game.craftingOpen, true, 'workbench crafting opens the crafting panel');
  assert.equal(game.craftingContext, 'workbench', 'workbench crafting uses the workbench recipe context');
}

{
  let pointerdown = null;
  const pointerTarget = {
    addEventListener(type, callback) {
      if (type === 'pointerdown') pointerdown = callback;
    }
  };
  const inventoryButton = createRectElement({ left: 420, top: 12, width: 54, height: 38 });
  const craftingButton = createRectElement({ left: 482, top: 12, width: 54, height: 38 });

  const { Game } = await import('../src/core/game.js');
  const game = new Game(
    {
      getContext: () => ({}),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 })
    },
    { innerHTML: '' },
    {
      craftingButton,
      inventoryButton,
      pointerTarget
    }
  );

  pointerdown(createPointerEvent(430, 20));
  assert.equal(game.inventoryOpen, true, 'inventory icon opens inventory');
  pointerdown(createPointerEvent(430, 20));
  assert.equal(game.inventoryOpen, false, 'inventory icon closes inventory');

  pointerdown(createPointerEvent(490, 20));
  assert.equal(game.craftingOpen, true, 'crafting icon opens crafting');
  assert.equal(game.inventoryOpen, false, 'crafting icon keeps inventory closed');
  pointerdown(createPointerEvent(490, 20));
  assert.equal(game.craftingOpen, false, 'crafting icon closes crafting');
}

{
  const inventory = new ResourceInventory();
  const crafting = new CraftingSystem(inventory);

  assert.equal(crafting.getWorkbenchRecipeState().canCraft, false, 'workbench recipe needs resources');
  assert.equal(crafting.craftWorkbench().crafted, false, 'crafting fails without resources');
  assert.equal(
    crafting.getRecipeStates({ craftingContext: 'normal' }).some((state) => state.recipe.id === 'woodenPickaxe'),
    false,
    'normal crafting does not show wooden pickaxe recipe'
  );
  assert.equal(
    crafting.getRecipeStates({ craftingContext: 'normal' }).some((state) => state.recipe.id === 'torch'),
    true,
    'normal crafting shows torch recipe'
  );
  assert.equal(
    crafting.getRecipeStates({ craftingContext: 'normal' }).some((state) => state.recipe.id === 'campfire'),
    true,
    'normal crafting shows campfire recipe'
  );
  assert.equal(
    crafting.getRecipeStates({ craftingContext: 'normal' }).some((state) => state.recipe.id === 'woodWall'),
    false,
    'normal crafting hides workbench building recipes'
  );
  assert.equal(
    crafting.getRecipeStates({ craftingContext: 'workbench', hasWorkbenchAccess: false }).find((state) => state.recipe.id === 'woodenSpear').isAvailable,
    false,
    'wooden spear recipe is unavailable without workbench access'
  );
  assert.equal(
    crafting.getRecipeStates({ craftingContext: 'workbench', hasWorkbenchAccess: true }).some((state) => state.recipe.id === 'table'),
    true,
    'workbench crafting shows table recipe'
  );
  assert.equal(
    crafting.getRecipeStates({ craftingContext: 'workbench', hasWorkbenchAccess: true }).some((state) => state.recipe.id === 'workbench'),
    false,
    'workbench crafting does not show basic workbench recipe'
  );

  inventory.add('rawWood', 5);
  inventory.add('fiber', 2);
  const result = crafting.craftWorkbench();

  assert.equal(result.crafted, true, 'workbench can be crafted with enough resources');
  assert.equal(inventory.get('rawWood'), 0, 'workbench crafting consumes raw wood');
  assert.equal(inventory.get('fiber'), 0, 'workbench crafting consumes fibers');
  assert.equal(inventory.get('workbench'), 1, 'workbench crafting adds a workbench item');
  assert.equal(result.message, 'Werkbank hergestellt.', 'workbench crafting returns a clear log message');

  inventory.add('rawWood', 8);
  inventory.add('fiber', 4);
  const pickaxeResult = crafting.craft('woodenPickaxe', { hasWorkbenchAccess: true });
  assert.equal(pickaxeResult.crafted, true, 'wooden pickaxe can be crafted near a workbench');
  assert.equal(inventory.get('rawWood'), 0, 'wooden pickaxe crafting consumes raw wood');
  assert.equal(inventory.get('fiber'), 0, 'wooden pickaxe crafting consumes fibers');
  assert.equal(inventory.get('woodenPickaxe'), 1, 'wooden pickaxe crafting adds the tool item');
  assert.equal(pickaxeResult.message, 'Holzspitzhacke hergestellt.', 'wooden pickaxe crafting returns a clear log message');

  inventory.add('rawWood', 6);
  inventory.add('fiber', 6);
  const spearResult = crafting.craft('woodenSpear', { hasWorkbenchAccess: true });
  assert.equal(spearResult.crafted, true, 'wooden spear can be crafted near a workbench');
  assert.equal(inventory.get('rawWood'), 0, 'wooden spear crafting consumes raw wood');
  assert.equal(inventory.get('fiber'), 0, 'wooden spear crafting consumes fibers');
  assert.equal(inventory.get('woodenSpear'), 1, 'wooden spear crafting adds the tool item');
  assert.equal(spearResult.message, 'Holzspeer hergestellt.', 'wooden spear crafting returns a clear log message');

  inventory.add('rawWood', 1);
  inventory.add('fiber', 1);
  const torchResult = crafting.craft('torch');
  assert.equal(torchResult.crafted, true, 'torch can be crafted in normal crafting');
  assert.equal(inventory.get('torch'), 1, 'torch crafting adds a torch item');
  assert.equal(torchResult.message, 'Fackel hergestellt.', 'torch crafting writes a clear log message');

  inventory.add('stone', 3);
  inventory.add('rawWood', 2);
  const campfireResult = crafting.craft('campfire');
  assert.equal(campfireResult.crafted, true, 'campfire can be crafted in normal crafting');
  assert.equal(inventory.get('campfire'), 1, 'campfire crafting adds a campfire item');
  assert.equal(campfireResult.message, 'Lagerfeuer hergestellt.', 'campfire crafting writes a clear log message');

  inventory.add('rawWood', 13);
  inventory.add('fiber', 4);
  const wallResult = crafting.craft('woodWall', { hasWorkbenchAccess: true });
  const tableResult = crafting.craft('table', { hasWorkbenchAccess: true });
  const chairResult = crafting.craft('chair', { hasWorkbenchAccess: true });
  assert.equal(wallResult.crafted, true, 'wood wall can be crafted near a workbench');
  assert.equal(tableResult.crafted, true, 'table can be crafted near a workbench');
  assert.equal(chairResult.crafted, true, 'chair can be crafted near a workbench');
  assert.equal(inventory.get('woodWall'), 1, 'wood wall crafting adds the buildable item');
  assert.equal(inventory.get('table'), 1, 'table crafting adds the buildable item');
  assert.equal(inventory.get('chair'), 1, 'chair crafting adds the buildable item');

  inventory.add('rawWood', 12);
  inventory.add('fiber', 12);
  crafting.craft('woodenSpear', { hasWorkbenchAccess: true });
  crafting.craft('woodenSpear', { hasWorkbenchAccess: true });
  assert.equal(inventory.get('woodenSpear'), 3, 'workbench crafting can run repeatedly while resources are available');
}

{
  const inventoryPanel = { hidden: true, innerHTML: '' };
  const craftingPanel = {
    hidden: true,
    innerHTML: ''
  };
  const inventory = new ResourceInventory();
  inventory.add('rawWood', 4);
  const menus = new MenuPanels({
    craftingPanel,
    inventoryPanel
  });
  const crafting = new CraftingSystem(inventory);

  menus.update({
    craftingOpen: true,
    activeHotbarSlot: 1,
    hotbarSlots: ['earth', 'stone', null, 'woodenSpear'],
    hasWorkbenchAccess: false,
    inventory,
    inventoryOpen: true,
    recipeStates: crafting.getRecipeStates({ craftingContext: 'normal', hasWorkbenchAccess: false }),
    selectedInventoryResource: 'rawWood'
  });

  assert.equal(inventoryPanel.hidden, false, 'inventory panel opens');
  assert.equal(inventoryPanel.innerHTML.includes('Erde'), true, 'inventory panel lists base resources');
  assert.equal(inventoryPanel.innerHTML.includes('Stein'), true, 'inventory panel lists stone resources');
  assert.equal(inventoryPanel.innerHTML.includes('Holzspeer'), true, 'inventory panel lists tool items even at zero count');
  assert.equal(inventoryPanel.innerHTML.includes('data-inventory-resource="rawWood"'), true, 'inventory panel exposes clickable item rows');
  assert.equal(inventoryPanel.innerHTML.includes('data-inventory-tab="tools"'), true, 'inventory panel exposes category tabs');
  assert.equal(inventoryPanel.innerHTML.includes('data-inventory-filter="true"'), true, 'inventory panel exposes a filter field');
  assert.equal(inventoryPanel.innerHTML.includes('Item anklicken, dann Hotbar-Slot anklicken'), true, 'inventory panel explains hotbar assignment');
  assert.equal(inventoryPanel.innerHTML.includes('data-inventory-hotbar-slot="1"'), true, 'inventory panel exposes its own hotbar assignment slots');
  assert.equal(inventoryPanel.innerHTML.includes('Hotbar 2: Stein'), true, 'inventory hotbar shows assigned slot labels');
  assert.equal(craftingPanel.hidden, false, 'crafting panel opens');
  assert.equal(craftingPanel.innerHTML.includes('Werkbank'), true, 'crafting panel shows workbench recipe');
  assert.equal(craftingPanel.innerHTML.includes('Fackel'), true, 'normal crafting panel shows torch recipe');
  assert.equal(craftingPanel.innerHTML.includes('Lagerfeuer'), true, 'normal crafting panel shows campfire recipe');
  assert.equal(craftingPanel.innerHTML.includes('Holzspitzhacke'), false, 'normal crafting hides workbench-gated recipe');
  assert.equal(craftingPanel.innerHTML.includes('Holzspeer'), false, 'normal crafting hides wooden spear recipe');
  assert.equal(craftingPanel.innerHTML.includes('Holzwand'), false, 'normal crafting hides workbench building recipe');
  assert.equal(craftingPanel.innerHTML.includes('data-craft-select="workbench"'), true, 'normal crafting exposes selectable workbench recipe');
  assert.equal(craftingPanel.innerHTML.includes('disabled'), true, 'crafting button is disabled when resources are missing');

  menus.selectInventoryTab('tools');
  menus.update({
    craftingContext: 'normal',
    craftingOpen: false,
    hotbarSlots: ['earth', 'stone', null, 'woodenSpear'],
    inventory,
    inventoryOpen: true,
    recipeStates: [],
    selectedInventoryResource: null
  });
  assert.equal(inventoryPanel.innerHTML.includes('Holzspitzhacke'), true, 'tools tab shows tool items');
  assert.equal(inventoryPanel.innerHTML.includes('Grassamen'), false, 'tools tab hides seed items');

  menus.setInventoryFilter('speer');
  menus.update({
    craftingContext: 'normal',
    craftingOpen: false,
    hotbarSlots: ['earth', 'stone', null, 'woodenSpear'],
    inventory,
    inventoryOpen: true,
    recipeStates: [],
    selectedInventoryResource: null
  });
  assert.equal(inventoryPanel.innerHTML.includes('Holzspeer'), true, 'inventory filter keeps matching items');
  assert.equal(inventoryPanel.innerHTML.includes('Holzspitzhacke'), false, 'inventory filter hides non-matching items');

  menus.update({
    craftingContext: 'workbench',
    craftingOpen: true,
    hotbarSlots: ['earth', 'stone', null, 'woodenSpear'],
    inventory,
    inventoryOpen: false,
    recipeStates: crafting.getRecipeStates({ craftingContext: 'workbench', hasWorkbenchAccess: true }),
    selectedInventoryResource: null
  });
  assert.equal(craftingPanel.innerHTML.includes('Werkbank'), true, 'workbench crafting title is shown');
  assert.equal(craftingPanel.innerHTML.includes('Holzspitzhacke'), true, 'workbench crafting shows pickaxe recipe');
  assert.equal(craftingPanel.innerHTML.includes('Holzspeer'), true, 'workbench crafting shows spear recipe');
  assert.equal(craftingPanel.innerHTML.includes('Holzwand'), true, 'workbench crafting shows wall recipe');
  assert.equal(craftingPanel.innerHTML.includes('Tisch'), true, 'workbench crafting shows table recipe');
  assert.equal(craftingPanel.innerHTML.includes('Stuhl'), true, 'workbench crafting shows chair recipe');
  assert.equal(craftingPanel.innerHTML.includes('data-craft-select="woodenPickaxe"'), true, 'crafting list exposes selectable recipes');
}

{
  let pointerdown = null;
  const pointerTarget = {
    addEventListener(type, callback) {
      if (type === 'pointerdown') pointerdown = callback;
    }
  };
  const inventory = new ResourceInventory();
  inventory.add('rawWood', 5);
  inventory.add('fiber', 2);
  const craftButton = createRectElement({ left: 340, top: 230, width: 280, height: 36 }, { dataset: { craft: 'workbench' } });
  const craftingPanel = createRectElement(
    { left: 300, top: 90, width: 360, height: 220 },
    { querySelectorAll: () => [craftButton] }
  );
  const { Game } = await import('../src/core/game.js');
  const game = new Game(
    {
      getContext: () => ({}),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 })
    },
    { innerHTML: '' },
    {
      craftingPanel,
      pointerTarget
    }
  );
  game.inventory.add('rawWood', 5);
  game.inventory.add('fiber', 2);
  game.craftingOpen = true;
  assert.equal(game.isGamePaused(), true, 'open crafting pauses gameplay before crafting button clicks');

  pointerdown(createPointerEvent(360, 240));

  assert.equal(game.inventory.get('rawWood'), 0, 'crafting button click consumes raw wood');
  assert.equal(game.inventory.get('fiber'), 0, 'crafting button click consumes fibers');
  assert.equal(game.inventory.get('workbench'), 1, 'crafting button click creates a workbench');
  assert.equal(game.crystalSystem.lastMessage, 'Werkbank hergestellt.', 'crafting button click writes the craft log');
}

{
  let pointerdown = null;
  const pointerTarget = {
    addEventListener(type, callback) {
      if (type === 'pointerdown') pointerdown = callback;
    }
  };
  const craftButton = createRectElement(
    { left: 340, top: 230, width: 280, height: 36 },
    { dataset: { craft: 'workbench' }, disabled: true }
  );
  const craftingPanel = createRectElement(
    { left: 300, top: 90, width: 360, height: 220 },
    { querySelectorAll: () => [craftButton] }
  );
  const { Game } = await import('../src/core/game.js');
  const game = new Game(
    {
      getContext: () => ({}),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 })
    },
    { innerHTML: '' },
    {
      craftingPanel,
      pointerTarget
    }
  );
  game.craftingOpen = true;
  assert.equal(game.isGamePaused(), true, 'disabled crafting button is still handled through paused menu UI');

  pointerdown(createPointerEvent(360, 240));

  assert.equal(game.inventory.get('workbench'), 0, 'disabled crafting button does not craft');
  assert.equal(game.crystalSystem.lastMessage, 'Nicht genug Material.', 'disabled crafting button writes a missing material log');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('earth', 2);
  game.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };

  const preview = game.getEarthPlacementPreview();
  assert.equal(preview.x, 2, 'placement preview uses the tile in front of the player');
  assert.equal(preview.y, 0, 'placement preview tracks the player facing direction');
  assert.equal(preview.canPlace, true, 'placement preview is valid for a free neighbor tile');

  assert.equal(game.tryPlaceEarth(), true, 'earth can be placed in front of the player');
  assert.equal(game.tileMap.getTile(2, 0), 'earth', 'placed earth becomes a world tile');
  assert.equal(game.inventory.get('earth'), 1, 'placing earth consumes one earth resource');
  assert.equal(game.crystalSystem.lastMessage, 'Erde platziert.', 'successful placement writes a clear log message');
}

{
  const actionButton = createInteractiveRectElement({ left: 800, top: 400, width: 80, height: 80 });
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { actionButton });

  game.inventory.add('earth', 1);
  game.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };
  actionButton.listeners.pointerdown({ ...createPointerEvent(820, 420), pointerId: 31 });
  game.update(0.016);

  assert.equal(game.tileMap.getTile(2, 0), 'earth', 'mobile action button places a valid selected item');
  assert.equal(game.inventory.get('earth'), 0, 'mobile action placement consumes the selected resource');
  assert.equal(game.crystalSystem.lastMessage, 'Erde platziert.', 'mobile action placement writes the existing placement log');
}

{
  const actionButton = createInteractiveRectElement({ left: 800, top: 400, width: 80, height: 80 });
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { actionButton });

  game.inventory.add('torch', 1);
  game.selectHotbarResource('torch');
  game.player.setPosition(
    0 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };
  actionButton.listeners.pointerdown({ ...createPointerEvent(820, 420), pointerId: 37 });
  game.update(0.016);

  assert.equal(game.tileMap.getObject(1, 1), 'torch', 'mobile action button places a selected buildable item');
  assert.equal(game.inventory.get('torch'), 0, 'mobile buildable placement consumes the selected item');
  assert.equal(game.crystalSystem.lastMessage, 'Fackel platziert.', 'mobile buildable placement writes a placement log');
}

{
  const actionButton = createInteractiveRectElement({ left: 800, top: 400, width: 80, height: 80 });
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { actionButton });

  actionButton.listeners.pointerdown({ ...createPointerEvent(820, 420), pointerId: 32 });
  game.update(0.016);

  const totalResources = Object.values(game.inventory.resources).reduce((sum, amount) => sum + amount, 0);
  assert.equal(totalResources, 0, 'mobile crystal action creates a visible drop instead of direct inventory');
  assert.equal(game.dropSystem.drops.length, 1, 'mobile crystal action spawns a visible drop');
  assert.equal(game.crystalSystem.lastMessage.includes('Kristall wirft'), true, 'mobile crystal action logs visible drop spawn');
  game.player.setPosition(game.dropSystem.drops[0].x - PLAYER_SIZE / 2, game.dropSystem.drops[0].y - PLAYER_SIZE + PLAYER_FOOT_OFFSET);
  game.update(0.016);
  assert.equal(Object.values(game.inventory.resources).reduce((sum, amount) => sum + amount, 0), 1, 'player collects visible crystal drop by proximity');
}

{
  const actionButton = createInteractiveRectElement({ left: 800, top: 400, width: 80, height: 80 });
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { actionButton });

  game.tileMap.setWorkbench(1, 1);
  actionButton.listeners.pointerdown({ ...createPointerEvent(820, 420), pointerId: 36 });
  game.update(0.016);

  assert.equal(game.craftingOpen, true, 'mobile action opens crafting when near a workbench');
  assert.equal(game.craftingContext, 'workbench', 'mobile action opens the workbench crafting context');
  assert.equal(game.crystalSystem.lastMessage, 'Werkbank geöffnet.', 'mobile workbench action writes a clear log');
}

{
  const attackButton = createInteractiveRectElement({ left: 720, top: 400, width: 80, height: 80 });
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { attackButton });

  game.crystalSystem.random = () => 0.1;
  game.inventory.add('woodenPickaxe', 1);
  game.hotbarSlots[0] = 'woodenPickaxe';
  game.activeHotbarSlot = 0;
  attackButton.listeners.pointerdown({ ...createPointerEvent(740, 420), pointerId: 33 });
  game.update(0.016);

  assert.equal(game.inventory.get('stone'), 0, 'mobile pickaxe attack creates a visible stone drop first');
  assert.equal(game.dropSystem.drops[0].resource, 'stone', 'mobile pickaxe attack uses stone drop logic');
  assert.equal(game.crystalSystem.lastMessage, 'Stein splittert heraus.', 'mobile pickaxe attack logs visible stone drop');
}

{
  const attackButton = createInteractiveRectElement({ left: 720, top: 400, width: 80, height: 80 });
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { attackButton });

  game.crystalSystem.random = () => 0.1;
  game.inventory.add('woodenSpear', 1);
  game.hotbarSlots[0] = 'woodenSpear';
  attackButton.listeners.pointerdown({ ...createPointerEvent(740, 420), pointerId: 34 });
  game.update(0.016);
  assert.equal(game.crystalSystem.lastMessage, 'Eine Kreatur erscheint!', 'mobile spear attack at the crystal starts an encounter');
  assert.equal(game.enemySystem.activeCount(), 1, 'mobile spear crystal attack spawns one enemy');

  game.hotbarSlots[0] = 'earth';
  attackButton.listeners.pointerdown({ ...createPointerEvent(740, 420), pointerId: 35 });
  game.update(0.016);
  assert.equal(game.crystalSystem.lastMessage, 'Keine Waffe ausgewählt.', 'mobile attack without weapon reports missing weapon');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.crystalSystem.random = () => 0.1;
  game.inventory.add('woodenPickaxe', 1);
  game.hotbarSlots[0] = 'woodenPickaxe';
  assert.equal(game.tryAttackAction(), true, 'wooden pickaxe attack works at the crystal');
  assert.equal(game.inventory.get('stone'), 0, 'wooden pickaxe attack spawns a visible drop before pickup');
  assert.equal(game.dropSystem.drops[0].resource, 'stone', 'wooden pickaxe attack uses stone drop logic');
  assert.equal(game.attackFeedback.type, 'crystalHit', 'wooden pickaxe attack shows crystal hit feedback');
  assert.equal(game.logSystem.entries.includes('Du schlägst Splitter aus dem Kristall.'), true, 'wooden pickaxe attack logs the hit');

  game.player.setPosition(6 * TILE_SIZE, 6 * TILE_SIZE);
  assert.equal(game.tryAttackAction(), false, 'wooden pickaxe attack fails without a valid target');
  assert.equal(game.crystalSystem.lastMessage, 'Kein Ziel für Spitzhacke.', 'wooden pickaxe without target writes a clear log');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.crystalSystem.random = () => 0.1;

  game.inventory.add('woodenSpear', 1);
  game.hotbarSlots[0] = 'woodenSpear';
  game.player.setPosition(6 * TILE_SIZE, 6 * TILE_SIZE);
  assert.equal(game.tryAttackAction(), false, 'spear attack without target fails cleanly');
  assert.equal(game.crystalSystem.lastMessage, 'Kein Ziel.', 'spear attack without target writes no-target log');
  assert.equal(game.attackFeedback.type, 'spear', 'spear attack shows attack arc feedback even on a miss');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.crystalSystem.random = () => 0.1;

  game.inventory.add('woodenSpear', 1);
  game.hotbarSlots[0] = 'woodenSpear';
  assert.equal(game.tryAttackAction(), true, 'spear attack at the crystal starts an encounter');
  assert.equal(game.enemySystem.activeCount(), 1, 'spear crystal encounter spawns one active enemy');
  assert.equal(game.enemySystem.enemies[0].hp, 4, 'enemy starts with four hit points');
  assert.equal(game.enemySystem.enemies[0].healthVisible, false, 'enemy health bar is hidden before first hit');

  const cappedSpawn = game.enemySystem.spawnNearCrystal(game.tileMap);
  assert.equal(cappedSpawn.spawned, false, 'second spear crystal encounter does not spawn another enemy');
  assert.equal(game.enemySystem.activeCount(), 1, 'spear crystal encounter is capped at one active enemy');
  assert.equal(cappedSpawn.message, 'Es ist bereits eine Kreatur da.', 'existing enemy writes a no-spam log');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('woodenSpear', 1);
  game.hotbarSlots[0] = 'woodenSpear';
  game.enemySystem.spawnNearCrystal(game.tileMap);
  const enemy = game.enemySystem.enemies[0];
  const startX = enemy.x;
  const startY = enemy.y;
  game.player.setPosition(
    0 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: -1 };

  assert.equal(game.tryAttackAction(), true, 'spear attack can hit an enemy');
  assert.equal(enemy.hp, 3, 'wooden spear hit deals exactly one damage');
  assert.equal(enemy.healthVisible, true, 'enemy health bar becomes visible after first hit');
  assert.ok(enemy.knockback.seconds > 0, 'spear hit applies knockback');
  enemy.update(0.08, game.tileMap, game.player);
  assert.notDeepEqual({ x: enemy.x, y: enemy.y }, { x: startX, y: startY }, 'enemy knockback changes enemy position');

  for (let hit = 0; hit < 3; hit += 1) {
    enemy.setTilePosition({ x: 1, y: 0 });
    enemy.knockback = { x: 0, y: 0, seconds: 0 };
    game.tryAttackAction();
  }
  assert.equal(game.enemySystem.activeCount(), 0, 'enemy is removed after reaching zero hit points');
  assert.equal(game.crystalSystem.lastMessage, 'Kreatur besiegt.', 'defeated enemy writes a defeat log');
}

{
  const enemySystem = new EnemySystem();
  const tileMap = new TileMap();
  const player = createSpawnedPlayer();
  const enemy = Enemy.fromTile({ x: 1, y: 0 });
  enemySystem.enemies.push(enemy);
  player.setPosition(
    4 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  const startX = enemy.x;

  enemySystem.update(1, tileMap, player);

  assert.equal(enemy.x, startX, 'enemy does not voluntarily walk from a tile into the void');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('stone', 1);
  game.selectHotbarResource('stone');
  game.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };

  assert.equal(game.getPlacementPreview().canPlace, true, 'stone can be placed in front of the player');
  assert.equal(game.tryPlaceSelectedItem(), true, 'selected stone can be placed');
  assert.equal(game.tileMap.getTile(2, 0), 'stone', 'placed stone becomes a world tile');
  assert.equal(game.inventory.get('stone'), 0, 'placing stone consumes one stone resource');
  assert.equal(game.tileMap.isGround(2, 0), true, 'stone tiles are walkable support');
  assert.equal(game.tileMap.canPlaceWorkbench(2, 0, { x: 1, y: 0 }), true, 'stone tiles can accept placed objects');
  assert.equal(game.crystalSystem.lastMessage, 'Stein platziert.', 'successful stone placement writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('earth', 2);
  game.selectHotbarResource('rawWood');
  game.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };

  assert.equal(game.getEarthPlacementPreview().canPlace, false, 'non-earth active item blocks placement preview');
  assert.equal(game.tryPlaceEarth(), false, 'non-earth active item cannot place earth');
  assert.equal(game.tileMap.getTile(2, 0), null, 'non-earth active item does not add a tile');
  assert.equal(game.inventory.get('earth'), 2, 'non-earth active item does not consume earth');
  assert.equal(game.crystalSystem.lastMessage, 'Dieses Item kann noch nicht platziert werden.', 'non-placeable item writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.hotbarSlots[0] = null;
  assert.equal(game.tryPlaceSelectedItem(), false, 'empty active hotbar slot cannot place anything');
  assert.equal(game.crystalSystem.lastMessage, 'Kein Item ausgewählt.', 'empty active slot writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('workbench', 1);
  game.selectHotbarResource('workbench');
  game.player.setPosition(
    0 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };

  assert.equal(game.getPlacementPreview().canPlace, true, 'workbench can be placed on an existing ground tile');
  assert.equal(game.tryPlaceSelectedItem(), true, 'selected workbench can be placed');
  assert.equal(game.tileMap.getObject(1, 1), 'workbench', 'placed workbench becomes a world object');
  assert.equal(game.inventory.get('workbench'), 0, 'placing workbench consumes one workbench');
  assert.equal(game.getActiveHotbarItem(), 'workbench', 'placing a workbench keeps the selected hotbar slot stable');
  assert.equal(game.crystalSystem.lastMessage, 'Werkbank platziert.', 'successful workbench placement writes a clear log message');
  assert.equal(game.hasWorkbenchAccess(), true, 'placed workbench is functional when player stands nearby');
}

{
  const placeables = ['torch', 'campfire', 'woodWall', 'table', 'chair'];

  for (const resource of placeables) {
    const { Game } = await import('../src/core/game.js');
    const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

    game.inventory.add(resource, 1);
    game.selectHotbarResource(resource);
    game.player.setPosition(
      0 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
      1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
    );
    game.player.facing = { x: 1, y: 0 };

    assert.equal(game.getPlacementPreview().canPlace, true, `${resource} can be previewed on a free ground tile`);
    assert.equal(game.tryPlaceSelectedItem(), true, `${resource} can be placed on a free ground tile`);
    assert.equal(game.tileMap.getObject(1, 1), resource, `${resource} becomes a placed world object`);
    assert.equal(game.inventory.get(resource), 0, `${resource} placement consumes one item`);
    assert.equal(game.crystalSystem.lastMessage, `${RESOURCE_LABELS[resource]} platziert.`, `${resource} placement writes a clear log`);
  }
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('torch', 1);
  game.inventory.add('table', 1);
  game.selectHotbarResource('torch');
  game.player.setPosition(
    0 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };

  assert.equal(game.tryPlaceSelectedItem(), true, 'first buildable can occupy a ground tile');
  game.selectHotbarResource('table');
  assert.equal(game.tryPlaceSelectedItem(), false, 'second buildable cannot be placed on an occupied tile');
  assert.equal(game.tileMap.getObject(1, 1), 'torch', 'occupied object tile keeps the first object');
  assert.equal(game.inventory.get('table'), 1, 'blocked buildable placement does not consume inventory');
  assert.equal(game.crystalSystem.lastMessage, 'Zielfeld ist bereits belegt.', 'occupied buildable placement writes a clear log');
}

{
  const { RenderSystem } = await import('../src/systems/render-system.js');
  const context = createDrawContext();
  const renderer = new RenderSystem(context);
  const tileMap = new TileMap();

  tileMap.setObject(-1, 1, 'torch');
  tileMap.setObject(1, 1, 'campfire');
  renderer.renderLighting({ getDarkness: () => 0.52 }, tileMap, { x: 0, y: 0 }, GAME_VIEW);

  assert.equal(context.calls.some((call) => call.fn === 'fillRect' && call.args[2] === GAME_VIEW.width), true, 'night lighting draws a screen darkness overlay');
  assert.equal(context.calls.filter((call) => call.fn === 'fillRect').length >= 3, true, 'torch and campfire cut soft light windows out of the darkness overlay');
  assert.equal(context.calls.some((call) => typeof call.fillStyle === 'string' && call.fillStyle.includes('255, 196')), false, 'object light no longer paints the world with a yellow tint');

  const dayContext = createDrawContext();
  const dayRenderer = new RenderSystem(dayContext);
  dayRenderer.renderLighting({ getDarkness: () => 0 }, tileMap, { x: 0, y: 0 }, GAME_VIEW);
  assert.equal(dayContext.calls.length, 0, 'day lighting skips darkness and object lights');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.tileMap.setWorkbench(1, 1);
  game.player.setPosition(TILE_SIZE * 8, TILE_SIZE * 8);

  assert.equal(game.hasWorkbenchAccess(), false, 'placed workbench is not available from far away');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('workbench', 1);
  game.selectHotbarResource('workbench');
  game.player.facing = { x: 0, y: -1 };

  assert.equal(game.tryPlaceSelectedItem(), false, 'workbench cannot be placed on the crystal');
  assert.equal(game.crystalSystem.lastMessage, 'Nicht auf dem Kristall.', 'crystal placement writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('workbench', 1);
  game.selectHotbarResource('workbench');
  game.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };

  assert.equal(game.tryPlaceSelectedItem(), false, 'workbench cannot be placed in the void');
  assert.equal(game.crystalSystem.lastMessage, 'Hier kann das nicht platziert werden.', 'void placement writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('workbench', 2);
  game.selectHotbarResource('workbench');
  game.player.setPosition(
    0 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };
  game.tryPlaceSelectedItem();
  game.selectHotbarResource('workbench');

  assert.equal(game.tryPlaceSelectedItem(), false, 'workbench cannot be placed on an occupied object tile');
  assert.equal(game.crystalSystem.lastMessage, 'Zielfeld ist bereits belegt.', 'occupied placement writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('workbench', 1);
  game.selectHotbarResource('workbench');

  assert.equal(game.getWorkbenchPlacementPreview(game.player.getTilePosition(), game.player.getTilePosition()).canPlace, false, 'workbench cannot be placed on the player tile');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('woodenPickaxe', 1);
  game.selectHotbarResource('woodenPickaxe');

  assert.equal(game.tryPlaceSelectedItem(), false, 'wooden pickaxe cannot be placed in this slice');
  assert.equal(game.crystalSystem.lastMessage, 'Dieses Item kann noch nicht platziert werden.', 'wooden pickaxe writes a non-placeable log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('woodenSpear', 1);
  game.selectHotbarResource('woodenSpear');

  assert.equal(game.tryPlaceSelectedItem(), false, 'wooden spear cannot be placed in this slice');
  assert.equal(game.crystalSystem.lastMessage, 'Dieses Item kann noch nicht platziert werden.', 'wooden spear writes a non-placeable log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('grassSeed', 2);
  game.selectHotbarResource('grassSeed');
  game.player.setPosition(
    0 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };

  assert.equal(game.getPlacementPreview().canPlace, true, 'grass seeds can be planted on an earth tile');
  assert.equal(game.tryPlaceSelectedItem(), true, 'grass seeds can be planted with B placement logic');
  assert.equal(game.tileMap.getTile(1, 1), 'grass', 'grass seed turns earth into grass tile');
  assert.equal(game.inventory.get('grassSeed'), 1, 'planting grass consumes one grass seed');
  assert.equal(game.crystalSystem.lastMessage, 'Grassamen gepflanzt.', 'planting grass writes a clear log message');
  assert.equal(game.tileMap.isPlayerSupported(game.player), true, 'grass tile remains normal supported ground nearby');
  assert.equal(game.tileMap.canPlaceWorkbench(1, 1, { x: 0, y: 1 }), true, 'grass tile still accepts placed objects');

  assert.equal(game.tryPlaceSelectedItem(), false, 'grass seeds cannot be planted twice on the same tile');
  assert.equal(game.crystalSystem.lastMessage, 'Tile ist bereits begrünt.', 'already grass tile writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('grassSeed', 1);
  game.selectHotbarResource('grassSeed');
  game.player.facing = { x: 0, y: -1 };

  assert.equal(game.tryPlaceSelectedItem(), false, 'grass seeds cannot be planted on crystal');
  assert.equal(game.crystalSystem.lastMessage, 'Nicht auf dem Kristall.', 'grass crystal placement writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('grassSeed', 1);
  game.selectHotbarResource('grassSeed');
  game.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };

  assert.equal(game.tryPlaceSelectedItem(), false, 'grass seeds cannot be planted in void');
  assert.equal(game.crystalSystem.lastMessage, 'Grassamen brauchen Erde.', 'grass void placement writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('earth', 1);
  game.player.facing = { x: 0, y: -1 };

  assert.equal(game.getEarthPlacementPreview().canPlace, false, 'placement preview is blocked on the crystal');
  assert.equal(game.tryPlaceEarth(), false, 'earth cannot be placed on the crystal');
  assert.equal(game.inventory.get('earth'), 1, 'failed placement does not consume earth');
  assert.equal(game.crystalSystem.lastMessage, 'Zielfeld ist blockiert.', 'blocked target writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('earth', 1);
  game.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: -1, y: 0 };

  assert.equal(game.tryPlaceEarth(), false, 'earth cannot be placed on an existing tile');
  assert.equal(game.inventory.get('earth'), 1, 'blocked placement does not consume earth');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  assert.equal(game.getEarthPlacementPreview().canPlace, false, 'placement preview is invalid without earth');
  assert.equal(game.tryPlaceEarth(), false, 'earth cannot be placed without an earth resource');
  assert.equal(game.crystalSystem.lastMessage, 'Nicht genug Erde.', 'missing resource writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.crystalSystem.random = () => 0.1;
  assert.equal(game.tryUseCrystal(), true, 'crystal interaction spawns a visible drop');
  assert.equal(game.inventory.get('earth'), 0, 'crystal interaction does not add resources directly');
  assert.equal(game.dropSystem.drops.length, 1, 'crystal interaction creates one world drop');
  assert.equal(game.dropSystem.drops[0].resource, 'earth', 'crystal drop uses weighted base resource roll');
  const dropTile = game.tileMap.getTileAtWorldPosition(game.dropSystem.drops[0].x, game.dropSystem.drops[0].y);
  assert.equal(game.tileMap.isGround(dropTile.x, dropTile.y), true, 'visible drop lands on a real ground tile');
  assert.equal(game.tileMap.isCrystal(dropTile.x, dropTile.y), false, 'visible drop does not land on the crystal');
  assert.equal(game.crystalSystem.lastMessage, 'Kristall wirft Erde aus.', 'crystal interaction logs visible drop spawn');

  game.player.setPosition(
    game.dropSystem.drops[0].x - PLAYER_SIZE / 2,
    game.dropSystem.drops[0].y - PLAYER_SIZE + PLAYER_FOOT_OFFSET
  );
  game.update(0.016);
  assert.equal(game.dropSystem.drops.length, 0, 'nearby player automatically picks up a visible drop');
  assert.equal(game.inventory.get('earth'), 1, 'pickup adds dropped resource to inventory');
  assert.equal(game.crystalSystem.lastMessage, 'Erde eingesammelt.', 'pickup writes a clear log message');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });

  game.dropSystem.spawn({
    resource: 'stone',
    amount: 1,
    x: TILE_SIZE * 24,
    y: TILE_SIZE * 24
  });
  game.saveGame();

  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.dropSystem.drops.length, 1, 'saved visible drops load from storage');
  const repairedDrop = loadedGame.dropSystem.drops[0];
  const repairedTile = loadedGame.tileMap.getTileAtWorldPosition(repairedDrop.x, repairedDrop.y);
  assert.equal(loadedGame.tileMap.isGround(repairedTile.x, repairedTile.y), true, 'invalid saved drop positions are repaired onto ground');
  assert.equal(loadedGame.tileMap.isCrystal(repairedTile.x, repairedTile.y), false, 'repaired saved drops avoid the crystal');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });

  game.inventory.add('earth', 3);
  game.inventory.add('stone', 2);
  game.inventory.add('workbench', 2);
  game.inventory.add('woodenPickaxe', 1);
  game.inventory.add('woodenSpear', 1);
  game.inventory.add('torch', 2);
  game.inventory.add('campfire', 1);
  game.inventory.add('woodWall', 1);
  game.inventory.add('table', 1);
  game.inventory.add('chair', 1);
  game.inventory.add('grassSeed', 1);
  game.selectHotbarResource('earth');
  game.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };
  game.tryPlaceEarth();
  game.selectHotbarResource('workbench');
  game.tryPlaceSelectedItem();
  game.selectHotbarResource('grassSeed');
  game.player.facing = { x: 0, y: 1 };
  game.tryPlaceSelectedItem();
  game.selectHotbarResource('stone');
  game.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };
  game.tryPlaceSelectedItem();
  game.enemySystem.spawnNearCrystal(game.tileMap);
  game.enemySystem.enemies[0].hp = 2;
  game.enemySystem.enemies[0].healthVisible = true;
  game.tileMap.setObject(-1, 1, 'torch');
  game.tileMap.setObject(-1, 0, 'campfire');
  game.tileMap.setObject(1, -1, 'woodWall');
  game.dropSystem.spawn({
    resource: 'fiber',
    amount: 1,
    x: -1 * TILE_SIZE + TILE_SIZE / 2,
    y: -1 * TILE_SIZE + TILE_SIZE / 2
  });
  game.dayNightSystem.load(0.76);
  for (let index = 1; index <= 6; index += 1) {
    game.setLog(`Log ${index}`);
  }
  game.saveGame();

  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });

  assert.equal(storage.getItem(SAVE_KEY) !== null, true, 'game writes save data through local storage');
  assert.ok(storage.calls.setItem > 0, 'saving uses localStorage.setItem');
  assert.ok(storage.calls.getItem > 0, 'loading uses localStorage.getItem');
  assert.equal(game.saveStatus, 'saved', 'placing earth marks save status as saved');
  assert.equal(loadedGame.saveStatus, 'loaded', 'valid save marks save status as loaded');
  assert.equal(loadedGame.tileMap.getTile(2, 0), 'earth', 'saved placed earth loads as world tile');
  assert.equal(loadedGame.tileMap.getTile(2, 1), 'stone', 'saved placed stone loads as world tile');
  assert.equal(loadedGame.inventory.get('earth'), 2, 'saved resources load from local storage');
  assert.equal(loadedGame.inventory.get('stone'), 1, 'saved stone resources load from local storage');
  assert.equal(loadedGame.inventory.get('workbench'), 1, 'saved workbench item count loads from local storage');
  assert.equal(loadedGame.inventory.get('woodenPickaxe'), 1, 'saved wooden pickaxe item count loads from local storage');
  assert.equal(loadedGame.inventory.get('woodenSpear'), 1, 'saved wooden spear item count loads from local storage');
  assert.equal(loadedGame.inventory.get('torch'), 2, 'saved torch count loads from local storage');
  assert.equal(loadedGame.inventory.get('campfire'), 1, 'saved campfire count loads from local storage');
  assert.equal(loadedGame.inventory.get('woodWall'), 1, 'saved wood wall count loads from local storage');
  assert.equal(loadedGame.inventory.get('table'), 1, 'saved table count loads from local storage');
  assert.equal(loadedGame.inventory.get('chair'), 1, 'saved chair count loads from local storage');
  assert.equal(loadedGame.tileMap.getTile(1, 1), 'grass', 'saved grass tile loads from local storage');
  assert.equal(loadedGame.tileMap.getObject(2, 0), 'workbench', 'saved placed workbench loads as world object');
  assert.equal(loadedGame.tileMap.getObject(-1, 1), 'torch', 'saved placed torch loads as world object');
  assert.equal(loadedGame.tileMap.getObject(-1, 0), 'campfire', 'saved placed campfire loads as world object');
  assert.equal(loadedGame.tileMap.getObject(1, -1), 'woodWall', 'saved placed wood wall loads as world object');
  assert.deepEqual(loadedGame.player.getTilePosition(), { x: 1, y: 1 }, 'saved player position loads from local storage');
  assert.equal(loadedGame.enemySystem.activeCount(), 1, 'saved active enemy loads from local storage');
  assert.equal(loadedGame.enemySystem.enemies[0].hp, 2, 'saved enemy hit points load from local storage');
  assert.equal(loadedGame.enemySystem.enemies[0].healthVisible, true, 'saved enemy health-bar state loads from local storage');
  assert.equal(loadedGame.dropSystem.drops.length, 1, 'saved visible drops load from local storage');
  assert.equal(loadedGame.dropSystem.drops[0].resource, 'fiber', 'saved visible drop resource loads from local storage');
  assert.equal(loadedGame.dayNightSystem.time, 0.76, 'saved day-night time loads from local storage');
  assert.equal(loadedGame.logSystem.toJSON().length, 5, 'loaded log keeps at most five entries');
  assert.equal(loadedGame.logSystem.toJSON().includes('Log 6'), true, 'saved log entries load from local storage');

  loadedGame.hotbarSlots = ['earth', 'stone', 'woodenPickaxe', null];
  loadedGame.selectHotbarSlot(2);
  loadedGame.saveGame();
  const reloadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.deepEqual(reloadedGame.hotbarSlots, ['earth', 'stone', 'woodenPickaxe', null], 'hotbar assignments load from local storage');
  assert.equal(reloadedGame.activeHotbarSlot, 2, 'active hotbar slot loads from local storage');
  assert.equal(reloadedGame.getActiveHotbarItem(), 'woodenPickaxe', 'active hotbar item is restored from slot assignment');
}

{
  const storage = createMemoryStorage();
  const saveSystem = new SaveSystem(storage);

  assert.equal(saveSystem.save({ resources: { earth: 1 } }), true, 'save system writes to storage');
  assert.equal(storage.calls.setItem, 1, 'save system uses storage.setItem');
  assert.equal(saveSystem.load().resources.earth, 1, 'save system reads from storage');
  assert.ok(storage.calls.getItem > 0, 'save system uses storage.getItem');
  assert.equal(saveSystem.clear(), true, 'save system clears storage');
  assert.equal(storage.calls.removeItem, 1, 'save system uses storage.removeItem');
  assert.equal(saveSystem.load(), null, 'cleared save returns null');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });

  game.inventory.add('earth', 1);
  game.inventory.add('stone', 1);
  game.inventory.add('workbench', 1);
  game.inventory.add('woodenPickaxe', 1);
  game.inventory.add('woodenSpear', 1);
  game.inventory.add('torch', 1);
  game.inventory.add('campfire', 1);
  game.inventory.add('woodWall', 1);
  game.inventory.add('table', 1);
  game.inventory.add('chair', 1);
  game.tileMap.setWorkbench(1, 1);
  game.tileMap.setObject(-1, 1, 'torch');
  game.tileMap.setObject(-1, 0, 'campfire');
  game.tileMap.setObject(1, -1, 'table');
  game.tileMap.setGrass(1, 0);
  game.tileMap.setStone(2, 0);
  game.dropSystem.spawn({
    resource: 'earth',
    x: TILE_SIZE + TILE_SIZE / 2,
    y: TILE_SIZE / 2
  });
  game.dayNightSystem.load(0.88);
  game.enemySystem.spawnNearCrystal(game.tileMap);
  game.hotbarSlots = ['stone', 'woodenPickaxe', null, 'woodenSpear'];
  game.activeHotbarSlot = 3;
  game.saveGame();
  game.input.keys.add('r');
  game.update(1);
  assert.equal(game.crystalSystem.lastMessage, 'Reset wird vorbereitet...', 'holding reset key shows a preparation message');
  game.autosaveSeconds = 1;
  game.update(1.1);

  assert.equal(storage.getItem(SAVE_KEY), null, 'reset clears the saved game');
  assert.equal(game.inventory.get('earth'), 0, 'reset restores empty resources');
  assert.equal(game.inventory.get('stone'), 0, 'reset clears stone resources');
  assert.equal(game.inventory.get('workbench'), 0, 'reset clears crafted workbench items');
  assert.equal(game.inventory.get('woodenPickaxe'), 0, 'reset clears crafted wooden pickaxes');
  assert.equal(game.inventory.get('woodenSpear'), 0, 'reset clears crafted wooden spears');
  assert.equal(game.inventory.get('torch'), 0, 'reset clears torch items');
  assert.equal(game.inventory.get('campfire'), 0, 'reset clears campfire items');
  assert.equal(game.inventory.get('woodWall'), 0, 'reset clears wood wall items');
  assert.equal(game.inventory.get('table'), 0, 'reset clears table items');
  assert.equal(game.inventory.get('chair'), 0, 'reset clears chair items');
  assert.equal(game.tileMap.getObject(1, 1), null, 'reset clears placed workbenches');
  assert.equal(game.tileMap.getObject(-1, 1), null, 'reset clears placed torches');
  assert.equal(game.tileMap.getObject(-1, 0), null, 'reset clears placed campfires');
  assert.equal(game.tileMap.getObject(1, -1), null, 'reset clears placed furniture');
  assert.equal(game.tileMap.getTile(1, 0), 'earth', 'reset restores grass tiles back to the start island earth');
  assert.equal(game.tileMap.getTile(2, 0), null, 'reset clears placed stone tiles outside the start island');
  assert.equal(game.dropSystem.drops.length, 0, 'reset removes visible drops');
  assert.equal(game.dayNightSystem.time, DAY_NIGHT_START_TIME, 'reset restores start day-night time');
  assert.deepEqual(game.hotbarSlots, DEFAULT_HOTBAR_SLOTS, 'reset restores default hotbar assignment');
  assert.equal(game.activeHotbarSlot, 0, 'reset restores first active hotbar slot');
  assert.equal(game.enemySystem.activeCount(), 0, 'reset removes active enemies');
  assert.deepEqual(game.logSystem.toJSON(), ['Speicherstand gelöscht. Neustart am Kristall.'], 'reset resets log history');
  assert.deepEqual(game.player.getTilePosition(), PLAYER_SPAWN_TILE, 'reset respawns beside the crystal');
  assert.equal(game.crystalSystem.lastMessage, 'Speicherstand gelöscht. Neustart am Kristall.', 'reset writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.input.pressedThisFrame.add('p');
  game.handleDebugToggle();
  assert.equal(game.debugEnabled, true, 'P enables debug HUD');

  game.input.pressedThisFrame.add('p');
  game.handleDebugToggle();
  assert.equal(game.debugEnabled, false, 'P disables debug HUD');
}

{
  const element = { innerHTML: '' };
  const heartElement = { innerHTML: '' };
  const hud = new Hud(element);
  const detachedHeartHud = new Hud(element, heartElement);
  const debug = {
    playerX: 0,
    playerY: 0,
    cameraX: 0,
    cameraY: 0,
    supportTileX: 0,
    supportTileY: 0,
    supported: true,
    inVoid: false,
    falling: false,
    movementKeys: [],
    lastKey: 'none',
    saveStatus: 'saved'
  };

  hud.update({
    inventory: {},
    hint: 'Neues Spiel gestartet.',
    debug,
    debugEnabled: false,
    resetHoldSeconds: 0
  });
  assert.equal(element.innerHTML.includes('<strong>Debug:</strong>'), false, 'HUD hides debug information by default');

  hud.update({
    inventory: {},
    hint: 'Neues Spiel gestartet.',
    debug,
    debugEnabled: true,
    resetHoldSeconds: 0
  });
  assert.equal(element.innerHTML.includes('<strong>Debug:</strong>'), true, 'HUD shows debug information when enabled');
  assert.equal(element.innerHTML.includes('save: saved'), true, 'debug HUD shows save status');

  detachedHeartHud.update({
    inventory: {},
    hint: 'Neues Spiel gestartet.',
    debug,
    debugEnabled: true,
    hearts: ['full', 'half', 'empty'],
    resetHoldSeconds: 0
  });
  assert.equal(element.innerHTML.includes('heart-hud'), false, 'detached heart HUD is not rendered inside the log HUD');
  assert.equal(heartElement.innerHTML.includes('heart-full'), true, 'detached heart HUD receives heart markup');
}

{
  const player = createSpawnedPlayer();
  const camera = new Camera();

  player.update(0.25, inputWith('d'), map);
  camera.centerOn(player.getCenterPosition());

  assert.equal(
    Math.round(player.getCenterPosition().x - camera.x),
    Math.round(GAME_VIEW.width / 2),
    'camera follows player center on x axis'
  );
  assert.equal(
    Math.round(player.getCenterPosition().y - camera.y),
    Math.round(GAME_VIEW.height / 2),
    'camera follows player center on y axis'
  );
}

{
  assert.equal(chooseWeightedDrop(0).resource, 'earth', 'weighted drops start with earth');
  assert.equal(chooseWeightedDrop(0.49).resource, 'earth', 'earth covers the first 50 percent');
  assert.equal(chooseWeightedDrop(0.50).resource, 'rawWood', 'raw wood starts after earth weight');
  assert.equal(chooseWeightedDrop(0.69).resource, 'rawWood', 'raw wood covers the next 20 percent');
  assert.equal(chooseWeightedDrop(0.70).resource, 'fiber', 'fiber starts after raw wood weight');
  assert.equal(chooseWeightedDrop(0.89).resource, 'fiber', 'fiber covers the next 20 percent');
  assert.equal(chooseWeightedDrop(0.90).resource, 'grassSeed', 'grass seed covers the final 10 percent');
  assert.equal(chooseWeightedDrop(PICKAXE_RESOURCE_DROPS, 0).resource, 'stone', 'pickaxe crystal drops start with stone');
  assert.equal(chooseWeightedDrop(PICKAXE_RESOURCE_DROPS, 0.39).resource, 'stone', 'stone stays the frequent pickaxe drop');
  assert.equal(chooseWeightedDrop(PICKAXE_RESOURCE_DROPS, 0.40).resource, 'earth', 'earth follows stone in pickaxe drops');
  assert.equal(chooseWeightedDrop(PICKAXE_RESOURCE_DROPS, 0.65).resource, 'rawWood', 'raw wood follows earth in pickaxe drops');
  assert.equal(chooseWeightedDrop(PICKAXE_RESOURCE_DROPS, 0.91).resource, 'clay', 'clay is an uncommon pickaxe progress drop');
  assert.equal(chooseWeightedDrop(PICKAXE_RESOURCE_DROPS, 0.97).resource, 'treeSeed', 'tree seeds are rare pickaxe progress drops');
  assert.equal(chooseWeightedDrop(PICKAXE_RESOURCE_DROPS, 0.99).resource, 'berry', 'berries are rare pickaxe progress drops for berry bushes');

  const inventory = new ResourceInventory();
  const randomValues = [0.10, 0.55, 0.75, 0.95];
  const crystal = new CrystalSystem(inventory, () => randomValues.shift());
  const allowedResources = new Set(['earth', 'rawWood', 'fiber', 'grassSeed']);

  for (let i = 0; i < 4; i += 1) {
    const drop = crystal.use();
    assert.equal(allowedResources.has(drop.resource), true, 'crystal drops only base resources');
  }

  const totalResources = Object.values(inventory.resources).reduce((sum, amount) => sum + amount, 0);
  assert.equal(totalResources, 4, 'crystal interactions add resources to the HUD inventory model');
  assert.equal(inventory.get('earth'), 1, 'weighted crystal sequence can drop earth');
  assert.equal(inventory.get('rawWood'), 1, 'weighted crystal sequence can drop raw wood');
  assert.equal(inventory.get('fiber'), 1, 'weighted crystal sequence can drop fibers');
  assert.equal(inventory.get('grassSeed'), 1, 'weighted crystal sequence can drop grass seeds');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.crystalSystem.random = () => 0.1;
  game.inventory.add('woodenPickaxe', 1);
  game.hotbarSlots[0] = 'woodenPickaxe';
  game.activeHotbarSlot = 0;

  game.tryAttackAction();

  assert.equal(game.inventory.get('stone'), 0, 'wooden pickaxe attack spawns stone before pickup');
  assert.equal(game.dropSystem.drops.length, 1, 'wooden pickaxe attack creates a visible drop');
  assert.equal(game.dropSystem.drops[0].resource, 'stone', 'wooden pickaxe attack unlocks stone drops at the crystal');
  assert.equal(game.crystalSystem.lastMessage, 'Stein splittert heraus.', 'pickaxe attack writes the visible drop log');
  assert.equal(game.logSystem.entries.includes('Du schlägst Splitter aus dem Kristall.'), true, 'pickaxe attack logs the crystal hit feedback');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  const spawn = game.animalSystem.spawn(game.tileMap);
  assert.equal(spawn.spawned, true, 'passive animal can spawn on the start island');
  const foot = spawn.animal.getFootPosition();
  const tile = game.tileMap.getTileAtWorldPosition(foot.x, foot.y);
  assert.equal(game.tileMap.isGround(tile.x, tile.y), true, 'passive animal spawns on a valid ground tile');
  assert.equal(game.tileMap.isCrystal(tile.x, tile.y), false, 'passive animal does not spawn on the crystal');
}

{
  const { Animal } = await import('../src/entities/animal.js');
  const animal = Animal.fromTile({ x: 1, y: 1 });
  animal.direction = { x: 1, y: 0 };
  animal.decisionSeconds = 10;
  animal.update(4, map, () => 0);
  const tile = map.getTileAtWorldPosition(animal.getFootPosition().x, animal.getFootPosition().y);

  assert.notEqual(tile.x, 2, 'passive animal does not voluntarily walk into void');
  assert.equal(map.isPlayerSupported({ getFootPosition: () => animal.getFootPosition() }), true, 'passive animal remains supported by tile logic');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });

  game.animalSystem.spawn(game.tileMap);
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.animalSystem.activeCount(), 1, 'passive animals save and load');

  loadedGame.input.keys.add('r');
  loadedGame.update(2.1);
  assert.equal(loadedGame.animalSystem.activeCount(), 0, 'reset removes passive animals');
}

{
  const inventory = new ResourceInventory();
  const crafting = new CraftingSystem(inventory);

  inventory.add('rawWood', 4);
  inventory.add('fiber', 6);
  inventory.add('stone', 2);
  assert.equal(crafting.craft('slingshot', { hasWorkbenchAccess: true }).crafted, true, 'slingshot can be crafted at workbench');
  assert.equal(inventory.get('slingshot'), 1, 'slingshot crafting adds weapon item');

  inventory.add('rawWood', 8);
  inventory.add('fiber', 8);
  assert.equal(crafting.craft('bow', { hasWorkbenchAccess: true }).crafted, true, 'bow can be crafted at workbench');
  assert.equal(inventory.get('bow'), 1, 'bow crafting adds weapon item');

  inventory.add('rawWood', 1);
  inventory.add('stone', 1);
  assert.equal(crafting.craft('arrow').crafted, true, 'arrows can be crafted in normal crafting');
  assert.equal(inventory.get('arrow'), 4, 'arrow recipe creates four arrows');

  inventory.add('stone', 1);
  assert.equal(crafting.craft('stoneBall').crafted, true, 'stone balls can be crafted in normal crafting');
  assert.equal(inventory.get('stoneBall'), 4, 'stone ball recipe creates four stone balls');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });

  game.inventory.add('slingshot', 1);
  game.inventory.add('bow', 1);
  game.inventory.add('arrow', 7);
  game.inventory.add('stoneBall', 5);
  game.hotbarSlots = ['slingshot', 'bow', 'arrow', 'stoneBall'];
  game.activeHotbarSlot = 1;
  game.saveGame();

  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.inventory.get('slingshot'), 1, 'saved slingshot loads from storage');
  assert.equal(loadedGame.inventory.get('bow'), 1, 'saved bow loads from storage');
  assert.equal(loadedGame.inventory.get('arrow'), 7, 'saved arrows load from storage');
  assert.equal(loadedGame.inventory.get('stoneBall'), 5, 'saved stone balls load from storage');
  assert.deepEqual(loadedGame.hotbarSlots, ['slingshot', 'bow', 'arrow', 'stoneBall'], 'new items can be assigned to the four-slot hotbar');
  assert.equal(loadedGame.hotbarSlots.length, HOTBAR_SLOT_COUNT, 'hotbar remains capped at four slots with new items');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.crystalSystem.random = () => 0.9;
  game.inventory.add('slingshot', 1);
  game.selectHotbarResource('slingshot');
  game.player.setPosition(6 * TILE_SIZE, 6 * TILE_SIZE);

  assert.equal(game.tryAttackAction(), false, 'slingshot does not shoot without stone balls');
  assert.equal(game.crystalSystem.lastMessage, 'Keine Steinkugeln.', 'slingshot without ammo writes a clear log');

  game.inventory.add('stoneBall', 2);
  assert.equal(game.tryAttackAction(), true, 'slingshot shoots with stone balls');
  assert.equal(game.inventory.get('stoneBall'), 1, 'slingshot consumes one stone ball per shot');
  assert.equal(game.projectileSystem.projectiles[0].range, SLINGSHOT_RANGE, 'slingshot projectile uses two tile range');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.inventory.add('bow', 1);
  game.selectHotbarResource('bow');
  game.player.setPosition(6 * TILE_SIZE, 6 * TILE_SIZE);

  assert.equal(game.tryAttackAction(), false, 'bow does not shoot without arrows');
  assert.equal(game.crystalSystem.lastMessage, 'Keine Pfeile.', 'bow without ammo writes a clear log');

  game.inventory.add('arrow', 2);
  assert.equal(game.tryAttackAction(), true, 'bow shoots with arrows');
  assert.equal(game.inventory.get('arrow'), 1, 'bow consumes one arrow per shot');
  assert.equal(game.projectileSystem.projectiles[0].range, BOW_RANGE, 'bow projectile uses four tile range');
}

{
  const { ProjectileSystem } = await import('../src/systems/projectile-system.js');
  const projectileSystem = new ProjectileSystem();
  projectileSystem.spawn({ type: 'stoneBall', x: 0, y: 0, direction: { x: 1, y: 0 } });
  projectileSystem.update(1, { enemies: [] }, { enemies: [] });
  assert.equal(projectileSystem.activeCount(), 0, 'slingshot projectile disappears after range is exceeded');

  projectileSystem.spawn({ type: 'arrow', x: 0, y: 0, direction: { x: 1, y: 0 } });
  projectileSystem.update(1, { enemies: [] }, { enemies: [] });
  assert.equal(projectileSystem.activeCount(), 0, 'bow projectile disappears after range is exceeded');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  for (let x = 2; x <= 7; x += 1) game.tileMap.setEarth(x, 0);
  const enemy = Enemy.fromTile({ x: 7, y: 0 });
  game.enemySystem.enemies.push(enemy);
  game.inventory.add('slingshot', 1);
  game.inventory.add('stoneBall', 1);
  game.selectHotbarResource('slingshot');
  game.player.setPosition(
    5 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };
  game.tryAttackAction();
  game.update(0.25);

  assert.equal(enemy.hp, 3, 'slingshot projectile deals one damage to ground enemy');
  assert.equal(enemy.healthVisible, true, 'projectile hit reveals ground enemy health bar');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  for (let x = 2; x <= 8; x += 1) game.tileMap.setEarth(x, 0);
  const enemy = Enemy.fromTile({ x: 8, y: 0 });
  game.enemySystem.enemies.push(enemy);
  game.inventory.add('bow', 1);
  game.inventory.add('arrow', 1);
  game.selectHotbarResource('bow');
  game.player.setPosition(
    5 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };
  game.tryAttackAction();
  game.update(0.35);

  assert.equal(enemy.hp, 2, 'bow projectile deals two damage to ground enemy');
}

{
  const { Game } = await import('../src/core/game.js');
  const { FlyingEnemy } = await import('../src/entities/flying-enemy.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  for (let x = 2; x <= 8; x += 1) game.tileMap.setEarth(x, 0);
  const flying = new FlyingEnemy({ x: 8 * TILE_SIZE, y: 0 });
  game.flyingEnemySystem.enemies.push(flying);
  game.inventory.add('bow', 1);
  game.inventory.add('arrow', 1);
  game.selectHotbarResource('bow');
  game.player.setPosition(
    5 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };
  game.tryAttackAction();
  game.update(0.35);

  assert.equal(flying.hp, 1, 'bow projectile deals two damage to flying enemy');
  assert.equal(flying.healthVisible, true, 'projectile hit reveals flying enemy health bar');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.crystalSystem.random = () => 0.9;
  game.inventory.add('slingshot', 1);
  game.inventory.add('stoneBall', 1);
  game.selectHotbarResource('slingshot');

  assert.equal(game.tryAttackAction(), true, 'slingshot attack at crystal starts flying encounter');
  assert.equal(game.flyingEnemySystem.activeCount(), 1, 'crystal ranged encounter spawns one flying enemy');
  assert.equal(game.tryAttackAction(), false, 'ranged crystal encounter does not spam flying enemies');
  assert.equal(game.crystalSystem.lastMessage, 'Es ist bereits eine Kreatur da.', 'existing flying encounter writes no-spam log');
}

{
  const { FlyingEnemy } = await import('../src/entities/flying-enemy.js');
  const flying = new FlyingEnemy({ x: 12 * TILE_SIZE, y: 12 * TILE_SIZE });
  flying.update(0.1, map, createSpawnedPlayer());
  const nearest = flying.findNearestGroundCenter(map);
  const center = flying.getCenterPosition();
  assert.ok(
    Math.hypot(center.x - nearest.x, center.y - nearest.y) <= FLYING_ENEMY_MAX_TILE_DISTANCE * TILE_SIZE + 0.01,
    'flying enemy stays within three tiles of the built world'
  );
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });

  game.flyingEnemySystem.spawnNearCrystal(game.tileMap);
  game.flyingEnemySystem.enemies[0].hp = 2;
  game.flyingEnemySystem.enemies[0].healthVisible = true;
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });

  assert.equal(loadedGame.flyingEnemySystem.activeCount(), 1, 'flying enemies save and load');
  assert.equal(loadedGame.flyingEnemySystem.enemies[0].hp, 2, 'flying enemy hit points load');
  assert.equal(loadedGame.flyingEnemySystem.enemies[0].healthVisible, true, 'flying enemy health visibility loads');
  loadedGame.flyingEnemySystem.enemies[0].x = 1000;
  loadedGame.flyingEnemySystem.enemies[0].y = 1000;
  loadedGame.flyingEnemySystem.update(0.1, loadedGame.tileMap, loadedGame.player);
  assert.equal(loadedGame.flyingEnemySystem.activeCount(), 1, 'flying enemy does not fall into void');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  for (let x = 2; x <= 5; x += 1) game.tileMap.setEarth(x, 0);
  const enemy = Enemy.fromTile({ x: 5, y: 0 });
  enemy.hp = 2;
  game.enemySystem.enemies.push(enemy);
  game.inventory.add('bow', 1);
  game.inventory.add('arrow', 2);
  game.selectHotbarResource('bow');
  game.player.setPosition(
    2 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };
  game.tryAttackAction();
  game.update(0.35);

  assert.equal(game.enemySystem.activeCount(), 0, 'projectiles can defeat ground enemies');
  assert.ok(game.dropSystem.drops.length > 0, 'defeated ground enemy creates a safe visible loot drop');
  const dropTile = game.tileMap.getTileAtWorldPosition(game.dropSystem.drops[0].x, game.dropSystem.drops[0].y);
  assert.equal(game.tileMap.isGround(dropTile.x, dropTile.y), true, 'enemy loot lands on a valid tile');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.inventory.add('earth', 1);
  game.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };
  game.input.pressedThisFrame.add('e');
  game.update(0.016);
  assert.equal(game.tileMap.getTile(2, 0), 'earth', 'E key uses the same context action to place selected items');

  const gameWithWorkbench = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  gameWithWorkbench.tileMap.setWorkbench(1, 1);
  gameWithWorkbench.input.pressedThisFrame.add(' ');
  gameWithWorkbench.update(0.016);
  assert.equal(gameWithWorkbench.craftingOpen, true, 'Space key opens workbench crafting through context action');
  assert.equal(gameWithWorkbench.craftingContext, 'workbench', 'Space key opens workbench context when near workbench');

  const gameWithCrystal = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  gameWithCrystal.input.pressedThisFrame.add('e');
  gameWithCrystal.update(0.016);
  assert.equal(gameWithCrystal.dropSystem.drops.length, 1, 'E key activates crystal through context action');

  const gameWithB = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  gameWithB.inventory.add('earth', 1);
  gameWithB.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  gameWithB.player.facing = { x: 1, y: 0 };
  gameWithB.input.pressedThisFrame.add('b');
  gameWithB.update(0.016);
  assert.equal(gameWithB.tileMap.getTile(2, 0), 'earth', 'B remains a direct placement key');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.animalSystem.spawn(game.tileMap);
  game.enemySystem.spawnNearCrystal(game.tileMap);
  game.projectileSystem.spawn({ type: 'arrow', x: 0, y: 0, direction: { x: 1, y: 0 } });
  const animalX = game.animalSystem.animals[0].x;
  const enemyX = game.enemySystem.enemies[0].x;
  const projectileX = game.projectileSystem.projectiles[0].x;
  game.inventoryOpen = true;
  game.update(0.5);

  assert.equal(game.animalSystem.animals[0].x, animalX, 'pause stops passive animal movement');
  assert.equal(game.enemySystem.enemies[0].x, enemyX, 'pause stops enemy movement');
  assert.equal(game.projectileSystem.projectiles[0].x, projectileX, 'pause stops projectile movement');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });

  game.inventory.add('slingshot', 1);
  game.inventory.add('bow', 1);
  game.inventory.add('arrow', 1);
  game.inventory.add('stoneBall', 1);
  game.animalSystem.spawn(game.tileMap);
  game.flyingEnemySystem.spawnNearCrystal(game.tileMap);
  game.projectileSystem.spawn({ type: 'arrow', x: 0, y: 0, direction: { x: 1, y: 0 } });
  game.saveGame();
  game.input.keys.add('r');
  game.update(2.1);

  assert.equal(storage.getItem(SAVE_KEY), null, 'reset clears save with new entities');
  assert.equal(game.inventory.get('slingshot'), 0, 'reset clears slingshot');
  assert.equal(game.inventory.get('bow'), 0, 'reset clears bow');
  assert.equal(game.inventory.get('arrow'), 0, 'reset clears arrows');
  assert.equal(game.inventory.get('stoneBall'), 0, 'reset clears stone balls');
  assert.equal(game.animalSystem.activeCount(), 0, 'reset clears animals');
  assert.equal(game.flyingEnemySystem.activeCount(), 0, 'reset clears flying enemies');
  assert.equal(game.projectileSystem.activeCount(), 0, 'reset clears projectiles');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.dayNightSystem.load(0.3);
  game.crystalSystem.random = () => 0.91;
  game.inventory.add('woodenPickaxe', 1);
  game.hotbarSlots[0] = 'woodenPickaxe';
  game.activeHotbarSlot = 0;

  game.tryAttackAction();

  assert.equal(game.dropSystem.drops[0].resource, 'clay', 'wooden pickaxe can create clay drops at the crystal');
  assert.equal(game.inventory.get('clay'), 0, 'clay pickaxe drops stay visible until collected');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.inventory.add('clay', 1);
  game.hotbarSlots[0] = 'clay';
  setGamePlayerOnTile(game, 1, 0, { x: 1, y: 0 });

  assert.equal(game.tryPlaceSelectedItem(), true, 'clay can be placed like a floor tile');
  assert.equal(game.tileMap.getTile(2, 0), 'clay', 'placed clay becomes a clay tile');
  assert.equal(game.inventory.get('clay'), 0, 'placing clay consumes one clay item');
  assert.equal(game.tileMap.isGround(2, 0), true, 'clay tile is a support tile');
}

{
  const { Game } = await import('../src/core/game.js');
  const dayGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  dayGame.dayNightSystem.load(0.3);
  dayGame.crystalSystem.random = () => 0.01;
  dayGame.tryUseCrystal();
  assert.notEqual(dayGame.dropSystem.drops[0].resource, 'springDrop', 'spring drops do not appear during day crystal interactions');

  const nightGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  nightGame.dayNightSystem.load(0.9);
  nightGame.crystalSystem.random = () => 0.01;
  nightGame.tryUseCrystal();
  assert.equal(nightGame.dropSystem.drops[0].resource, 'springDrop', 'spring drops can appear during night crystal interactions');
  assert.equal(nightGame.crystalSystem.lastMessage, 'Ein Quelltropfen erscheint.', 'night spring drop writes a clear log');

  const pickaxeGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  pickaxeGame.dayNightSystem.load(0.9);
  pickaxeGame.crystalSystem.random = () => 0.01;
  pickaxeGame.inventory.add('woodenPickaxe', 1);
  pickaxeGame.hotbarSlots[0] = 'woodenPickaxe';
  pickaxeGame.tryAttackAction();
  assert.equal(pickaxeGame.dropSystem.drops[0].resource, 'springDrop', 'night pickaxe crystal action can create a spring drop');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.inventory.add('springDrop', 1);
  game.hotbarSlots[0] = 'springDrop';
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });

  assert.equal(game.tryPlaceSelectedItem(), true, 'spring drop can be used on earth');
  assert.equal(game.tileMap.getTile(1, 1), 'moistEarth', 'spring drop turns earth into moist earth');
  assert.equal(game.inventory.get('springDrop'), 0, 'using a spring drop on earth consumes it');
  assert.equal(game.tileMap.isGround(1, 1), true, 'moist earth remains walkable support');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.tileMap.setClay(1, 1);
  game.inventory.add('springDrop', 1);
  game.hotbarSlots[0] = 'springDrop';
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });

  assert.equal(game.tryPlaceSelectedItem(), true, 'spring drop can be used on clay');
  assert.equal(game.tileMap.getTile(1, 1), 'water', 'spring drop turns clay into a water source');
  assert.equal(game.inventory.get('springDrop'), 0, 'using a spring drop on clay consumes it');
  assert.equal(game.tileMap.isGround(1, 1), true, 'water source is walkable in the prototype');
}

{
  const tileMap = new TileMap();
  tileMap.setWater(2, 0);

  assert.equal(tileMap.isWatered(1, 0), true, 'water source moistens direct neighbor tiles');
  assert.equal(tileMap.isWatered(2, 0), true, 'water source is considered watered itself');
  assert.equal(tileMap.isWatered(-1, -1), false, 'water source does not moisten distant tiles');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.tileMap.setGrass(1, 1);
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });

  assert.equal(game.tryContextAction(), true, 'grass context action is handled even without a scythe');
  assert.equal(game.crystalSystem.lastMessage, 'Dafür brauchst du eine Sense.', 'grass harvest requires a scythe');
  assert.equal(game.dropSystem.drops.length, 0, 'grass does not drop fibers without a scythe');

  game.inventory.add('scythe', 1);
  assert.equal(game.tryContextAction(), true, 'scythe enables grass harvest as a passive ability');
  assert.equal(game.dropSystem.drops[0].resource, 'fiber', 'scythe grass harvest creates fiber drops');
  assert.equal(game.tileMap.getTile(1, 1), 'grass', 'harvested grass remains a grass tile');
  assert.equal(game.plantSystem.grassCooldowns.size, 1, 'grass harvest starts a regrowth cooldown');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.inventory.add('treeSeed', 1);
  game.hotbarSlots[0] = 'treeSeed';
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });

  assert.equal(game.tryPlaceSelectedItem(), true, 'tree seeds can be planted on earth');
  assert.equal(game.tileMap.getObject(1, 1), OBJECT_TYPES.sapling, 'tree seed creates a sapling object');
  game.plantSystem.update(SAPLING_GROW_SECONDS + 0.1, game.tileMap);
  assert.equal(game.tileMap.getObject(1, 1), OBJECT_TYPES.tree, 'sapling grows into a tree');

  const treeBlockedPlayer = new Player(
    0 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    1 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  treeBlockedPlayer.update(0.2, inputWith('d'), game.tileMap);
  assert.equal(treeBlockedPlayer.getTilePosition().x, 0, 'grown tree blocks the tile for player movement');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.inventory.add('treeSeed', 1);
  game.hotbarSlots[0] = 'treeSeed';
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });
  game.tryPlaceSelectedItem();
  game.plantSystem.update(SAPLING_GROW_SECONDS + 0.1, game.tileMap);

  assert.equal(game.tryContextAction(), true, 'tree context action is handled without an axe');
  assert.equal(game.crystalSystem.lastMessage, 'Dafür brauchst du eine Axt.', 'tree harvest requires an axe');
  assert.equal(game.tileMap.getObject(1, 1), OBJECT_TYPES.tree, 'tree remains without an axe');

  game.inventory.add('axe', 1);
  game.hotbarSlots[0] = 'earth';
  game.crystalSystem.random = () => 0.5;
  assert.equal(game.tryContextAction(), true, 'axe enables tree felling as a passive ability');
  assert.equal(game.tileMap.getObject(1, 1), null, 'tree is removed after axe felling');
  const rawWoodDrop = game.dropSystem.drops.find((drop) => drop.resource === 'rawWood');
  const treeSeedDrop = game.dropSystem.drops.find((drop) => drop.resource === 'treeSeed');
  assert.ok(rawWoodDrop.amount >= 4 && rawWoodDrop.amount <= 8, 'felled tree creates 4-8 raw wood');
  assert.ok(treeSeedDrop.amount >= 1 && treeSeedDrop.amount <= 3, 'felled tree creates 1-3 tree seeds');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.inventory.add('berry', 1);
  game.hotbarSlots[0] = 'berry';
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });

  assert.equal(game.tryPlaceSelectedItem(), true, 'berries can seed a berry bush for the first farming slice');
  assert.equal(game.tileMap.getObject(1, 1), OBJECT_TYPES.berryBush, 'berry planting creates a berry bush');
  assert.equal(game.inventory.get('berry'), 0, 'planting a berry bush consumes one berry');

  game.plantSystem.update(BERRY_BUSH_GROW_SECONDS + 0.1, game.tileMap);
  game.hotbarSlots[0] = 'earth';
  assert.equal(game.tryContextAction(), true, 'ripe berry bush can be harvested');
  assert.equal(game.dropSystem.drops.some((drop) => drop.resource === 'berry'), true, 'berry bush harvest creates a berry drop');
  assert.equal(game.crystalSystem.lastMessage, 'Beeren geerntet.', 'berry harvest writes the requested log');
}

{
  const inventory = new ResourceInventory();
  const crafting = new CraftingSystem(inventory);

  inventory.add('rawWood', 6);
  inventory.add('stone', 4);
  inventory.add('fiber', 2);
  assert.equal(crafting.craft('axe', { hasWorkbenchAccess: true }).crafted, true, 'axe can be crafted at a workbench');
  assert.equal(inventory.get('axe'), 1, 'axe crafting adds axe item');

  inventory.add('rawWood', 4);
  inventory.add('stone', 3);
  inventory.add('fiber', 4);
  assert.equal(crafting.craft('scythe', { hasWorkbenchAccess: true }).crafted, true, 'scythe can be crafted at a workbench');
  assert.equal(inventory.get('scythe'), 1, 'scythe crafting adds scythe item');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.tileMap.setClay(2, 0);
  game.tileMap.setMoistEarth(3, 0);
  game.tileMap.setWater(4, 0);
  game.inventory.add('clay', 2);
  game.inventory.add('springDrop', 1);
  game.inventory.add('treeSeed', 1);
  game.inventory.add('berry', 3);
  game.inventory.add('axe', 1);
  game.inventory.add('scythe', 1);
  game.plantSystem.plantTreeSeed(game.tileMap, 1, 1);
  game.plantSystem.update(SAPLING_GROW_SECONDS + 0.1, game.tileMap);
  game.plantSystem.plantBerryBush(game.tileMap, -1, 1);
  game.dropSystem.spawnAtTile({ resource: 'springDrop', amount: 1 }, { x: 1, y: 0 });
  game.hotbarSlots = ['clay', 'springDrop', 'axe', 'scythe'];
  game.activeHotbarSlot = 2;
  game.saveGame();

  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.tileMap.getTile(2, 0), 'clay', 'saved clay tiles load');
  assert.equal(loadedGame.tileMap.getTile(3, 0), 'moistEarth', 'saved moist earth tiles load');
  assert.equal(loadedGame.tileMap.getTile(4, 0), 'water', 'saved water source tiles load');
  assert.equal(loadedGame.inventory.get('clay'), 2, 'saved clay item loads');
  assert.equal(loadedGame.inventory.get('springDrop'), 1, 'saved spring drop item loads');
  assert.equal(loadedGame.inventory.get('treeSeed'), 1, 'saved tree seed item loads');
  assert.equal(loadedGame.inventory.get('berry'), 3, 'saved berries load');
  assert.equal(loadedGame.inventory.get('axe'), 1, 'saved axe loads');
  assert.equal(loadedGame.inventory.get('scythe'), 1, 'saved scythe loads');
  assert.equal(loadedGame.tileMap.getObject(1, 1), OBJECT_TYPES.tree, 'saved grown tree loads');
  assert.equal(loadedGame.tileMap.getObject(-1, 1), OBJECT_TYPES.berryBush, 'saved berry bush loads');
  assert.equal(loadedGame.dropSystem.drops[0].resource, 'springDrop', 'saved visible spring drops load');
  assert.deepEqual(loadedGame.hotbarSlots, ['clay', 'springDrop', 'axe', 'scythe'], 'new items can be assigned to the four-slot hotbar');
  assert.equal(loadedGame.hotbarSlots.length, HOTBAR_SLOT_COUNT, 'hotbar stays capped at four slots after new item save/load');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.tileMap.setClay(2, 0);
  game.tileMap.setWater(3, 0);
  game.inventory.add('clay', 1);
  game.inventory.add('springDrop', 1);
  game.inventory.add('treeSeed', 1);
  game.inventory.add('berry', 1);
  game.inventory.add('axe', 1);
  game.inventory.add('scythe', 1);
  game.plantSystem.plantTreeSeed(game.tileMap, 1, 1);
  game.dropSystem.spawnAtTile({ resource: 'springDrop', amount: 1 }, { x: 1, y: 0 });
  game.saveGame();
  game.input.keys.add('r');
  game.update(2.1);

  assert.equal(game.tileMap.getTile(2, 0), null, 'reset removes placed clay tiles');
  assert.equal(game.tileMap.getTile(3, 0), null, 'reset removes water sources');
  assert.equal(game.inventory.get('clay'), 0, 'reset clears clay items');
  assert.equal(game.inventory.get('springDrop'), 0, 'reset clears spring drops');
  assert.equal(game.inventory.get('treeSeed'), 0, 'reset clears tree seeds');
  assert.equal(game.inventory.get('berry'), 0, 'reset clears berries');
  assert.equal(game.inventory.get('axe'), 0, 'reset clears axe');
  assert.equal(game.inventory.get('scythe'), 0, 'reset clears scythe');
  assert.equal(game.plantSystem.plants.size, 0, 'reset clears new plants');
  assert.equal(game.dropSystem.drops.length, 0, 'reset clears new visible drops');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.plantSystem.plantTreeSeed(game.tileMap, 1, 1);
  const before = game.plantSystem.getPlant(1, 1).growthSeconds;
  game.inventoryOpen = true;
  game.update(1);

  assert.equal(game.plantSystem.getPlant(1, 1).growthSeconds, before, 'menu pause stops plant growth timers');
}

{
  const scrollPanel = {
    hidden: true,
    _html: '',
    _list: null,
    set innerHTML(value) {
      this._html = value;
      this._list = value.includes('data-craft-scroll')
        ? { dataset: { craftScroll: value.includes('data-craft-scroll="workbench"') ? 'workbench' : 'normal' }, scrollTop: 0 }
        : null;
    },
    get innerHTML() {
      return this._html;
    },
    addEventListener() {},
    querySelector(selector) {
      return selector === '[data-craft-scroll]' ? this._list : null;
    }
  };
  const inventory = new ResourceInventory();
  const crafting = new CraftingSystem(inventory);
  const menus = new MenuPanels({ craftingPanel: scrollPanel, inventoryPanel: createRectElement({ left: 0, top: 0, width: 1, height: 1 }) });

  menus.renderCrafting(inventory, true, crafting.getRecipeStates({ craftingContext: 'normal' }), 'normal');
  scrollPanel.querySelector('[data-craft-scroll]').scrollTop = 88;
  menus.selectCraftingRecipe('torch');
  menus.renderCrafting(inventory, true, crafting.getRecipeStates({ craftingContext: 'normal' }), 'normal');
  assert.equal(scrollPanel.querySelector('[data-craft-scroll]').scrollTop, 88, 'normal crafting menu preserves list scroll position');

  menus.renderCrafting(inventory, true, crafting.getRecipeStates({ craftingContext: 'workbench', hasWorkbenchAccess: true }), 'workbench');
  scrollPanel.querySelector('[data-craft-scroll]').scrollTop = 144;
  menus.selectCraftingRecipe('bow');
  menus.renderCrafting(inventory, true, crafting.getRecipeStates({ craftingContext: 'workbench', hasWorkbenchAccess: true }), 'workbench');
  assert.equal(scrollPanel.querySelector('[data-craft-scroll]').scrollTop, 144, 'workbench crafting menu preserves its own list scroll position');
  assert.equal(scrollPanel.innerHTML.includes('data-craft="bow"'), true, 'crafting button remains rendered after recipe scroll and selection');
}

{
  let pointerdown = null;
  const pointerTarget = { addEventListener(type, callback) { if (type === 'pointerdown') pointerdown = callback; } };
  const canvas = { width: 960, height: 540, focus() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }) };
  let crafted = null;
  const craftButton = createRectElement(
    { left: 500, top: 320, width: 160, height: 42 },
    { dataset: { craft: 'bow' }, disabled: false }
  );
  const craftingPanel = createRectElement(
    { left: 280, top: 80, width: 420, height: 340 },
    { querySelectorAll: (selector) => (selector === '[data-craft]' ? [craftButton] : []) }
  );
  new PointerHitboxSystem({
    canvas,
    craftingPanel,
    getCraftingOpen: () => true,
    onCraft(recipeId) { crafted = recipeId; },
    pointerTarget
  });

  pointerdown(createPointerEvent(520, 330));
  assert.equal(crafted, 'bow', 'crafting button remains clickable after scroll-position changes');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.plantSystem.plantTreeSeed(game.tileMap, 1, 1);
  let plant = game.plantSystem.getPlant(1, 1);
  assert.equal(game.tileMap.getObject(1, 1), OBJECT_TYPES.sapling, 'tree growth stage one is a sapling object');
  assert.equal(game.tileMap.objectStates.get('1,1').growthStage, 1, 'tree stage one is saved as render state');
  plant.growthSeconds = SAPLING_GROW_SECONDS * 0.3;
  game.plantSystem.syncPlantObjectState(game.tileMap, plant);
  assert.equal(game.tileMap.objectStates.get('1,1').growthStage, 2, 'young tree stage is visible before maturity');
  game.plantSystem.update(SAPLING_GROW_SECONDS, game.tileMap);
  assert.equal(game.tileMap.getObject(1, 1), OBJECT_TYPES.tree, 'tree reaches mature object stage');
  assert.equal(game.tileMap.objectStates.get('1,1').growthStage, 3, 'mature tree stage is saved as render state');
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.tileMap.getObject(1, 1), OBJECT_TYPES.tree, 'tree growth stage loads as mature tree');
  assert.equal(loadedGame.tileMap.objectStates.get('1,1').growthStage, 3, 'loaded tree keeps mature growth stage');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.plantSystem.plantBerryBush(game.tileMap, 1, 1);
  let plant = game.plantSystem.getPlant(1, 1);
  assert.equal(game.tileMap.objectStates.get('1,1').growthStage, 1, 'berry bush starts as small bush');
  plant.growthSeconds = BERRY_BUSH_GROW_SECONDS * 0.25;
  game.plantSystem.update(0, game.tileMap);
  assert.equal(game.tileMap.objectStates.get('1,1').growthStage, 2, 'berry bush has a larger middle stage');
  game.plantSystem.update(BERRY_BUSH_GROW_SECONDS, game.tileMap);
  assert.equal(game.tileMap.objectStates.get('1,1').growthStage, 3, 'ripe berry bush shows berry stage');
  assert.equal(game.tileMap.objectStates.get('1,1').ready, true, 'ripe berry bush state is visible');
  game.plantSystem.harvestBerryBush(1, 1, game.tileMap);
  assert.equal(game.tileMap.objectStates.get('1,1').ready, false, 'harvested berry bush hides ripe berries');
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.tileMap.getObject(1, 1), OBJECT_TYPES.berryBush, 'berry bush growth state loads');
  assert.equal(loadedGame.tileMap.objectStates.get('1,1').ready, false, 'loaded berry bush keeps harvested state');
}

{
  const player = createSpawnedPlayer();
  const collisionMap = new TileMap();
  collisionMap.setWorkbench(1, 1);
  collisionMap.setObject(1, 0, OBJECT_TYPES.table);
  collisionMap.setObject(-1, 1, OBJECT_TYPES.woodWall);
  collisionMap.setObject(0, -1, OBJECT_TYPES.chair);
  collisionMap.setObject(-1, 0, OBJECT_TYPES.berryBush);
  collisionMap.setObject(0, 1, OBJECT_TYPES.tree);

  assert.equal(collisionMap.isBlockedForPlayer(1, 1), true, 'workbench blocks player movement');
  assert.equal(collisionMap.isBlockedForGroundEntity(1, 0), true, 'table blocks ground enemies');
  assert.equal(collisionMap.isBlockedForGroundEntity(-1, 1), true, 'wood wall blocks ground enemies');
  assert.equal(collisionMap.isBlockedForFlyingEntity(-1, 1), true, 'wood wall blocks flying enemies');
  assert.equal(collisionMap.isBlockedForPlayer(0, 1), true, 'tree start tile blocks player movement');
  assert.equal(collisionMap.isBlockedForGroundEntity(0, 1), true, 'tree start tile blocks ground enemies');
  assert.equal(collisionMap.isBlockedForFlyingEntity(0, 1), true, 'tree start tile blocks flying enemies');
  assert.equal(collisionMap.isBlockedForPlayer(0, -1), false, 'chair remains walkable');
  assert.equal(collisionMap.isBlockedForGroundEntity(-1, 0), false, 'berry bush remains walkable');

  const before = player.x;
  player.update(0.25, inputWith('s'), collisionMap);
  assert.equal(player.x, before, 'blocking object does not create a void-safe area and blocks only its tile');
}

{
  const context = createDrawContext();
  const { RenderSystem } = await import('../src/systems/render-system.js');
  const renderer = new RenderSystem(context);
  assert.deepEqual(renderer.getTreeRenderProfile(), {
    trunkOpaque: true,
    crownOpaqueLeaves: true,
    crownHasLeafGaps: true
  }, 'tree render profile marks opaque trunk and leaf gaps');
  renderer.drawTree(64, 64, 3);
  const trunkCall = context.calls.find((call) => call.fn === 'fillRect' && call.fillStyle === '#6b3f22');
  const leafCalls = context.calls.filter((call) => call.fn === 'fillRect' && ['#2f6f35', '#4f9e42', '#83c85e'].includes(call.fillStyle));
  assert.equal(trunkCall?.globalAlpha, 1, 'tree trunk is rendered fully opaque');
  assert.ok(leafCalls.length >= 6, 'tree crown is rendered as separate leaf blocks with real gaps');
  assert.equal(leafCalls.every((call) => call.globalAlpha === 1), true, 'tree crown leaves are not globally transparent');
}

{
  const barrierMap = new TileMap();
  barrierMap.setObject(0, 0, OBJECT_TYPES.woodWall);
  barrierMap.setObject(1, 0, OBJECT_TYPES.woodWall);
  barrierMap.setObject(-1, 0, OBJECT_TYPES.woodWall);
  assert.deepEqual(barrierMap.getConnectableConnections(0, 0), { up: false, down: false, left: true, right: true }, 'wood wall detects horizontal neighbors');
  assert.equal(barrierMap.getConnectableVariant(0, 0), 'horizontal', 'horizontal wall variant is computed');
  assert.deepEqual(
    barrierMap.getWallDoorRenderState(0, 0),
    {
      type: OBJECT_TYPES.woodWall,
      x: 0,
      y: 0,
      open: false,
      connections: { up: false, down: false, left: true, right: true },
      horizontal: true,
      vertical: false,
      post: false,
      thickness: 8,
      variant: 'horizontal'
    },
    'wood wall render state is derived from stable position and neighbor data'
  );

  barrierMap.setObject(0, -1, OBJECT_TYPES.woodWall);
  barrierMap.setObject(0, 1, OBJECT_TYPES.woodWall);
  assert.deepEqual(barrierMap.getConnectableConnections(0, 0), { up: true, down: true, left: true, right: true }, 'wall detects all four neighbors');
  assert.equal(barrierMap.getConnectableVariant(0, 0), 'cross', 'cross variant is computed');
  barrierMap.removeObject(0, -1);
  assert.equal(barrierMap.getConnectableVariant(0, 0), 'tee-up', 'neighbor removal updates connectable variant');

  const fenceMap = new TileMap();
  fenceMap.setObject(0, 0, OBJECT_TYPES.fence);
  fenceMap.setObject(0, 1, OBJECT_TYPES.gate);
  assert.equal(fenceMap.getConnectableConnections(0, 0).down, true, 'fence connects to gate');
  assert.equal(fenceMap.getConnectableVariant(0, 0), 'end-down', 'single fence-gate connection becomes an end variant');

  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.tileMap.setObject(0, 1, OBJECT_TYPES.fence);
  game.tileMap.setObject(1, 1, OBJECT_TYPES.gate);
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.tileMap.getConnectableConnections(0, 1).right, true, 'connectable state recomputes after save/load');
}

{
  const verticalMap = new TileMap();
  verticalMap.setObject(1, 0, OBJECT_TYPES.woodWall);
  verticalMap.setObject(1, -1, OBJECT_TYPES.woodWall);
  verticalMap.setObject(1, 1, OBJECT_TYPES.woodWall);
  assert.equal(verticalMap.getConnectableVariant(1, 0), 'vertical', 'vertical wall variant is computed');
  assert.equal(verticalMap.isBlockedForPlayerAtWorld(1 * TILE_SIZE + 3, TILE_SIZE / 2), false, 'vertical barrier is not a full-tile blocker at the left edge');
  assert.equal(verticalMap.isBlockedForPlayerAtWorld(1 * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2), true, 'vertical barrier blocks at its center stripe');

  const horizontalMap = new TileMap();
  horizontalMap.setObject(1, 0, OBJECT_TYPES.fence);
  horizontalMap.setObject(0, 0, OBJECT_TYPES.fence);
  horizontalMap.setObject(2, 0, OBJECT_TYPES.gate);
  assert.equal(horizontalMap.getConnectableVariant(1, 0), 'horizontal', 'horizontal fence/gate variant is computed');
  assert.equal(horizontalMap.isBlockedForPlayerAtWorld(1 * TILE_SIZE + TILE_SIZE / 2, 0 * TILE_SIZE + 3), false, 'horizontal barrier allows standing in front of the line');
  assert.equal(horizontalMap.isBlockedForPlayerAtWorld(1 * TILE_SIZE + TILE_SIZE / 2, 0 * TILE_SIZE + TILE_SIZE - 3), false, 'horizontal barrier allows standing behind the line');
  assert.equal(horizontalMap.isBlockedForPlayerAtWorld(1 * TILE_SIZE + TILE_SIZE / 2, 0 * TILE_SIZE + TILE_SIZE / 2), true, 'horizontal barrier blocks on its center line');
  horizontalMap.toggleGate(2, 0);
  assert.equal(horizontalMap.isBlockedForPlayerAtWorld(2 * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2), false, 'open gate is passable at the barrier line');

  const playerNearBarrier = new Player(
    0 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  assert.equal(playerNearBarrier.canMoveTo(1 * TILE_SIZE + 3 - PLAYER_SIZE / 2, playerNearBarrier.y, verticalMap), true, 'player can step into the side of a vertical barrier tile');
  assert.equal(playerNearBarrier.canMoveTo(1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2, playerNearBarrier.y, verticalMap), false, 'player cannot pass through the vertical barrier stripe');

  const groundEnemy = Enemy.fromTile({ x: 0, y: 0 });
  assert.equal(groundEnemy.canStandAt(1 * TILE_SIZE + 3 - groundEnemy.width / 2, groundEnemy.y, verticalMap), true, 'ground enemy can move along a barrier side');
  assert.equal(groundEnemy.canStandAt(1 * TILE_SIZE + TILE_SIZE / 2 - groundEnemy.width / 2, groundEnemy.y, verticalMap), false, 'ground enemy respects orientated barrier stripe');
}

{
  assert.equal(chooseWeightedDrop(CRYSTAL_ENCOUNTER_DROPS, 0.79).encounter, 'ground', 'crystal encounter weighting keeps 80 percent ground enemies');
  assert.equal(chooseWeightedDrop(CRYSTAL_ENCOUNTER_DROPS, 0.80).encounter, 'flying', 'crystal encounter weighting assigns the final 20 percent to flying enemies');
}

{
  const inventory = new ResourceInventory();
  const crafting = new CraftingSystem(inventory);
  inventory.add('fiber', 8);
  inventory.add('rawWood', 2);
  assert.equal(crafting.craft('lasso', { hasWorkbenchAccess: true }).crafted, true, 'lasso can be crafted at a workbench');
  assert.equal(inventory.get('lasso'), 1, 'lasso crafting adds lasso item');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  const spawn = game.animalSystem.spawn(game.tileMap);
  game.inventory.add('lasso', 1);
  spawn.animal.setTilePosition({ x: 1, y: 1 });
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });

  game.tryContextAction();
  assert.equal(spawn.animal.tethered, false, 'chicken stays free while lasso is not active');
  game.hotbarSlots[0] = 'lasso';
  game.activeHotbarSlot = 0;
  assert.equal(game.tryContextAction(), true, 'active lasso can catch a nearby chicken through context action');
  assert.equal(spawn.animal.tethered, true, 'caught chicken becomes tethered');
  assert.equal(game.crystalSystem.lastMessage, 'Huhn eingefangen.', 'catching chicken writes a clear log');

  game.player.setPosition(4 * TILE_SIZE, 1 * TILE_SIZE);
  game.animalSystem.update(0.5, game.tileMap, game.player);
  assert.ok(Math.hypot(spawn.animal.getFootPosition().x - game.player.getFootPosition().x, spawn.animal.getFootPosition().y - game.player.getFootPosition().y) < TILE_SIZE * 4, 'tethered chicken follows the player or recovers nearby');

  assert.equal(game.tryContextAction(), true, 'active lasso releases a tethered chicken');
  assert.equal(spawn.animal.tethered, false, 'released chicken returns to normal movement');
  assert.equal(game.crystalSystem.lastMessage, 'Huhn losgelassen.', 'release writes a clear log');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  const spawn = game.animalSystem.spawn(game.tileMap);
  spawn.animal.tethered = true;
  game.inventory.add('lasso', 1);
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.inventory.get('lasso'), 1, 'lasso saves and loads');
  assert.equal(loadedGame.animalSystem.getTetheredAnimal()?.tethered, true, 'tethered chicken state saves and loads');
}

{
  const inventory = new ResourceInventory();
  const crafting = new CraftingSystem(inventory);
  inventory.add('rawWood', 7);
  inventory.add('fiber', 3);
  assert.equal(crafting.craft('fence', { hasWorkbenchAccess: true }).crafted, true, 'fence can be crafted at a workbench');
  assert.equal(inventory.get('fence'), 2, 'fence recipe creates two fence pieces');
  assert.equal(crafting.craft('gate', { hasWorkbenchAccess: true }).crafted, true, 'gate can be crafted at a workbench');
  assert.equal(inventory.get('gate'), 1, 'gate recipe creates one gate');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.inventory.add('fence', 1);
  game.hotbarSlots[0] = 'fence';
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });
  assert.equal(game.tryPlaceSelectedItem(), true, 'fence can be placed on ground');
  assert.equal(game.tileMap.getObject(1, 1), OBJECT_TYPES.fence, 'placed fence becomes a world object');
  assert.equal(game.tileMap.isBlockedForGroundEntity(1, 1), true, 'fence blocks ground entities and animals');

  game.inventory.add('gate', 1);
  game.hotbarSlots[0] = 'gate';
  game.player.facing = { x: -1, y: 0 };
  assert.equal(game.tryPlaceSelectedItem(), true, 'gate can be placed on ground');
  assert.equal(game.tileMap.getObject(-1, 1), OBJECT_TYPES.gate, 'placed gate becomes a world object');
  game.tileMap.setObject(1, 0, OBJECT_TYPES.gate);
  game.player.facing = { x: 1, y: -1 };
  assert.equal(game.tileMap.isBlockedForPlayer(1, 0), true, 'closed gate blocks player');
  game.tileMap.toggleGate(1, 0);
  assert.equal(game.tileMap.isBlockedForPlayer(1, 0), false, 'open gate is passable');
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.tileMap.isGateOpen(1, 0), true, 'gate open state saves and loads');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  const chicken = game.animalSystem.spawn(game.tileMap).animal;
  chicken.setTilePosition({ x: -1, y: 1 });
  game.inventory.add('lasso', 1);
  game.hotbarSlots[0] = 'lasso';
  game.activeHotbarSlot = 0;
  game.tileMap.setObject(1, 1, OBJECT_TYPES.gate);
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });

  assert.equal(game.tryContextAction(), true, 'action prioritizes gate toggling before lasso');
  assert.equal(game.tileMap.isGateOpen(1, 1), true, 'gate toggles through context action first');
  assert.equal(chicken.tethered, false, 'chicken is not caught when gate action wins priority');
}

{
  const randomValues = [0, 0.5, 0.5, 0.98, 0.25, 0.75];
  const dropMap = new TileMap();
  const firstDropSystem = new DropSystem(() => randomValues.shift() ?? 0);
  const first = firstDropSystem.spawnFromCrystal({ resource: 'earth', amount: 1 }, dropMap);
  const second = firstDropSystem.spawnFromCrystal({ resource: 'rawWood', amount: 1 }, dropMap);
  assert.notDeepEqual(first.tile, second.tile, 'crystal drops choose random valid landing tiles instead of always the first tile');
  assert.notEqual(second.x, second.tile.x * TILE_SIZE + TILE_SIZE / 2, 'drop gets a horizontal offset inside its tile');
  assert.notEqual(second.y, second.tile.y * TILE_SIZE + TILE_SIZE / 2, 'drop gets a vertical offset inside its tile');
  assert.equal(dropMap.isGround(first.tile.x, first.tile.y), true, 'crystal drop lands on a ground tile');
  assert.equal(dropMap.isCrystal(first.tile.x, first.tile.y), false, 'crystal drop avoids the crystal');

  dropMap.setObject(first.tile.x, first.tile.y, OBJECT_TYPES.workbench);
  const blockedDrop = firstDropSystem.spawnNearWorld({ resource: 'fiber', amount: 1 }, dropMap, first.x, first.y);
  assert.equal(dropMap.getObject(blockedDrop.tile.x, blockedDrop.tile.y), null, 'drop relocation avoids blocked object tiles');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.dropSystem.random = () => 0.75;
  game.crystalSystem.random = () => 0;
  setGamePlayerOnTile(game, 0, 1, { x: 0, y: -1 });
  assert.equal(game.tryUseCrystal(), true, 'crystal interaction uses visible drop logic');
  const crystalDrop = game.dropSystem.drops[0];
  assert.equal(game.tileMap.isGroundAtWorld(crystalDrop.x, crystalDrop.y), true, 'crystal drop uses valid random world landing');
  assert.equal(game.tileMap.isCrystalAtWorld(crystalDrop.x, crystalDrop.y), false, 'crystal drop never lands on crystal');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.dropSystem.random = () => 0.9;
  game.tileMap.setObject(1, 1, OBJECT_TYPES.tree);
  game.plantSystem.plants.set('1,1', { type: OBJECT_TYPES.tree, x: 1, y: 1, growthSeconds: 0, ready: true });
  game.inventory.add('axe', 1);
  game.crystalSystem.random = () => 0.99;
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });

  assert.equal(game.tryHarvestTree(), true, 'tree can be felled for drop landing tests');
  const rawWoodDrop = game.dropSystem.drops.find((drop) => drop.resource === 'rawWood');
  const treeSeedDrop = game.dropSystem.drops.find((drop) => drop.resource === 'treeSeed');
  assert.ok(rawWoodDrop.amount >= 4 && rawWoodDrop.amount <= 8, 'tree felling produces 4-8 raw wood');
  assert.ok(treeSeedDrop.amount >= 1 && treeSeedDrop.amount <= 3, 'tree felling produces 1-3 tree seeds');
  assert.equal(game.tileMap.isGroundAtWorld(rawWoodDrop.x, rawWoodDrop.y), true, 'tree raw wood drop lands on ground');
  assert.equal(game.tileMap.isGroundAtWorld(treeSeedDrop.x, treeSeedDrop.y), true, 'tree seed drop lands on ground');
}

{
  const mapWithFence = new TileMap();
  mapWithFence.setObject(1, 0, OBJECT_TYPES.fence);
  mapWithFence.setObject(1, 1, OBJECT_TYPES.fence);
  mapWithFence.setObject(1, 2, OBJECT_TYPES.fence);
  const chicken = Animal.fromTile({ x: 0, y: 1 });
  chicken.direction = { x: 1, y: 0 };
  chicken.update(2, mapWithFence, () => 0);
  assert.equal(chicken.getFootPosition().x < TILE_SIZE + TILE_SIZE / 2, true, 'chickens respect fence collision while still entering the half-tile approach area');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.toggleBuildMenu();
  assert.equal(game.buildOpen, true, 'build menu opens');
  assert.equal(game.isGamePaused(), true, 'build menu pauses the game');
  game.inventory.add('woodWall', 1);
  assert.equal(game.selectBuildResource('woodWall'), true, 'build menu selection chooses a build item');
  assert.equal(game.getActiveHotbarItem(), 'woodWall', 'build menu selection sets active placement item');
}

{
  let pointerdown = null;
  const pointerTarget = { addEventListener(type, callback) { if (type === 'pointerdown') pointerdown = callback; } };
  const canvas = { width: 960, height: 540, focus() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }) };
  let selected = null;
  let removeToggled = false;
  const buildItem = createRectElement({ left: 320, top: 150, width: 160, height: 42 }, { dataset: { buildResource: 'fence' } });
  const removeButton = createRectElement({ left: 320, top: 100, width: 160, height: 42 }, { dataset: { buildRemove: 'true' } });
  const buildPanel = createRectElement(
    { left: 300, top: 80, width: 360, height: 300 },
    { querySelectorAll: (selector) => {
      if (selector === '[data-build-resource]') return [buildItem];
      if (selector === '[data-build-remove]') return [removeButton];
      return [];
    } }
  );
  new PointerHitboxSystem({
    buildPanel,
    canvas,
    getBuildOpen: () => true,
    onBuildItemSelect(resource) { selected = resource; },
    onBuildRemoveToggle() { removeToggled = true; },
    pointerTarget
  });
  pointerdown(createPointerEvent(330, 160));
  assert.equal(selected, 'fence', 'build menu item is touch/click selectable');
  pointerdown(createPointerEvent(330, 110));
  assert.equal(removeToggled, true, 'build menu remove mode is touch/click selectable');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.tileMap.setObject(1, 1, OBJECT_TYPES.table);
  game.removeMode = true;
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });
  assert.equal(game.tryContextAction(), true, 'remove mode removes valid target object');
  assert.equal(game.tileMap.getObject(1, 1), null, 'removed object leaves world');
  assert.equal(game.inventory.get('table'), 1, 'removed object returns one item');
  game.tileMap.setObject(1, 1, OBJECT_TYPES.fence);
  game.tileMap.setObject(1, 0, OBJECT_TYPES.gate);
  game.buildSelectedResource = 'fence';
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.tileMap.getObject(1, 1), OBJECT_TYPES.fence, 'fence saves and loads');
  assert.equal(loadedGame.tileMap.getObject(1, 0), OBJECT_TYPES.gate, 'gate saves and loads');
  assert.equal(loadedGame.buildSelectedResource, 'fence', 'build menu selection saves and loads');
  assert.equal(loadedGame.removeMode, true, 'remove mode saves and loads when active');
  loadedGame.input.keys.add('r');
  loadedGame.update(2.1);
  assert.equal(loadedGame.tileMap.getObject(1, 1), null, 'reset removes new fence object');
  assert.equal(loadedGame.inventory.get('lasso'), 0, 'reset clears lasso item state');
  assert.equal(loadedGame.removeMode, false, 'reset clears remove mode');
}

{
  const { Game } = await import('../src/core/game.js');
  const gateGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  gateGame.tileMap.setObject(1, 1, OBJECT_TYPES.gate);
  gateGame.removeMode = true;
  setGamePlayerOnTile(gateGame, 0, 1, { x: 1, y: 0 });
  assert.equal(gateGame.tryContextAction(), true, 'remove mode has priority before gate open/close');
  assert.equal(gateGame.tileMap.getObject(1, 1), null, 'gate can be removed through context action while remove mode is active');
  assert.equal(gateGame.inventory.get('gate'), 1, 'removed gate returns one gate item');

  const doorGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  doorGame.tileMap.setObject(1, 1, OBJECT_TYPES.door);
  doorGame.removeMode = true;
  setGamePlayerOnTile(doorGame, 0, 1, { x: 1, y: 0 });
  assert.equal(doorGame.tryContextAction(), true, 'remove mode has priority before door open/close');
  assert.equal(doorGame.tileMap.getObject(1, 1), null, 'door can be removed through context action while remove mode is active');
  assert.equal(doorGame.inventory.get('door'), 1, 'removed door returns one door item');

  const toggleGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  toggleGame.tileMap.setObject(1, 1, OBJECT_TYPES.gate);
  setGamePlayerOnTile(toggleGame, 0, 1, { x: 1, y: 0 });
  assert.equal(toggleGame.tryContextAction(), true, 'gate still toggles when remove mode is inactive');
  assert.equal(toggleGame.tileMap.getObject(1, 1), OBJECT_TYPES.gate, 'inactive remove mode leaves gate in the world');
  assert.equal(toggleGame.tileMap.isGateOpen(1, 1), true, 'inactive remove mode keeps normal gate open/close behavior');
}

{
  const inventory = new ResourceInventory();
  const crafting = new CraftingSystem(inventory);
  inventory.add('rawWood', 4);
  inventory.add('fiber', 2);
  assert.equal(crafting.craft('door', { hasWorkbenchAccess: true }).crafted, true, 'door can be crafted at a workbench');
  assert.equal(inventory.get('door'), 1, 'door appears in inventory resources after crafting');
}

{
  const buildPanel = {
    hidden: true,
    innerHTML: '',
    addEventListener() {}
  };
  const menus = new MenuPanels({
    buildPanel,
    craftingPanel: createRectElement({ left: 0, top: 0, width: 1, height: 1 }),
    inventoryPanel: createRectElement({ left: 0, top: 0, width: 1, height: 1 })
  });
  const inventory = new ResourceInventory();
  menus.renderBuildMenu(inventory, true, 'door', false);
  assert.equal(buildPanel.innerHTML.includes('data-build-resource="door"'), true, 'door appears in the build menu');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.inventory.add('door', 1);
  game.hotbarSlots[0] = 'door';
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });
  assert.equal(game.tryPlaceSelectedItem(), true, 'door can be placed on a valid ground tile');
  assert.equal(game.tileMap.getObject(1, 1), OBJECT_TYPES.door, 'placed door becomes a world object');
  assert.equal(game.inventory.get('door'), 0, 'placing door consumes one door item');
  assert.equal(game.tileMap.isBlockedForPlayer(1, 1), true, 'closed door blocks player tile checks');
  game.tileMap.toggleDoor(1, 1);
  assert.equal(game.tileMap.isDoorOpen(1, 1), true, 'door can be opened');
  assert.equal(game.tileMap.isBlockedForPlayer(1, 1), false, 'open door is passable');
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.tileMap.getObject(1, 1), OBJECT_TYPES.door, 'door saves and loads as a world object');
  assert.equal(loadedGame.tileMap.isDoorOpen(1, 1), true, 'door open state saves and loads');
}

{
  const connectMap = new TileMap();
  connectMap.setObject(0, 0, OBJECT_TYPES.door);
  connectMap.setObject(1, 0, OBJECT_TYPES.woodWall);
  connectMap.setObject(-1, 0, OBJECT_TYPES.door);
  connectMap.setObject(0, 1, OBJECT_TYPES.fence);
  assert.equal(connectMap.getConnectableConnections(0, 0).right, true, 'door connects to wood wall');
  assert.equal(connectMap.getConnectableConnections(0, 0).left, true, 'door connects to another door');
  assert.equal(connectMap.getConnectableConnections(0, 0).down, false, 'door does not connect to fence');
  assert.equal(connectMap.canConnectObjects(OBJECT_TYPES.door, OBJECT_TYPES.gate), false, 'door does not connect to gate');
  assert.equal(connectMap.getConnectableVariant(0, 0), 'horizontal', 'door/wall horizontal connection is computed');
  connectMap.removeObject(1, 0);
  assert.equal(connectMap.getConnectableVariant(0, 0), 'end-left', 'door connection updates after neighbor removal');
  const verticalConnectMap = new TileMap();
  verticalConnectMap.setObject(0, 0, OBJECT_TYPES.door);
  verticalConnectMap.setObject(0, -1, OBJECT_TYPES.woodWall);
  verticalConnectMap.setObject(0, 1, OBJECT_TYPES.woodWall);
  assert.equal(verticalConnectMap.getConnectableVariant(0, 0), 'vertical', 'door/wall vertical connection updates after placement');
  const saveObjects = verticalConnectMap.objectsToJSON();
  const loadedConnectMap = new TileMap();
  loadedConnectMap.loadObjects(saveObjects);
  assert.deepEqual(
    loadedConnectMap.getConnectableConnections(0, 0),
    verticalConnectMap.getConnectableConnections(0, 0),
    'connectable barrier variants are reconstructed from neighbors after load'
  );
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.inventory.add('lasso', 1);
  game.hotbarSlots[0] = 'lasso';
  game.activeHotbarSlot = 0;
  const chicken = game.animalSystem.spawn(game.tileMap).animal;
  chicken.setTilePosition({ x: -1, y: 1 });
  game.tileMap.setObject(1, 1, OBJECT_TYPES.door);
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });
  assert.equal(game.tryContextAction(), true, 'action prioritizes door toggling before lasso and crystal');
  assert.equal(game.tileMap.isDoorOpen(1, 1), true, 'door toggles through context action');
  assert.equal(chicken.tethered, false, 'chicken is not caught when door action wins priority');
}

{
  const collisionMap = new TileMap();
  collisionMap.setObject(1, 0, OBJECT_TYPES.door);
  collisionMap.setObject(1, -1, OBJECT_TYPES.woodWall);
  collisionMap.setObject(1, 1, OBJECT_TYPES.woodWall);
  assert.equal(collisionMap.isBlockedForPlayerAtWorld(1 * TILE_SIZE + 3, TILE_SIZE / 2), false, 'vertical door barrier is not a full-tile blocker at side edge');
  assert.equal(collisionMap.isBlockedForPlayerAtWorld(1 * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2), true, 'closed vertical door blocks its center stripe');
  collisionMap.toggleDoor(1, 0);
  assert.equal(collisionMap.isBlockedForPlayerAtWorld(1 * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2), false, 'open vertical door is passable at center stripe');

  const horizontalMap = new TileMap();
  horizontalMap.setObject(1, 0, OBJECT_TYPES.door);
  horizontalMap.setObject(0, 0, OBJECT_TYPES.woodWall);
  horizontalMap.setObject(2, 0, OBJECT_TYPES.woodWall);
  assert.equal(horizontalMap.isBlockedForPlayerAtWorld(1 * TILE_SIZE + TILE_SIZE / 2, 3), false, 'horizontal door allows standing in front');
  assert.equal(horizontalMap.isBlockedForPlayerAtWorld(1 * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE - 3), false, 'horizontal door allows standing behind');
  assert.equal(horizontalMap.isBlockedForPlayerAtWorld(1 * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2), true, 'horizontal closed door blocks the barrier line');
}

{
  const context = createDrawContext();
  const { RenderSystem } = await import('../src/systems/render-system.js');
  const renderer = new RenderSystem(context);
  assert.notDeepEqual(renderer.getBarrierRenderProfile(OBJECT_TYPES.woodWall), renderer.getBarrierRenderProfile(OBJECT_TYPES.fence), 'wood wall and fence use different render profiles');
  assert.notDeepEqual(renderer.getBarrierRenderProfile(OBJECT_TYPES.gate), renderer.getBarrierRenderProfile(OBJECT_TYPES.fence), 'gate has its own render profile');
  assert.notDeepEqual(renderer.getBarrierRenderProfile(OBJECT_TYPES.door), renderer.getBarrierRenderProfile(OBJECT_TYPES.woodWall), 'door has its own render profile');
  assert.notDeepEqual(renderer.getBarrierRenderProfile(OBJECT_TYPES.gate, true), renderer.getBarrierRenderProfile(OBJECT_TYPES.gate, false), 'open and closed gate render profiles differ');
  assert.notDeepEqual(renderer.getBarrierRenderProfile(OBJECT_TYPES.door, true), renderer.getBarrierRenderProfile(OBJECT_TYPES.door, false), 'open and closed door render profiles differ');
  assert.equal(renderer.getBarrierRenderProfile(OBJECT_TYPES.gate).sidePosts, true, 'gate profile uses two side posts');
  assert.equal(renderer.getBarrierRenderProfile(OBJECT_TYPES.gate).centerPost, false, 'gate profile does not use the normal fence center post');

  const horizontalShape = { horizontal: true, vertical: false, connections: { left: true, right: true, up: false, down: false } };
  const stableVariant = renderer.getBarrierVisualVariant(OBJECT_TYPES.woodWall, horizontalShape, false);
  assert.deepEqual(
    renderer.getBarrierVisualVariant(OBJECT_TYPES.woodWall, horizontalShape, false),
    stableVariant,
    'wood wall visual variant is stable across repeated render decisions'
  );
  assert.deepEqual(
    renderer.getBarrierVisualVariant(OBJECT_TYPES.woodWall, horizontalShape, false),
    renderer.getBarrierVisualVariant(OBJECT_TYPES.woodWall, horizontalShape, false),
    'wood wall variant depends on type and neighbors, not player movement'
  );
  assert.notDeepEqual(
    renderer.getBarrierVisualVariant(OBJECT_TYPES.door, horizontalShape, false),
    renderer.getBarrierVisualVariant(OBJECT_TYPES.door, horizontalShape, true),
    'door visual variant changes only when open state changes'
  );
  const stableDoorVariant = renderer.getBarrierVisualVariant(OBJECT_TYPES.door, horizontalShape, false);
  assert.deepEqual(
    renderer.getBarrierVisualVariant(OBJECT_TYPES.door, horizontalShape, false),
    stableDoorVariant,
    'door visual variant is stable across repeated render decisions'
  );
  assert.deepEqual(
    renderer.getBarrierVisualVariant(OBJECT_TYPES.door, horizontalShape, false),
    renderer.getBarrierVisualVariant(OBJECT_TYPES.door, horizontalShape, false),
    'door variant depends on type, neighbors, and open state rather than player movement'
  );
  const cornerShape = { horizontal: true, vertical: true, variant: 'corner-down-right', connections: { left: false, right: true, up: false, down: true } };
  const tShape = { horizontal: true, vertical: true, variant: 'tee-up', connections: { left: true, right: true, up: false, down: true } };
  assert.equal(renderer.getBarrierVisualVariant(OBJECT_TYPES.woodWall, cornerShape, false).splitSegments, false, 'wood wall corners use a final render plan instead of split standard segments');
  assert.equal(renderer.getBarrierVisualVariant(OBJECT_TYPES.woodWall, cornerShape, false).finalPlan, true, 'wood wall corners expose a final render plan');
  assert.equal(renderer.getBarrierVisualVariant(OBJECT_TYPES.door, tShape, false).finalPlan, true, 'door junctions expose a final render plan');
  assert.equal(renderer.getBarrierVisualVariant(OBJECT_TYPES.fence, cornerShape, false).splitSegments, true, 'fence corners use a real segmented joint variant');
  assert.equal(renderer.getBarrierVisualVariant(OBJECT_TYPES.woodWall, tShape, false).splitSegments, false, 'wood wall T-junctions are not drawn as overlaid split standard pieces');
  assert.equal(renderer.getBarrierVisualVariant(OBJECT_TYPES.woodWall, cornerShape, false).variant, 'corner-down-right', 'wood wall corner uses one canonical final corner variant');
  assert.equal(renderer.getBarrierVisualVariant(OBJECT_TYPES.door, tShape, false).variant, 'tee-up', 'door/wall junction uses one canonical final tee variant');
  assert.equal(renderer.getCanonicalBarrierVariant(cornerShape.connections), 'corner-down-right', 'corner variant is computed from stable neighbor data');
  assert.deepEqual(
    renderer.getWallDoorRenderPlan(cornerShape, renderer.getBarrierPalette(OBJECT_TYPES.woodWall)),
    renderer.getWallDoorRenderPlan(cornerShape, renderer.getBarrierPalette(OBJECT_TYPES.woodWall)),
    'wall render plan is deterministic across frames with identical input'
  );
  assert.equal(renderer.getWallDoorRenderPlan(cornerShape, renderer.getBarrierPalette(OBJECT_TYPES.woodWall)).final, true, 'wall corner is rendered from one final plan object');
  assert.equal(renderer.getWallDoorRenderPlan(tShape, renderer.getBarrierPalette(OBJECT_TYPES.door)).final, true, 'door tee is rendered from one final plan object');
  renderer.drawWoodWall(0, 0, horizontalShape);
  const wallCalls = [...context.calls];
  assert.equal(wallCalls.some((call) => call.fn === 'fillRect' && call.args[1] < 0), true, 'horizontal wood wall is rendered upward onto the barrier line instead of flat on the tile');
  assert.equal(wallCalls.some((call) =>
    call.fn === 'fillRect' &&
    call.fillStyle === '#3a2418' &&
    call.args[0] === 10 &&
    call.args[1] === 2 &&
    call.args[2] === 12 &&
    call.args[3] === 28
  ), false, 'horizontal wood wall does not draw a lower center-post artifact');
  context.calls.length = 0;
  renderer.drawFence(0, 0, horizontalShape);
  assert.notDeepEqual(wallCalls.map((call) => call.args), context.calls.map((call) => call.args), 'horizontal wall rendering is not identical to horizontal fence rendering');
  const fenceCalls = [...context.calls];

  context.calls.length = 0;
  renderer.drawGate(0, 0, false, horizontalShape);
  const gatePostCalls = context.calls.filter((call) =>
    call.fn === 'fillRect' &&
    call.fillStyle === '#3a2418' &&
    call.args[3] >= 20
  );
  assert.deepEqual(gatePostCalls.map((call) => call.args[0]), [4, 22], 'horizontal gate draws left and right posts instead of a center fence post');
  assert.notDeepEqual(context.calls.map((call) => call.args), fenceCalls.map((call) => call.args), 'gate rendering is not identical to a normal fence segment');

  context.calls.length = 0;
  renderer.drawDoor(0, 0, false, horizontalShape);
  assert.equal(context.calls.some((call) => call.fn === 'fillRect' && call.args[1] < 0), true, 'horizontal wall door is rendered upward with the wall barrier');
  assert.equal(context.calls.some((call) =>
    call.fn === 'fillRect' &&
    call.fillStyle === '#2e1d14' &&
    call.args[0] === 11 &&
    call.args[1] === 3 &&
    call.args[2] === 11 &&
    call.args[3] === 26
  ), false, 'horizontal door does not draw a lower center-post artifact');

  context.calls.length = 0;
  const verticalShape = { horizontal: false, vertical: true, connections: { left: false, right: false, up: true, down: true } };
  renderer.drawWoodWall(0, 0, verticalShape);
  const verticalWallCalls = [...context.calls];
  context.calls.length = 0;
  renderer.drawFence(0, 0, verticalShape);
  assert.notDeepEqual(verticalWallCalls.map((call) => call.args), context.calls.map((call) => call.args), 'vertical wall rendering is not identical to vertical fence rendering');

  context.calls.length = 0;
  renderer.drawWoodWall(0, 0, cornerShape);
  const cornerMainCalls = context.calls.filter((call) => call.fn === 'fillRect' && call.fillStyle === '#7a4a2c');
  assert.ok(cornerMainCalls.length <= 3, 'wood wall corner renders as one final clipped plan instead of stacked standard pieces');
  assert.equal(
    context.calls.some((call) => call.fn === 'fillRect' && (call.args[2] <= 0 || call.args[3] <= 0)),
    false,
    'wood wall corners only draw positive fixed segments'
  );
  assert.equal(context.calls.some((call) =>
    call.fn === 'fillRect' &&
    call.fillStyle === '#3a2418' &&
    call.args[0] === 10 &&
    call.args[1] === 2 &&
    call.args[2] === 12 &&
    call.args[3] === 28
  ), false, 'wood wall corners do not draw a doubled lower center-post artifact');
  assert.equal(context.calls.some((call) =>
    call.fn === 'fillRect' &&
    call.fillStyle === '#7a4a2c' &&
    call.args[0] === 11 &&
    call.args[1] === 3 &&
    call.args[2] === 10 &&
    call.args[3] === 29
  ), false, 'wood wall corners do not draw a full-height vertical overlay segment');
  context.calls.length = 0;
  renderer.drawDoor(0, 0, false, tShape);
  const doorMainCalls = context.calls.filter((call) => call.fn === 'fillRect' && call.fillStyle === '#6f4328');
  assert.ok(doorMainCalls.length <= 4, 'door tee renders as one final clipped plan instead of stacked standard pieces');
  assert.equal(
    context.calls.some((call) => call.fn === 'fillRect' && (call.args[2] <= 0 || call.args[3] <= 0)),
    false,
    'wall door T-junctions only draw positive fixed segments'
  );
  assert.equal(context.calls.some((call) =>
    call.fn === 'fillRect' &&
    call.fillStyle === '#2e1d14' &&
    call.args[0] === 11 &&
    call.args[1] === 3 &&
    call.args[2] === 11 &&
    call.args[3] === 26
  ), false, 'wall door T-junctions do not draw a doubled lower center-post artifact');

  context.calls.length = 0;
  const barrierMap = new TileMap();
  barrierMap.setObject(0, 0, OBJECT_TYPES.woodWall);
  barrierMap.setObject(1, 0, OBJECT_TYPES.woodWall);
  const behindForegroundContext = createDrawContext();
  const behindForegroundRenderer = new RenderSystem(behindForegroundContext);
  behindForegroundRenderer.renderForegroundBarriers(barrierMap, { x: 0, y: 0 }, [{ x: TILE_SIZE / 2, y: TILE_SIZE / 2 - 10 }]);
  const secondBehindForegroundContext = createDrawContext();
  const secondBehindForegroundRenderer = new RenderSystem(secondBehindForegroundContext);
  secondBehindForegroundRenderer.renderForegroundBarriers(barrierMap, { x: 0, y: 0 }, [{ x: TILE_SIZE / 2, y: TILE_SIZE / 2 - 10 }]);
  assert.deepEqual(
    behindForegroundContext.calls.filter((call) => call.fn === 'fillRect').map((call) => ({ args: call.args, fillStyle: call.fillStyle })),
    secondBehindForegroundContext.calls.filter((call) => call.fn === 'fillRect').map((call) => ({ args: call.args, fillStyle: call.fillStyle })),
    'barrier foreground redraw is deterministic when it is needed for occlusion'
  );
  renderer.renderForegroundBarriers(barrierMap, { x: 0, y: 0 }, [{ x: TILE_SIZE / 2, y: TILE_SIZE / 2 + 10 }]);
  assert.equal(context.calls.some((call) => call.fn === 'fillRect' && call.args[1] < 0), false, 'player in front of a horizontal wall is not covered by the foreground strip');
  context.calls.length = 0;
  renderer.renderForegroundBarriers(barrierMap, { x: 0, y: 0 }, [{ x: TILE_SIZE / 2, y: TILE_SIZE / 2 - 10 }]);
  assert.equal(context.calls.some((call) => call.fn === 'fillRect' && call.args[1] < 0), true, 'player behind a horizontal wall is covered by the foreground strip');
  assert.equal(renderer.shouldRenderBarrierForeground({ x: 0, y: 0 }, horizontalShape, [{ x: TILE_SIZE / 2, y: TILE_SIZE / 2 + 8 }]), false, 'foreground barrier test treats lower Y as in front');
  assert.equal(renderer.shouldRenderBarrierForeground({ x: 0, y: 0 }, horizontalShape, [{ x: TILE_SIZE / 2, y: TILE_SIZE / 2 - 8 }]), true, 'foreground barrier test treats upper Y as behind');
  assert.equal(
    renderer.shouldRenderBarrierForeground(
      { x: 0, y: 0 },
      horizontalShape,
      [
        { x: TILE_SIZE / 2, y: TILE_SIZE / 2 + 8 },
        { x: TILE_SIZE / 2, y: TILE_SIZE / 2 - 8 }
      ]
    ),
    false,
    'a player in front of a wall is never covered by another subject behind the same barrier'
  );

  const doorForegroundMap = new TileMap();
  doorForegroundMap.setObject(0, 0, OBJECT_TYPES.door);
  doorForegroundMap.setObject(1, 0, OBJECT_TYPES.woodWall);
  const frontDoorContext = createDrawContext();
  new RenderSystem(frontDoorContext).renderForegroundBarriers(
    doorForegroundMap,
    { x: 0, y: 0 },
    [
      { x: TILE_SIZE / 2, y: TILE_SIZE / 2 + 8 },
      { x: TILE_SIZE / 2, y: TILE_SIZE / 2 - 8 }
    ]
  );
  assert.equal(frontDoorContext.calls.some((call) => call.fn === 'fillRect'), false, 'player in front of a door prevents foreground occlusion from covering them');

  const fenceOverlayMap = new TileMap();
  fenceOverlayMap.setObject(0, 0, OBJECT_TYPES.fence);
  fenceOverlayMap.setObject(1, 0, OBJECT_TYPES.fence);
  fenceOverlayMap.setObject(2, 0, OBJECT_TYPES.gate);
  fenceOverlayMap.setObject(3, 0, OBJECT_TYPES.fence);
  const fenceOverlayContext = createDrawContext();
  const fenceOverlayRenderer = new RenderSystem(fenceOverlayContext);
  fenceOverlayRenderer.renderForegroundBarriers(fenceOverlayMap, { x: 0, y: 0 }, [{ x: TILE_SIZE / 2, y: TILE_SIZE / 2 - 8 }]);
  assert.equal(fenceOverlayContext.calls.some((call) => call.fn === 'fillRect'), false, 'fence and gate do not draw a transient foreground strip while the player moves behind them');

  const { Game } = await import('../src/core/game.js');
  const previewGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  previewGame.tileMap.setObject(1, 1, OBJECT_TYPES.woodWall);
  previewGame.tileMap.setObject(2, 1, OBJECT_TYPES.woodWall);
  const beforePreviewVariant = previewGame.tileMap.getConnectableVariant(1, 1);
  renderer.renderPlacementPreview({ x: 2, y: 2, canPlace: true }, { x: 0, y: 0 });
  assert.equal(previewGame.tileMap.getConnectableVariant(1, 1), beforePreviewVariant, 'placement preview does not mutate connectable barrier variants');
}

{
  const randomValues = [0, 1, 0, 0, 1, 1];
  const dropSystem = new DropSystem(() => randomValues.shift() ?? 0.5);
  const dropMap = new TileMap();
  const first = dropSystem.spawnAtTile({ resource: 'earth', amount: 1 }, { x: 1, y: 1 });
  const second = dropSystem.spawnAtTile({ resource: 'rawWood', amount: 1 }, { x: 1, y: 1 });
  assert.equal(dropMap.getTileAtWorldPosition(first.x, first.y).x, 1, 'drop offset remains inside target tile x');
  assert.equal(dropMap.getTileAtWorldPosition(first.x, first.y).y, 1, 'drop offset remains inside target tile y');
  assert.notDeepEqual({ x: first.x, y: first.y }, { x: second.x, y: second.y }, 'multiple drops on the same tile are visually offset');
  const save = dropSystem.toJSON();
  const loadedDropSystem = new DropSystem(() => 0.5);
  loadedDropSystem.load(save, dropMap);
  assert.equal(loadedDropSystem.drops[0].x, save[0].x, 'drop save/load preserves x offset');
  assert.equal(loadedDropSystem.drops[0].y, save[0].y, 'drop save/load preserves y offset');

  const inventory = new ResourceInventory();
  const player = new Player(first.x - PLAYER_SIZE / 2, first.y - PLAYER_SIZE + PLAYER_FOOT_OFFSET);
  const collections = dropSystem.update(0.1, player, inventory, dropMap);
  assert.equal(collections.length >= 1, true, 'drop pickup still works with offset positions');
}

{
  const terrain = new TerrainRenderer();
  const terrainMap = new TileMap();
  terrainMap.setGrass(0, 0);
  terrainMap.setGrass(1, 0);
  terrainMap.setGrass(-1, 0);
  terrainMap.setGrass(0, 1);
  terrainMap.setGrass(0, -1);
  const profile = terrain.getRenderProfile({ x: 0, y: 0, type: 'grass' }, terrainMap);
  assert.equal(profile.interior, true, 'ground rendering detects same-type interior surfaces');
  assert.equal(profile.outerEdge, false, 'interior ground surface does not render as outer edge');
  assert.equal(profile.connectedSurfaceHorizontal, true, 'ground rendering connects same-type tiles horizontally');
  assert.equal(profile.connectedSurfaceVertical, true, 'ground rendering connects same-type tiles vertically');
  assert.equal(profile.seamlessHorizontal, true, 'same-type horizontal surfaces overlap to close internal seams');
  assert.equal(profile.seamlessVertical, true, 'same-type vertical surfaces overlap to close internal seams');
  assert.equal(profile.internalSeamsSuppressed, true, 'same-type interior surfaces suppress internal seam rendering');
  const interiorContext = createDrawContext();
  terrain.drawTile(interiorContext, { x: 0, y: 0, type: 'grass' }, terrainMap, 0, 0);
  assert.equal(
    interiorContext.calls.some((call) =>
      call.fn === 'fillRect' &&
      call.fillStyle === '#385a2e' &&
      call.args[1] >= 23
    ),
    false,
    'same-type interior surfaces do not draw a separate internal bottom edge'
  );
  assert.equal(
    interiorContext.calls.some((call) =>
      call.fn === 'fillRect' &&
      call.fillStyle === 'rgba(255, 238, 190, 0.12)'
    ),
    false,
    'same-type interior surfaces do not draw a bright internal top seam'
  );
  assert.equal(terrain.detailVariant({ x: 2, y: -3, type: 'stone' }), terrain.detailVariant({ x: 2, y: -3, type: 'stone' }), 'tile detail variants are deterministic by position and type');
  assert.deepEqual(
    terrain.getRenderProfile({ x: 0, y: 0, type: 'grass' }, terrainMap),
    terrain.getRenderProfile({ x: 0, y: 0, type: 'grass' }, terrainMap),
    'tile render profiles are deterministic across repeated calls'
  );
  terrainMap.setEarth(1, 0);
  terrainMap.setEarth(0, 1);
  const edgeProfile = terrain.getRenderProfile({ x: 0, y: 0, type: 'grass' }, terrainMap);
  assert.equal(edgeProfile.transitionEdge, true, 'ground rendering detects different-type transition edges');
  assert.equal(edgeProfile.horizontalTransitionSealed, true, 'horizontal different-type tile transitions are sealed without bright gaps');
  assert.equal(edgeProfile.horizontalTransitionFill, '#4f8f3f', 'horizontal different-type transitions use the tile material color instead of a bright gap');
  assert.notEqual(edgeProfile.transitionBlendFill, '#4f8f3f', 'different-type transitions blend neighboring material colors instead of drawing a hard edge');
  assert.equal(terrainMap.isPositionSupportedByTile(TILE_SIZE / 2, TILE_SIZE / 2), true, 'tile support logic stays independent from render profile');

  const transitionContext = createDrawContext();
  terrain.drawTile(transitionContext, { x: 0, y: 0, type: 'grass' }, terrainMap, 0, 0);
  const verticalTransitionFill = terrain.getTransitionBlendFill({ x: 0, y: 0, type: 'grass' }, terrainMap, 'down');
  assert.equal(
    transitionContext.calls.some((call) =>
      call.fn === 'fillRect' &&
      call.fillStyle === edgeProfile.transitionBlendFill &&
      call.args[0] === TILE_SIZE - 3 &&
      call.args[2] === 4
    ),
    true,
    'different horizontal tile transitions draw blended seam fill instead of leaving a hard gap'
  );
  assert.equal(
    transitionContext.calls.some((call) =>
      call.fn === 'fillRect' &&
      call.fillStyle === verticalTransitionFill &&
      call.args[1] === TILE_SIZE - 11 &&
      call.args[3] === 4
    ),
    true,
    'different vertical tile transitions draw blended seam fill instead of leaving a hard row gap'
  );
  assert.equal(transitionContext.calls.some((call) => call.fn === 'fillRect' && call.fillStyle === 'rgba(255, 236, 188, 0.08)'), false, 'horizontal different-type transitions do not draw bright internal seams');
  assert.equal(transitionContext.calls.some((call) => call.fn === 'fillRect' && call.fillStyle === 'rgba(35, 23, 16, 0.12)'), false, 'same-surface horizontal rows avoid dark internal transition lines');
  assert.equal(transitionContext.calls.some((call) => call.fn === 'fillRect' && call.fillStyle === 'rgba(35, 23, 16, 0.1)'), false, 'different-type horizontal edges are sealed without dark divider lines');
  assert.equal(transitionContext.calls.some((call) => call.fn === 'fillRect' && call.fillStyle === 'rgba(35, 23, 16, 0.16)'), false, 'horizontal different-type transitions do not draw dark internal grid lines');

  const waterMap = new TileMap();
  waterMap.tiles.clear();
  waterMap.setWater(0, 0);
  waterMap.setClay(1, 0);
  waterMap.setGrass(0, 1);
  const waterProfile = terrain.getRenderProfile({ x: 0, y: 0, type: 'water' }, waterMap);
  assert.equal(waterProfile.waterTransition, true, 'water tiles expose transition rendering when adjacent to other ground');
  const waterContext = createDrawContext();
  terrain.drawTile(waterContext, { x: 0, y: 0, type: 'water' }, waterMap, 0, 0);
  assert.equal(waterContext.calls.some((call) => call.fn === 'fillRect' && call.fillStyle === waterProfile.transitionBlendFill), true, 'water transition uses blended material color instead of a bright inserted edge');

  const lowerEdgeMap = new TileMap();
  lowerEdgeMap.tiles.clear();
  lowerEdgeMap.setStone(0, 0);
  lowerEdgeMap.setStone(1, 0);
  lowerEdgeMap.setStone(2, 0);
  const lowerEdgeProfile = terrain.getRenderProfile({ x: 1, y: 0, type: 'stone' }, lowerEdgeMap);
  assert.equal(lowerEdgeProfile.connectedBottomEdge, true, 'neighboring bottom island edges are treated as a connected edge');
  const shadowContext = createDrawContext();
  const { RenderSystem } = await import('../src/systems/render-system.js');
  const shadowRenderer = new RenderSystem(shadowContext);
  assert.deepEqual(shadowRenderer.getIslandShadowRuns(lowerEdgeMap), [{ y: 0, start: 0, end: 2 }], 'shadow logic groups adjacent bottom-edge tiles into one run');

  const saveLikeMap = new TileMap();
  saveLikeMap.loadTiles([
    { x: 0, y: 0, type: 'water' },
    { x: 1, y: 0, type: 'clay' },
    { x: 0, y: 1, type: 'water' }
  ]);
  const loadedWaterProfile = terrain.getRenderProfile({ x: 0, y: 0, type: 'water' }, saveLikeMap);
  assert.equal(loadedWaterProfile.connectedSurfaceVertical, true, 'loaded tile maps reconstruct vertical ground render connections from neighbors');
  assert.equal(loadedWaterProfile.waterTransition, true, 'loaded tile maps reconstruct water transition render state from neighbors');
}

{
  const player = createSpawnedPlayer();
  assert.equal(player.maxHp, PLAYER_MAX_HP, 'player starts with 6 max HP');
  assert.equal(player.hp, PLAYER_MAX_HP, 'player starts with full HP');
  assert.deepEqual(player.getHeartStates(), ['full', 'full', 'full'], '6 HP renders as 3 full hearts');
  player.setHp(5);
  assert.deepEqual(player.getHeartStates(), ['full', 'full', 'half'], 'odd HP renders a half heart');
  player.setHp(1);
  assert.deepEqual(player.getHeartStates(), ['half', 'empty', 'empty'], 'missing HP renders empty hearts');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.player.setHp(3);
  game.inventory.add('rawMeat', 2);
  game.saveGame();

  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.player.hp, 3, 'player HP saves and loads');
  assert.equal(loadedGame.inventory.get('rawMeat'), 2, 'raw meat saves and loads');

  loadedGame.input.keys.add('r');
  loadedGame.update(2.1);
  assert.equal(loadedGame.player.hp, PLAYER_MAX_HP, 'reset restores player HP');
  assert.equal(loadedGame.inventory.get('rawMeat'), 0, 'reset clears raw meat through inventory reset');
}

{
  const { Game } = await import('../src/core/game.js');
  const { FlyingEnemy } = await import('../src/entities/flying-enemy.js');

  const groundGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  groundGame.enemySystem.enemies.push(Enemy.fromTile(PLAYER_SPAWN_TILE));
  assert.equal(groundGame.handlePlayerContactDamage(), true, 'ground enemy contact deals damage');
  assert.equal(groundGame.player.hp, PLAYER_MAX_HP - 1, 'ground enemy deals 1 HP');
  assert.equal(groundGame.handlePlayerContactDamage(), false, 'damage cooldown blocks repeated same-frame contact damage');
  assert.equal(groundGame.player.hp, PLAYER_MAX_HP - 1, 'damage cooldown preserves HP');
  assert.equal(groundGame.player.hitFlashSeconds > 0, true, 'damage starts player hit flash feedback');

  const flyingGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  const playerCenter = flyingGame.player.getCenterPosition();
  flyingGame.flyingEnemySystem.enemies.push(new FlyingEnemy({
    x: playerCenter.x - 14,
    y: playerCenter.y - 14
  }));
  assert.equal(flyingGame.handlePlayerContactDamage(), true, 'flying enemy contact deals damage');
  assert.equal(flyingGame.player.hp, PLAYER_MAX_HP - 1, 'flying enemy deals 1 HP');

  const pausedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  pausedGame.enemySystem.enemies.push(Enemy.fromTile(PLAYER_SPAWN_TILE));
  pausedGame.inventoryOpen = true;
  pausedGame.update(0.5);
  assert.equal(pausedGame.player.hp, PLAYER_MAX_HP, 'enemy contact damage is ignored while a menu pauses gameplay');
}

{
  const { Game } = await import('../src/core/game.js');
  const deathGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  deathGame.player.setHp(1);
  deathGame.enemySystem.enemies.push(Enemy.fromTile(PLAYER_SPAWN_TILE));
  assert.equal(deathGame.handlePlayerContactDamage(), true, 'lethal contact damage is handled');
  assert.equal(deathGame.player.hp, PLAYER_MAX_HP, 'death respawn restores full HP');
  assert.deepEqual(deathGame.player.getTilePosition(), PLAYER_SPAWN_TILE, 'death without bed respawns near the crystal');
  assert.equal(deathGame.crystalSystem.lastMessage, 'Du bist gestorben.', 'enemy death writes the requested death log');

  const bedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  bedGame.tileMap.setEarth(2, 1);
  bedGame.tileMap.setEarth(3, 1);
  bedGame.tileMap.setObject(2, 1, OBJECT_TYPES.bed);
  setGamePlayerOnTile(bedGame, 1, 1, { x: 1, y: 0 });
  assert.equal(bedGame.tryUseBed(), true, 'bed action sets a respawn point first');
  assert.deepEqual(bedGame.respawnTarget, { type: 'bed', x: 2, y: 1 }, 'active bed respawn target is stored');
  bedGame.player.setHp(0);
  bedGame.handlePlayerDeath();
  assert.equal(bedGame.player.hp, PLAYER_MAX_HP, 'bed death respawn restores full HP');
  assert.deepEqual(bedGame.player.getTilePosition(), { x: 3, y: 1 }, 'death respawns beside an active valid bed');

  bedGame.player.setPosition(20 * TILE_SIZE, 20 * TILE_SIZE);
  bedGame.handleVoidFall();
  assert.equal(bedGame.player.hp, PLAYER_MAX_HP, 'void respawn uses the same HP restoration path');
  assert.deepEqual(bedGame.player.getTilePosition(), { x: 3, y: 1 }, 'void respawn uses the active bed when valid');

  bedGame.removeMode = true;
  setGamePlayerOnTile(bedGame, 1, 1, { x: 1, y: 0 });
  assert.equal(bedGame.tryContextAction(), true, 'active bed can be removed through remove mode');
  assert.deepEqual(bedGame.respawnTarget, { type: 'crystal' }, 'removing the active bed resets respawn to crystal');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.inventory.add('rawWood', 6);
  game.inventory.add('fiber', 6);
  assert.equal(game.craftingSystem.craft('bed', { hasWorkbenchAccess: true }).crafted, true, 'bed can be crafted at a workbench');
  assert.equal(game.inventory.get('bed'), 1, 'bed crafting adds bed item');

  game.selectHotbarResource('bed');
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });
  assert.equal(game.tryPlaceSelectedItem(), true, 'bed can be placed on valid solid ground');
  assert.equal(game.tileMap.getObject(1, 1), OBJECT_TYPES.bed, 'placed bed becomes a world object');
  assert.equal(game.tileMap.isBlockedForPlayer(1, 1), true, 'bed blocks player movement');
  game.inventory.add('bed', 1);
  game.tileMap.setWater(2, 1);
  setGamePlayerOnTile(game, 1, 1, { x: 1, y: 0 });
  assert.equal(game.getPlacementPreview().canPlace, false, 'bed cannot be placed on water');

  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.tileMap.getObject(1, 1), OBJECT_TYPES.bed, 'placed bed saves and loads');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.tileMap.setEarth(2, 1);
  game.tileMap.setEarth(3, 1);
  game.tileMap.setObject(2, 1, OBJECT_TYPES.bed);
  setGamePlayerOnTile(game, 1, 1, { x: 1, y: 0 });
  game.tryUseBed();

  game.dayNightSystem.load(0.1);
  assert.equal(game.tryUseBed(), true, 'active bed can skip day toward night');
  assert.equal(game.dayNightSystem.time, DAY_NIGHT_PHASES.night.start, 'sleeping before night jumps to night start');
  assert.equal(game.crystalSystem.lastMessage, 'Du schläfst bis zur Nacht.', 'day sleep log is clear');

  game.dayNightSystem.load(0.7);
  assert.equal(game.tryUseBed(), true, 'active bed can skip night toward morning');
  assert.equal(game.dayNightSystem.time, DAY_NIGHT_PHASES.day.start, 'sleeping during night jumps to day start');
  assert.equal(game.crystalSystem.lastMessage, 'Du schläfst bis zum Morgen.', 'night sleep log is clear');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.player.setHp(4);
  game.inventory.add('berry', 2);
  game.selectHotbarResource('berry');
  assert.equal(game.tryContextAction(), true, 'selected berries can be eaten through context action');
  assert.equal(game.player.hp, 5, 'berries heal 1 HP');
  assert.equal(game.inventory.get('berry'), 1, 'eating berries consumes one berry');
  game.player.restoreHp();
  assert.equal(game.tryContextAction(), true, 'food action at full health is handled');
  assert.equal(game.inventory.get('berry'), 1, 'berries are not consumed at full HP');
  assert.equal(game.crystalSystem.lastMessage, 'Du bist bereits gesund.', 'full health food action explains why nothing was consumed');

  game.player.setHp(3);
  game.inventory.add('roastedBerries', 1);
  game.selectHotbarResource('roastedBerries');
  game.tryContextAction();
  assert.equal(game.player.hp, 5, 'roasted berries heal 2 HP');

  game.player.setHp(2);
  game.inventory.add('cookedSteak', 1);
  game.selectHotbarResource('cookedSteak');
  game.tryContextAction();
  assert.equal(game.player.hp, 5, 'cooked steak heals 3 HP');

  game.inventory.add('rawMeat', 1);
  game.selectHotbarResource('rawMeat');
  assert.equal(game.tryContextAction(), true, 'raw meat is not treated as edible and falls through to crystal interaction nearby');
  assert.equal(game.inventory.get('rawMeat'), 1, 'raw meat is not consumed by the food system');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.inventory.add('bow', 1);
  game.inventory.add('arrow', 2);
  game.selectHotbarResource('bow');
  for (let x = 2; x <= 5; x += 1) game.tileMap.setEarth(x, 0);
  const enemy = Enemy.fromTile({ x: 5, y: 0 });
  enemy.hp = 2;
  game.enemySystem.enemies.push(enemy);
  setGamePlayerOnTile(game, 2, 0, { x: 1, y: 0 });
  game.tryAttackAction();
  game.update(0.35);
  assert.equal(game.enemySystem.activeCount(), 0, 'defeated ground enemy is removed');
  assert.equal(game.dropSystem.drops.some((drop) => drop.resource === 'rawMeat'), true, 'defeated ground enemies drop raw meat');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.tileMap.setObject(1, 1, OBJECT_TYPES.campfire);
  assert.equal(game.tryContextAction(), true, 'action near campfire opens cooking menu');
  assert.equal(game.cookingOpen, true, 'cooking menu opens at campfire');
  assert.equal(game.isGamePaused(), true, 'cooking menu pauses gameplay');
  assert.equal(game.craftingOpen, false, 'campfire cooking is separate from crafting menu');

  const normalIds = game.craftingSystem.getRecipeStates({ craftingContext: 'normal' }).map((state) => state.recipe.id);
  const workbenchIds = game.craftingSystem.getRecipeStates({ craftingContext: 'workbench', hasWorkbenchAccess: true }).map((state) => state.recipe.id);
  assert.equal(normalIds.includes('roastedBerries'), false, 'cooking recipes do not appear in normal crafting');
  assert.equal(workbenchIds.includes('cookedSteak'), false, 'cooking recipes do not appear in workbench crafting');

  game.inventory.add('berry', 2);
  assert.equal(game.tryCook('roastedBerries'), true, 'roasted berries can be cooked at campfire');
  assert.equal(game.inventory.get('berry'), 0, 'roasted berries consume berries');
  assert.equal(game.inventory.get('roastedBerries'), 1, 'roasted berries add cooked food');

  game.inventory.add('rawMeat', 1);
  assert.equal(game.tryCook('cookedSteak'), true, 'cooked steak can be cooked at campfire');
  assert.equal(game.inventory.get('rawMeat'), 0, 'cooked steak consumes raw meat');
  assert.equal(game.inventory.get('cookedSteak'), 1, 'cooked steak adds cooked food');
  game.saveGame();

  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.inventory.get('roastedBerries'), 1, 'roasted berries save and load');
  assert.equal(loadedGame.inventory.get('cookedSteak'), 1, 'cooked steak save and load');
}

{
  const inventoryPanel = { hidden: true, innerHTML: '' };
  const craftingPanel = { hidden: true, innerHTML: '' };
  const buildPanel = { hidden: true, innerHTML: '' };
  const cookingPanel = { hidden: true, innerHTML: '' };
  const furnacePanel = { hidden: true, innerHTML: '' };
  const inventory = new ResourceInventory();
  const crafting = new CraftingSystem(inventory);
  const menus = new MenuPanels({ inventoryPanel, craftingPanel, buildPanel, cookingPanel, furnacePanel });

  menus.update({
    inventory,
    inventoryOpen: true,
    craftingOpen: true,
    buildOpen: true,
    cookingOpen: true,
    furnaceOpen: true,
    recipeStates: crafting.getRecipeStates({ craftingContext: 'normal' }),
    cookingRecipeStates: crafting.getRecipeStates({ craftingContext: 'cooking' }),
    furnaceRecipeStates: crafting.getRecipeStates({ craftingContext: 'furnace' }),
    hotbarSlots: [...DEFAULT_HOTBAR_SLOTS]
  });

  assert.equal(inventoryPanel.innerHTML.includes('data-menu-close="inventory"'), true, 'inventory menu has an X close button');
  assert.equal(craftingPanel.innerHTML.includes('data-menu-close="crafting"'), true, 'crafting menu has an X close button');
  assert.equal(buildPanel.innerHTML.includes('data-menu-close="build"'), true, 'build menu has an X close button');
  assert.equal(cookingPanel.innerHTML.includes('data-menu-close="cooking"'), true, 'cooking menu has an X close button');
  assert.equal(furnacePanel.innerHTML.includes('data-menu-close="furnace"'), true, 'furnace menu has an X close button');

  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.inventoryOpen = true;
  game.craftingOpen = true;
  game.buildOpen = true;
  game.cookingOpen = true;
  game.furnaceOpen = true;
  game.closeMenu('inventory');
  game.closeMenu('crafting');
  game.closeMenu('build');
  game.closeMenu('cooking');
  game.closeMenu('furnace');
  assert.equal(game.isGamePaused(), false, 'closing all menus through X handlers resumes gameplay');
}

{
  const { DayNightSystem } = await import('../src/systems/day-night-system.js');
  const dayNight = new DayNightSystem();
  assert.equal(DAY_NIGHT_CYCLE_SECONDS, 600, 'day/night cycle lasts 10 minutes');
  assert.equal(DAY_NIGHT_PHASES.day.durationSeconds, 270, 'day phase lasts 4.5 minutes');
  assert.equal(DAY_NIGHT_PHASES.dusk.durationSeconds, 30, 'dusk phase lasts 0.5 minutes');
  assert.equal(DAY_NIGHT_PHASES.night.durationSeconds, 270, 'night phase lasts 4.5 minutes');
  assert.equal(DAY_NIGHT_PHASES.dawn.durationSeconds, 30, 'dawn phase lasts 0.5 minutes');
  dayNight.update(271);
  assert.equal(dayNight.getPhaseId(), 'dusk', 'cycle enters dusk after day duration');
  dayNight.update(30);
  assert.equal(dayNight.getPhaseId(), 'night', 'cycle enters night after dusk duration');
  dayNight.update(270);
  assert.equal(dayNight.getPhaseId(), 'dawn', 'cycle enters dawn after night duration');

  const { Game } = await import('../src/core/game.js');
  const storage = createMemoryStorage();
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.dayNightSystem.load(0.73);
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.dayNightSystem.time, 0.73, 'save/load keeps day/night time');
  assert.equal(loadedGame.dayNightSystem.getPhaseId(), 'night', 'save/load keeps day/night phase');
}

{
  const { DayNightSystem } = await import('../src/systems/day-night-system.js');
  const { BackgroundSystem } = await import('../src/systems/background-system.js');
  const night = new DayNightSystem(0.7);
  const dusk = new DayNightSystem(0.47);
  const dawn = new DayNightSystem(0.97);
  assert.equal(night.getSkyProfile().starAlpha > 0, true, 'stars appear at night');
  assert.equal(night.getSkyProfile().top.startsWith('#05'), true, 'night sky becomes very dark');
  assert.equal(dusk.getSkyProfile().warmOverlay > 0, true, 'dusk uses a warm transition overlay');
  assert.equal(dawn.getSkyProfile().warmOverlay > 0, true, 'dawn uses a warm transition overlay');

  const context = createDrawContext();
  const background = new BackgroundSystem();
  background.render(context, { x: 0, y: 0 }, night);
  assert.equal(context.calls.some((call) => call.fn === 'fillRect' && call.globalAlpha > 0.5), true, 'night background renders star pixels over the dark sky');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.tileMap.setObject(1, 1, OBJECT_TYPES.campfire);
  game.inventory.add('berry', 1);
  game.player.setHp(4);
  game.selectHotbarResource('berry');
  assert.equal(game.tryContextAction(), true, 'action priority uses active food before campfire cooking');
  assert.equal(game.cookingOpen, false, 'food action does not open cooking menu first');
  assert.equal(game.player.hp, 5, 'food priority heals the player');
}

{
  const inventory = new ResourceInventory();
  const crafting = new CraftingSystem(inventory);
  const normalIds = crafting.getRecipeStates({ craftingContext: 'normal' }).map((state) => state.recipe.id);
  const cookingIds = crafting.getRecipeStates({ craftingContext: 'cooking' }).map((state) => state.recipe.id);
  const furnaceIds = crafting.getRecipeStates({ craftingContext: 'furnace' }).map((state) => state.recipe.id);
  const workbenchIds = crafting.getRecipeStates({ craftingContext: 'workbench', hasWorkbenchAccess: true }).map((state) => state.recipe.id);

  assert.equal(normalIds.includes('unfiredBowl'), true, 'unfired bowl is a normal crafting recipe');
  assert.equal(normalIds.includes('unfiredJug'), true, 'unfired jug is a normal crafting recipe');
  assert.equal(cookingIds.includes('friedEgg'), true, 'fried egg appears in cooking recipes');
  assert.equal(furnaceIds.includes('clayBrick'), true, 'clay brick appears in furnace recipes');
  assert.equal(furnaceIds.includes('bowl'), true, 'bowl appears in furnace recipes');
  assert.equal(furnaceIds.includes('jug'), true, 'jug appears in furnace recipes');
  assert.equal(normalIds.includes('clayBrick'), false, 'furnace recipes do not leak into normal crafting');
  assert.equal(workbenchIds.includes('friedEgg'), false, 'cooking recipes do not leak into workbench crafting');

  inventory.add('rawWood', 20);
  inventory.add('fiber', 20);
  inventory.add('clay', 20);
  inventory.add('stone', 20);
  assert.equal(crafting.craft('chickenNest', { craftingContext: 'workbench', hasWorkbenchAccess: true }).crafted, true, 'chicken nest can be crafted at workbench');
  assert.equal(crafting.craft('feedTrough', { craftingContext: 'workbench', hasWorkbenchAccess: true }).crafted, true, 'feed trough can be crafted at workbench');
  assert.equal(crafting.craft('waterTrough', { craftingContext: 'workbench', hasWorkbenchAccess: true }).crafted, true, 'water trough can be crafted at workbench');
  assert.equal(crafting.craft('furnace', { craftingContext: 'workbench', hasWorkbenchAccess: true }).crafted, true, 'furnace can be crafted at workbench');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.inventory.add('chickenNest', 1);
  game.inventory.add('feedTrough', 1);
  game.inventory.add('waterTrough', 1);
  game.inventory.add('furnace', 1);

  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });
  game.selectHotbarResource('chickenNest');
  assert.equal(game.tryPlaceSelectedItem(), true, 'chicken nest can be placed');
  setGamePlayerOnTile(game, 0, 1, { x: -1, y: 0 });
  game.selectHotbarResource('feedTrough');
  assert.equal(game.tryPlaceSelectedItem(), true, 'feed trough can be placed');
  setGamePlayerOnTile(game, -1, 0, { x: 0, y: -1 });
  game.selectHotbarResource('waterTrough');
  assert.equal(game.tryPlaceSelectedItem(), true, 'water trough can be placed');
  setGamePlayerOnTile(game, 0, 1, { x: 0, y: 1 });
  game.tileMap.setEarth(0, 2);
  game.selectHotbarResource('furnace');
  assert.equal(game.tryPlaceSelectedItem(), true, 'furnace can be placed');
  game.saveGame();

  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.tileMap.getObject(1, 1), OBJECT_TYPES.chickenNest, 'chicken nest saves and loads');
  assert.equal(loadedGame.tileMap.getObject(-1, 1), OBJECT_TYPES.feedTrough, 'feed trough saves and loads');
  assert.equal(loadedGame.tileMap.getObject(-1, -1), OBJECT_TYPES.waterTrough, 'water trough saves and loads');
  assert.equal(loadedGame.tileMap.getObject(0, 2), OBJECT_TYPES.furnace, 'furnace saves and loads');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  game.tileMap.setObject(1, 1, OBJECT_TYPES.chickenNest);
  game.tileMap.setObject(0, 1, OBJECT_TYPES.feedTrough);
  game.tileMap.setObjectState(0, 1, { feed: 2 });
  game.animalSystem.animals.push(Animal.fromTile({ x: 1, y: 0 }));
  game.updateHusbandry(EGG_PRODUCTION_SECONDS + 0.1);
  assert.equal(game.dropSystem.drops.some((drop) => drop.resource === 'egg'), true, 'chicken near supplied nest produces an egg drop');
  assert.equal(game.tileMap.objectsToJSON().find((object) => object.x === 0 && object.y === 1).feed, 1, 'egg production consumes feed');
  const eggStorage = createMemoryStorage();
  game.saveSystem = new SaveSystem(eggStorage);
  game.saveGame();
  const { Game: EggLoadGame } = await import('../src/core/game.js');
  const eggLoadedGame = new EggLoadGame({ getContext: () => ({}) }, { innerHTML: '' }, { storage: eggStorage });
  assert.equal(eggLoadedGame.dropSystem.drops.some((drop) => drop.resource === 'egg'), true, 'egg drop saves and loads');

  const pausedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  pausedGame.tileMap.setObject(1, 1, OBJECT_TYPES.chickenNest);
  pausedGame.tileMap.setObject(0, 1, OBJECT_TYPES.feedTrough);
  pausedGame.tileMap.setObjectState(0, 1, { feed: 2 });
  pausedGame.animalSystem.animals.push(Animal.fromTile({ x: 1, y: 0 }));
  pausedGame.inventoryOpen = true;
  pausedGame.update(EGG_PRODUCTION_SECONDS + 0.1);
  assert.equal(pausedGame.dropSystem.drops.some((drop) => drop.resource === 'egg'), false, 'menu pause stops egg production timer');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.inventory.add('berry', 1);
  game.tileMap.setObject(1, 1, OBJECT_TYPES.feedTrough);
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });
  assert.equal(game.tryContextAction(), true, 'action near feed trough fills it');
  assert.equal(game.tileMap.objectsToJSON().find((object) => object.x === 1 && object.y === 1).feed, 2, 'feed trough stores fill level');
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.tileMap.objectsToJSON().find((object) => object.x === 1 && object.y === 1).feed, 2, 'feed level saves and loads');

  const waterGame = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  waterGame.tileMap.setWater(1, 0);
  waterGame.tileMap.setObject(1, 1, OBJECT_TYPES.waterTrough);
  setGamePlayerOnTile(waterGame, 0, 1, { x: 1, y: 0 });
  assert.equal(waterGame.tryContextAction(), true, 'action near water trough fills it near water');
  assert.equal(waterGame.tileMap.objectsToJSON().find((object) => object.x === 1 && object.y === 1).filled, true, 'water trough stores filled state');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.inventory.add('egg', 2);
  game.player.setHp(4);
  game.selectHotbarResource('egg');
  assert.equal(game.tryContextAction(), true, 'raw egg can be eaten through context action');
  assert.equal(game.player.hp, 5, 'raw egg heals one HP');
  assert.equal(game.inventory.get('egg'), 1, 'raw egg is consumed when healing');
  game.player.restoreHp();
  assert.equal(game.tryContextAction(), true, 'raw egg action is handled at full HP');
  assert.equal(game.inventory.get('egg'), 1, 'raw egg is not consumed at full HP');
  assert.equal(game.tryCook('friedEgg'), true, 'fried egg can be cooked from an egg');
  game.player.setHp(3);
  game.selectHotbarResource('friedEgg');
  assert.equal(game.tryContextAction(), true, 'fried egg can be eaten');
  assert.equal(game.player.hp, 5, 'fried egg heals two HP');
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.inventory.get('friedEgg'), 0, 'eaten fried egg save/load state is kept');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.tileMap.setObject(1, 1, OBJECT_TYPES.furnace);
  setGamePlayerOnTile(game, 0, 1, { x: 1, y: 0 });
  assert.equal(game.tryContextAction(), true, 'action near furnace opens furnace menu');
  assert.equal(game.furnaceOpen, true, 'furnace menu opens');
  assert.equal(game.isGamePaused(), true, 'furnace menu pauses gameplay');
  game.closeMenu('furnace');
  assert.equal(game.isGamePaused(), false, 'furnace close resumes gameplay');

  game.inventory.add('clay', 4);
  game.inventory.add('unfiredBowl', 1);
  game.inventory.add('unfiredJug', 1);
  assert.equal(game.tryFurnace('clayBrick'), true, 'clay brick can be fired in furnace');
  assert.equal(game.inventory.get('clayBrick'), 1, 'furnace adds clay brick');
  assert.equal(game.tryFurnace('bowl'), true, 'bowl can be fired in furnace');
  assert.equal(game.inventory.get('bowl'), 1, 'furnace adds bowl');
  assert.equal(game.tryFurnace('jug'), true, 'jug can be fired in furnace');
  assert.equal(game.inventory.get('jug'), 1, 'furnace adds jug');
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.inventory.get('clayBrick'), 1, 'clay brick saves and loads');
  assert.equal(loadedGame.inventory.get('bowl'), 1, 'bowl saves and loads');
  assert.equal(loadedGame.inventory.get('jug'), 1, 'jug saves and loads');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });
  assert.equal(game.crystalLevel, 1, 'crystal starts at level 1');
  game.advanceCrystalProgress(CRYSTAL_LEVEL_THRESHOLDS[0].xp - 1);
  assert.equal(game.crystalLevel, 1, 'crystal stays level 1 before threshold');
  game.advanceCrystalProgress(1);
  assert.equal(game.crystalLevel, 2, 'crystal reaches level 2 at threshold');
  assert.equal(game.getCrystalDropTable().some((drop) => drop.resource === 'clay'), true, 'level 2 crystal drop table includes clay');
  game.advanceCrystalProgress(CRYSTAL_LEVEL_THRESHOLDS[1].xp - CRYSTAL_LEVEL_THRESHOLDS[0].xp);
  assert.equal(game.crystalLevel, 3, 'crystal reaches level 3 at threshold');
  assert.equal(game.getCrystalDropTable().some((drop) => drop.resource === 'springDrop'), true, 'level 3 crystal drop table includes spring drops');
  game.consumeCrystalLevelUpMessage();
  assert.equal(game.logSystem.toJSON().some((entry) => entry.includes('Kristall erreicht Stufe')), true, 'crystal level up logs a message');
}

{
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  game.advanceCrystalProgress(80);
  game.saveGame();
  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });
  assert.equal(loadedGame.crystalLevel, 3, 'crystal level saves and loads');
  assert.equal(loadedGame.crystalXp, 80, 'crystal XP saves and loads');
  loadedGame.resetGame();
  assert.equal(loadedGame.crystalLevel, 1, 'reset restores crystal level 1');
  assert.equal(loadedGame.crystalXp, 0, 'reset clears crystal XP');
}

console.log('Gameplay-Basics OK.');
