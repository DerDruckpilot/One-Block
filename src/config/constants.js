export const TILE_SIZE = 32;
export const PLAYER_SIZE = 48;

export const GAME_VIEW = {
  width: 960,
  height: 540
};

export const MOVEMENT = {
  walkSpeed: 112,
  runSpeed: 176
};

export const PLAYER_SPAWN_TILE = {
  x: 0,
  y: 1
};

export const PLAYER_FOOT_OFFSET = 10;
export const CRYSTAL_INTERACTION_DISTANCE = TILE_SIZE * 1.45;

export const TILE_TYPES = {
  earth: 'earth',
  crystal: 'crystal'
};

export const OBJECT_TYPES = {
  workbench: 'workbench'
};

export const RESOURCE_LABELS = {
  earth: 'Erde',
  rawWood: 'Rohholz',
  fiber: 'Fasern',
  grassSeed: 'Grassamen',
  workbench: 'Werkbank'
};

export const BASE_RESOURCES = ['earth', 'rawWood', 'fiber', 'grassSeed'];
export const HOTBAR_RESOURCES = [...BASE_RESOURCES, 'workbench'];
export const INVENTORY_RESOURCES = [...BASE_RESOURCES, 'workbench'];

export const RESOURCE_SHORT_LABELS = {
  earth: 'ER',
  rawWood: 'RH',
  fiber: 'FA',
  grassSeed: 'GS',
  workbench: 'WB'
};

export const RESOURCE_ICONS = {
  earth: '[]',
  rawWood: '||',
  fiber: '~~',
  grassSeed: '**',
  workbench: '#'
};

export const BASIC_RESOURCE_DROPS = [
  { resource: 'earth', amount: 1, weight: 50 },
  { resource: 'rawWood', amount: 1, weight: 20 },
  { resource: 'fiber', amount: 1, weight: 20 },
  { resource: 'grassSeed', amount: 1, weight: 10 }
];

export const WORKBENCH_RECIPE = {
  id: 'workbench',
  result: 'workbench',
  resultAmount: 1,
  costs: {
    rawWood: 5,
    fiber: 2
  }
};
