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
export const WORKBENCH_INTERACTION_DISTANCE = TILE_SIZE * 1.8;
export const ENEMY_SIZE = 30;
export const ENEMY_MAX_HP = 4;
export const ENEMY_SPEED = 34;
export const FLYING_ENEMY_SIZE = 28;
export const FLYING_ENEMY_MAX_HP = 3;
export const FLYING_ENEMY_SPEED = 42;
export const FLYING_ENEMY_MAX_TILE_DISTANCE = 3;
export const ANIMAL_SIZE = 24;
export const ANIMAL_SPEED = 18;
export const ANIMAL_MAX_COUNT = 2;
export const SPEAR_ATTACK_RANGE = TILE_SIZE * 1.75;
export const SPEAR_ATTACK_DOT = 0.25;
export const SPEAR_DAMAGE = 1;
export const ATTACK_FEEDBACK_SECONDS = 0.18;
export const SLINGSHOT_RANGE = TILE_SIZE * 2;
export const SLINGSHOT_DAMAGE = 1;
export const BOW_RANGE = TILE_SIZE * 4;
export const BOW_DAMAGE = 2;
export const PROJECTILE_SPEED = 240;
export const PROJECTILE_HIT_RADIUS = 18;
export const DROP_PICKUP_DISTANCE = TILE_SIZE * 0.72;
export const DROP_ANIMATION_SECONDS = 0.42;
export const DAY_NIGHT_CYCLE_SECONDS = 120;
export const DAY_NIGHT_START_TIME = 0.18;

export const TILE_TYPES = {
  earth: 'earth',
  crystal: 'crystal',
  grass: 'grass',
  stone: 'stone'
};

export const OBJECT_TYPES = {
  workbench: 'workbench',
  torch: 'torch',
  campfire: 'campfire',
  woodWall: 'woodWall',
  table: 'table',
  chair: 'chair'
};

export const RESOURCE_LABELS = {
  earth: 'Erde',
  stone: 'Stein',
  rawWood: 'Rohholz',
  fiber: 'Fasern',
  grassSeed: 'Grassamen',
  workbench: 'Werkbank',
  woodenPickaxe: 'Holzspitzhacke',
  woodenSpear: 'Holzspeer',
  slingshot: 'Schleuder',
  bow: 'Bogen',
  arrow: 'Pfeil',
  stoneBall: 'Steinkugel',
  torch: 'Fackel',
  campfire: 'Lagerfeuer',
  woodWall: 'Holzwand',
  table: 'Tisch',
  chair: 'Stuhl'
};

export const BASE_RESOURCES = ['earth', 'rawWood', 'fiber', 'grassSeed'];
export const WORLD_RESOURCES = ['earth', 'stone'];
export const TOOL_RESOURCES = ['workbench', 'woodenPickaxe', 'woodenSpear', 'slingshot', 'bow', 'torch', 'campfire', 'woodWall', 'table', 'chair'];
export const AMMO_RESOURCES = ['arrow', 'stoneBall'];
export const INVENTORY_RESOURCES = ['earth', 'stone', 'rawWood', 'fiber', 'grassSeed', ...AMMO_RESOURCES, ...TOOL_RESOURCES];
export const HOTBAR_SLOT_COUNT = 4;
export const DEFAULT_HOTBAR_SLOTS = ['earth', 'rawWood', 'fiber', 'grassSeed'];

export const RESOURCE_SHORT_LABELS = {
  earth: 'ER',
  stone: 'ST',
  rawWood: 'RH',
  fiber: 'FA',
  grassSeed: 'GS',
  workbench: 'WB',
  woodenPickaxe: 'HP',
  woodenSpear: 'HS',
  slingshot: 'SL',
  bow: 'BO',
  arrow: 'AR',
  stoneBall: 'SB',
  torch: 'TO',
  campfire: 'CF',
  woodWall: 'WW',
  table: 'TA',
  chair: 'CH'
};

export const RESOURCE_ICONS = {
  earth: '[]',
  stone: '##',
  rawWood: '||',
  fiber: '~~',
  grassSeed: '**',
  workbench: '#',
  woodenPickaxe: '/\\',
  woodenSpear: '-->',
  slingshot: 'Y',
  bow: ')',
  arrow: '->',
  stoneBall: 'o',
  torch: '!',
  campfire: '^',
  woodWall: '|#|',
  table: 'T',
  chair: 'h'
};

export const INVENTORY_TABS = [
  { id: 'all', label: 'Alle' },
  { id: 'resources', label: 'Rohstoffe' },
  { id: 'tools', label: 'Werkzeuge' },
  { id: 'ammo', label: 'Munition' },
  { id: 'building', label: 'Bauelemente' },
  { id: 'seeds', label: 'Samen' }
];

