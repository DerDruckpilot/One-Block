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
import { TileMap } from '../src/world/tile-map.js';
import { ResourceInventory } from '../src/systems/resource-inventory.js';
import { CrystalSystem } from '../src/systems/crystal-system.js';

const inputWith = (...pressedKeys) => ({
  isDown: (...keys) => keys.some((key) => pressedKeys.includes(key))
});

const createSpawnedPlayer = () => new Player(
  PLAYER_SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2 - PLAYER_SIZE / 2,
  PLAYER_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2 - (PLAYER_SIZE - PLAYER_FOOT_OFFSET)
);

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
  const player = createSpawnedPlayer();

  for (let i = 0; i < 20; i += 1) {
    player.update(0.05, inputWith('w'), map);
  }

  assert.notEqual(player.getTilePosition().y, map.crystal.y, 'player does not walk through the crystal');
}

{
  const player = createSpawnedPlayer();

  for (let i = 0; i < 40; i += 1) {
    player.update(0.05, inputWith('d'), map);
  }

  const foot = player.getFootPosition();
  assert.equal(map.isVoidAtWorld(foot.x, foot.y), true, 'player can leave the island and reach the void');
  assert.equal(
    map.isPastVoidFallMarginWorld(foot.x, foot.y),
    true,
    'player can get far enough into the void to trigger death'
  );
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
