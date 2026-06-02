import assert from 'node:assert/strict';

import {
  CRYSTAL_INTERACTION_DISTANCE,
  GAME_VIEW,
  PLAYER_FOOT_OFFSET,
  PLAYER_SIZE,
  PLAYER_SPAWN_TILE,
  TILE_SIZE
} from '../src/config/constants.js';
import { Camera } from '../src/core/camera.js';
import { Player } from '../src/entities/player.js';
import { SAVE_KEY, SaveSystem } from '../src/systems/save-system.js';
import { TileMap } from '../src/world/tile-map.js';
import { ResourceInventory } from '../src/systems/resource-inventory.js';
import { CrystalSystem } from '../src/systems/crystal-system.js';
import { Hud } from '../src/ui/hud.js';

const inputWith = (...pressedKeys) => ({
  isDown: (...keys) => keys.some((key) => pressedKeys.includes(key))
});

const createSpawnedPlayer = () => new Player(
  PLAYER_SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
  PLAYER_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
);

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

const map = new TileMap();

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
    key: 'F2',
    preventDefault() {
      prevented = true;
    }
  });
  assert.equal(input.wasPressed('F2'), true, 'keydown registers F2 debug key');
  assert.equal(prevented, true, 'F2 default behavior is prevented');

  prevented = false;
  listeners.keydown({
    key: 'F3',
    preventDefault() {
      prevented = true;
    }
  });
  assert.equal(input.wasPressed('F3'), true, 'keydown registers F3 debug key');
  assert.equal(prevented, true, 'F3 default behavior is prevented');

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
  const storage = createMemoryStorage();
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });

  game.inventory.add('earth', 3);
  game.player.setPosition(
    1 * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
    0 * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
  );
  game.player.facing = { x: 1, y: 0 };
  game.tryPlaceEarth();

  const loadedGame = new Game({ getContext: () => ({}) }, { innerHTML: '' }, { storage });

  assert.equal(storage.getItem(SAVE_KEY) !== null, true, 'game writes save data through local storage');
  assert.ok(storage.calls.setItem > 0, 'saving uses localStorage.setItem');
  assert.ok(storage.calls.getItem > 0, 'loading uses localStorage.getItem');
  assert.equal(game.saveStatus, 'saved', 'placing earth marks save status as saved');
  assert.equal(loadedGame.saveStatus, 'loaded', 'valid save marks save status as loaded');
  assert.equal(loadedGame.tileMap.getTile(2, 0), 'earth', 'saved placed earth loads as world tile');
  assert.equal(loadedGame.inventory.get('earth'), 2, 'saved resources load from local storage');
  assert.deepEqual(loadedGame.player.getTilePosition(), { x: 1, y: 0 }, 'saved player position loads from local storage');
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
  game.saveGame();
  game.input.keys.add('r');
  game.update(1);
  assert.equal(game.crystalSystem.lastMessage, 'Reset wird vorbereitet...', 'holding reset key shows a preparation message');
  game.autosaveSeconds = 1;
  game.update(1.1);

  assert.equal(storage.getItem(SAVE_KEY), null, 'reset clears the saved game');
  assert.equal(game.inventory.get('earth'), 0, 'reset restores empty resources');
  assert.deepEqual(game.player.getTilePosition(), PLAYER_SPAWN_TILE, 'reset respawns beside the crystal');
  assert.equal(game.crystalSystem.lastMessage, 'Speicherstand gelöscht. Neustart am Kristall.', 'reset writes a clear log message');
}

{
  const { Game } = await import('../src/core/game.js');
  const game = new Game({ getContext: () => ({}) }, { innerHTML: '' });

  game.input.pressedThisFrame.add('F2');
  game.handleDebugToggle();
  assert.equal(game.debugEnabled, true, 'F2 enables debug HUD');

  game.input.pressedThisFrame.add('F2');
  game.handleDebugToggle();
  assert.equal(game.debugEnabled, false, 'F2 disables debug HUD');

  game.input.pressedThisFrame.add('F3');
  game.handleDebugToggle();
  assert.equal(game.debugEnabled, true, 'F3 enables debug HUD');

  game.input.pressedThisFrame.add('F3');
  game.handleDebugToggle();
  assert.equal(game.debugEnabled, false, 'F3 disables debug HUD');
}

{
  const element = { innerHTML: '' };
  const hud = new Hud(element);
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
  const inventory = new ResourceInventory();
  const crystal = new CrystalSystem(inventory);
  const allowedResources = new Set(['earth', 'rawWood', 'fiber', 'grassSeed']);

  for (let i = 0; i < 20; i += 1) {
    const drop = crystal.use();
    assert.equal(allowedResources.has(drop.resource), true, 'crystal drops only base resources');
  }

  const totalResources = Object.values(inventory.resources).reduce((sum, amount) => sum + amount, 0);
  assert.equal(totalResources, 20, 'crystal interactions add resources to the HUD inventory model');
}

console.log('Gameplay-Basics OK.');