export const RESOURCE_CATEGORIES = {
  earth: ['resources', 'building'],
  stone: ['resources', 'building'],
  rawWood: ['resources'],
  fiber: ['resources'],
  grassSeed: ['seeds'],
  workbench: ['building'],
  woodenPickaxe: ['tools'],
  woodenSpear: ['tools'],
  slingshot: ['tools'],
  bow: ['tools'],
  arrow: ['ammo'],
  stoneBall: ['ammo'],
  torch: ['building'],
  campfire: ['building'],
  woodWall: ['building'],
  table: ['building'],
  chair: ['building']
};

export const BASIC_RESOURCE_DROPS = [
  { resource: 'earth', amount: 1, weight: 50 },
  { resource: 'rawWood', amount: 1, weight: 20 },
  { resource: 'fiber', amount: 1, weight: 20 },
  { resource: 'grassSeed', amount: 1, weight: 10 }
];

export const PICKAXE_RESOURCE_DROPS = [
  { resource: 'stone', amount: 1, weight: 45 },
  { resource: 'earth', amount: 1, weight: 30 },
  { resource: 'rawWood', amount: 1, weight: 10 },
  { resource: 'fiber', amount: 1, weight: 10 },
  { resource: 'grassSeed', amount: 1, weight: 5 }
];

export const WORKBENCH_RECIPE = {
  id: 'workbench',
  name: 'Werkbank',
  result: 'workbench',
  resultAmount: 1,
  craftingContext: 'normal',
  requiresWorkbench: false,
  costs: {
    rawWood: 5,
    fiber: 2
  }
};

export const TORCH_RECIPE = {
  id: 'torch',
  name: 'Fackel',
  result: 'torch',
  resultAmount: 1,
  craftingContext: 'normal',
  requiresWorkbench: false,
  costs: {
    rawWood: 1,
    fiber: 1
  }
};

export const CAMPFIRE_RECIPE = {
  id: 'campfire',
  name: 'Lagerfeuer',
  result: 'campfire',
  resultAmount: 1,
  craftingContext: 'normal',
  requiresWorkbench: false,
  costs: {
    stone: 3,
    rawWood: 2
  }
};

export const ARROW_RECIPE = {
  id: 'arrow',
  name: 'Pfeile',
  result: 'arrow',
  resultAmount: 4,
  craftingContext: 'normal',
  requiresWorkbench: false,
  costs: {
    rawWood: 1,
    stone: 1
  }
};

export const STONE_BALL_RECIPE = {
  id: 'stoneBall',
  name: 'Steinkugeln',
  result: 'stoneBall',
  resultAmount: 4,
  craftingContext: 'normal',
  requiresWorkbench: false,
  costs: {
    stone: 1
  }
};

export const WOODEN_PICKAXE_RECIPE = {
  id: 'woodenPickaxe',
  name: 'Holzspitzhacke',
  result: 'woodenPickaxe',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 8,
    fiber: 4
  }
};

export const WOODEN_SPEAR_RECIPE = {
  id: 'woodenSpear',
  name: 'Holzspeer',
  result: 'woodenSpear',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 6,
    fiber: 6
  }
};

export const SLINGSHOT_RECIPE = {
  id: 'slingshot',
  name: 'Schleuder',
  result: 'slingshot',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 4,
    fiber: 6,
    stone: 2
  }
};

export const BOW_RECIPE = {
  id: 'bow',
  name: 'Bogen',
  result: 'bow',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 8,
    fiber: 8
  }
};

export const WOOD_WALL_RECIPE = {
  id: 'woodWall',
  name: 'Holzwand',
  result: 'woodWall',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 3,
    fiber: 1
  }
};

export const TABLE_RECIPE = {
  id: 'table',
  name: 'Tisch',
  result: 'table',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 6,
    fiber: 2
  }
};

export const CHAIR_RECIPE = {
  id: 'chair',
  name: 'Stuhl',
  result: 'chair',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 4,
    fiber: 1
  }
};

export const CRAFTING_RECIPES = [
  WORKBENCH_RECIPE,
  TORCH_RECIPE,
  CAMPFIRE_RECIPE,
  ARROW_RECIPE,
  STONE_BALL_RECIPE,
  WOODEN_PICKAXE_RECIPE,
  WOODEN_SPEAR_RECIPE,
  SLINGSHOT_RECIPE,
  BOW_RECIPE,
  WOOD_WALL_RECIPE,
  TABLE_RECIPE,
  CHAIR_RECIPE
];
