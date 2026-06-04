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
export const PLAYER_MAX_HP = 6;
export const PLAYER_DAMAGE_COOLDOWN_SECONDS = 1;
export const CRYSTAL_INTERACTION_DISTANCE = TILE_SIZE * 1.45;
export const WORKBENCH_INTERACTION_DISTANCE = TILE_SIZE * 1.8;
export const CAMPFIRE_INTERACTION_DISTANCE = TILE_SIZE * 1.55;
export const BED_INTERACTION_DISTANCE = TILE_SIZE * 1.55;
export const LASSO_INTERACTION_DISTANCE = TILE_SIZE * 1.55;
export const GATE_INTERACTION_DISTANCE = TILE_SIZE * 1.35;
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
export const SAPLING_GROW_SECONDS = 24;
export const BERRY_BUSH_GROW_SECONDS = 18;
export const GRASS_HARVEST_COOLDOWN_SECONDS = 16;
export const DROP_PICKUP_DISTANCE = TILE_SIZE * 0.72;
export const DROP_ANIMATION_SECONDS = 0.42;
export const DAY_NIGHT_CYCLE_SECONDS = 600;
export const DAY_NIGHT_START_TIME = 0;
export const DAY_NIGHT_PHASES = {
  day: { id: 'day', label: 'Tag', start: 0, end: 0.45, durationSeconds: 270 },
  dusk: { id: 'dusk', label: 'Dämmerung', start: 0.45, end: 0.5, durationSeconds: 30 },
  night: { id: 'night', label: 'Nacht', start: 0.5, end: 0.95, durationSeconds: 270 },
  dawn: { id: 'dawn', label: 'Morgengrauen', start: 0.95, end: 1, durationSeconds: 30 }
};

export const TILE_TYPES = {
  earth: 'earth',
  crystal: 'crystal',
  grass: 'grass',
  stone: 'stone',
  clay: 'clay',
  moistEarth: 'moistEarth',
  water: 'water'
};

export const OBJECT_TYPES = {
  workbench: 'workbench',
  torch: 'torch',
  campfire: 'campfire',
  woodWall: 'woodWall',
  table: 'table',
  chair: 'chair',
  fence: 'fence',
  gate: 'gate',
  door: 'door',
  bed: 'bed',
  sapling: 'sapling',
  tree: 'tree',
  berryBush: 'berryBush'
};

export const CONNECTABLE_BARRIER_GROUPS = {
  wall: [OBJECT_TYPES.woodWall, OBJECT_TYPES.door],
  fence: [OBJECT_TYPES.fence, OBJECT_TYPES.gate]
};

export const CONNECTABLE_BARRIER_TYPES = [
  ...CONNECTABLE_BARRIER_GROUPS.wall,
  ...CONNECTABLE_BARRIER_GROUPS.fence
];

export const BARRIER_COLLISION_THICKNESS = 8;

export const PLAYER_BLOCKING_OBJECTS = [
  OBJECT_TYPES.workbench,
  OBJECT_TYPES.table,
  OBJECT_TYPES.woodWall,
  OBJECT_TYPES.fence,
  OBJECT_TYPES.gate,
  OBJECT_TYPES.door,
  OBJECT_TYPES.bed,
  OBJECT_TYPES.tree
];

export const GROUND_ENTITY_BLOCKING_OBJECTS = [
  OBJECT_TYPES.workbench,
  OBJECT_TYPES.table,
  OBJECT_TYPES.woodWall,
  OBJECT_TYPES.fence,
  OBJECT_TYPES.gate,
  OBJECT_TYPES.door,
  OBJECT_TYPES.bed,
  OBJECT_TYPES.tree
];

export const FLYING_ENTITY_BLOCKING_OBJECTS = [
  OBJECT_TYPES.woodWall,
  OBJECT_TYPES.door,
  OBJECT_TYPES.tree
];

export const REMOVABLE_OBJECT_TYPES = [
  OBJECT_TYPES.workbench,
  OBJECT_TYPES.torch,
  OBJECT_TYPES.campfire,
  OBJECT_TYPES.woodWall,
  OBJECT_TYPES.table,
  OBJECT_TYPES.chair,
  OBJECT_TYPES.fence,
  OBJECT_TYPES.gate,
  OBJECT_TYPES.door,
  OBJECT_TYPES.bed
];

export const CRYSTAL_ENCOUNTER_DROPS = [
  { encounter: 'ground', weight: 80 },
  { encounter: 'flying', weight: 20 }
];

export const RESOURCE_LABELS = {
  earth: 'Erde',
  stone: 'Stein',
  rawWood: 'Rohholz',
  fiber: 'Fasern',
  grassSeed: 'Grassamen',
  clay: 'Lehm',
  springDrop: 'Quelltropfen',
  treeSeed: 'Baumsamen',
  berry: 'Beeren',
  workbench: 'Werkbank',
  woodenPickaxe: 'Holzspitzhacke',
  woodenSpear: 'Holzspeer',
  slingshot: 'Schleuder',
  bow: 'Bogen',
  axe: 'Axt',
  scythe: 'Sense',
  arrow: 'Pfeil',
  stoneBall: 'Steinkugel',
  torch: 'Fackel',
  campfire: 'Lagerfeuer',
  woodWall: 'Holzwand',
  table: 'Tisch',
  chair: 'Stuhl',
  lasso: 'Lasso',
  fence: 'Zaun',
  gate: 'Tor',
  door: 'Tür',
  bed: 'Bett',
  rawMeat: 'Rohes Fleisch',
  roastedBerries: 'Geröstete Beeren',
  cookedSteak: 'Gebratenes Steak'
};

export const BASE_RESOURCES = ['earth', 'rawWood', 'fiber', 'grassSeed'];
export const WORLD_RESOURCES = ['earth', 'stone', 'clay'];
export const FOOD_RESOURCES = ['berry', 'rawMeat', 'roastedBerries', 'cookedSteak'];
export const TOOL_RESOURCES = ['workbench', 'woodenPickaxe', 'woodenSpear', 'slingshot', 'bow', 'axe', 'scythe', 'lasso', 'torch', 'campfire', 'woodWall', 'door', 'fence', 'gate', 'bed', 'table', 'chair'];
export const AMMO_RESOURCES = ['arrow', 'stoneBall'];
export const INVENTORY_RESOURCES = ['earth', 'stone', 'clay', 'rawWood', 'fiber', 'grassSeed', 'treeSeed', 'springDrop', ...FOOD_RESOURCES, ...AMMO_RESOURCES, ...TOOL_RESOURCES];
export const HOTBAR_SLOT_COUNT = 4;
export const DEFAULT_HOTBAR_SLOTS = ['earth', 'rawWood', 'fiber', 'grassSeed'];

export const RESOURCE_SHORT_LABELS = {
  earth: 'ER',
  stone: 'ST',
  rawWood: 'RH',
  fiber: 'FA',
  grassSeed: 'GS',
  clay: 'CL',
  springDrop: 'QT',
  treeSeed: 'BS',
  berry: 'BE',
  workbench: 'WB',
  woodenPickaxe: 'HP',
  woodenSpear: 'HS',
  slingshot: 'SL',
  bow: 'BO',
  axe: 'AX',
  scythe: 'SC',
  arrow: 'AR',
  stoneBall: 'SB',
  torch: 'TO',
  campfire: 'CF',
  woodWall: 'WW',
  table: 'TA',
  chair: 'CH',
  lasso: 'LA',
  fence: 'ZA',
  gate: 'TO',
  door: 'TU',
  bed: 'BD',
  rawMeat: 'RF',
  roastedBerries: 'RB',
  cookedSteak: 'CS'
};

export const RESOURCE_ICONS = {
  earth: '[]',
  stone: '##',
  rawWood: '||',
  fiber: '~~',
  grassSeed: '**',
  clay: '==',
  springDrop: '~o',
  treeSeed: 't*',
  berry: 'bb',
  workbench: '#',
  woodenPickaxe: '/\\',
  woodenSpear: '-->',
  slingshot: 'Y',
  bow: ')',
  axe: '7',
  scythe: 'J',
  arrow: '->',
  stoneBall: 'o',
  torch: '!',
  campfire: '^',
  woodWall: '|#|',
  table: 'T',
  chair: 'h',
  lasso: 'o-',
  fence: '|=',
  gate: '[]',
  door: 'D',
  bed: 'Zz',
  rawMeat: 'rm',
  roastedBerries: 'rb',
  cookedSteak: 'cs'
};

export const INVENTORY_TABS = [
  { id: 'all', label: 'Alle' },
  { id: 'resources', label: 'Rohstoffe' },
  { id: 'tools', label: 'Werkzeuge' },
  { id: 'ammo', label: 'Munition' },
  { id: 'building', label: 'Bauelemente' },
  { id: 'seeds', label: 'Samen' },
  { id: 'food', label: 'Nahrung' }
];

export const RESOURCE_CATEGORIES = {
  earth: ['resources', 'building'],
  stone: ['resources', 'building'],
  clay: ['resources', 'building'],
  rawWood: ['resources'],
  fiber: ['resources'],
  grassSeed: ['seeds'],
  treeSeed: ['seeds'],
  springDrop: ['resources'],
  berry: ['resources', 'food'],
  rawMeat: ['resources', 'food'],
  roastedBerries: ['food'],
  cookedSteak: ['food'],
  workbench: ['building'],
  woodenPickaxe: ['tools'],
  woodenSpear: ['tools'],
  slingshot: ['tools'],
  bow: ['tools'],
  axe: ['tools'],
  scythe: ['tools'],
  arrow: ['ammo'],
  stoneBall: ['ammo'],
  torch: ['building'],
  campfire: ['building'],
  woodWall: ['building'],
  door: ['building'],
  bed: ['building'],
  table: ['building'],
  chair: ['building'],
  lasso: ['tools'],
  fence: ['building'],
  gate: ['building']
};

export const BUILD_MENU_CATEGORIES = [
  { id: 'terrain', label: 'Gelände', resources: ['earth', 'stone', 'clay'] },
  { id: 'nature', label: 'Natur', resources: ['grassSeed', 'treeSeed'] },
  { id: 'light', label: 'Licht', resources: ['torch', 'campfire'] },
  { id: 'furniture', label: 'Möbel', resources: ['table', 'chair', 'bed'] },
  { id: 'building', label: 'Bau', resources: ['woodWall', 'door', 'fence', 'gate'] },
  { id: 'stations', label: 'Stationen', resources: ['workbench'] }
];

export const BASIC_RESOURCE_DROPS = [
  { resource: 'earth', amount: 1, weight: 50 },
  { resource: 'rawWood', amount: 1, weight: 20 },
  { resource: 'fiber', amount: 1, weight: 20 },
  { resource: 'grassSeed', amount: 1, weight: 10 }
];

export const PICKAXE_RESOURCE_DROPS = [
  { resource: 'stone', amount: 1, weight: 40 },
  { resource: 'earth', amount: 1, weight: 23 },
  { resource: 'rawWood', amount: 1, weight: 10 },
  { resource: 'fiber', amount: 1, weight: 10 },
  { resource: 'grassSeed', amount: 1, weight: 5 },
  { resource: 'clay', amount: 1, weight: 8 },
  { resource: 'treeSeed', amount: 1, weight: 2 },
  { resource: 'berry', amount: 1, weight: 2 }
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

export const AXE_RECIPE = {
  id: 'axe',
  name: 'Axt',
  result: 'axe',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 6,
    stone: 4,
    fiber: 2
  }
};

export const SCYTHE_RECIPE = {
  id: 'scythe',
  name: 'Sense',
  result: 'scythe',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 4,
    stone: 3,
    fiber: 4
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

export const LASSO_RECIPE = {
  id: 'lasso',
  name: 'Lasso',
  result: 'lasso',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    fiber: 8,
    rawWood: 2
  }
};

export const FENCE_RECIPE = {
  id: 'fence',
  name: 'Zaun',
  result: 'fence',
  resultAmount: 2,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 3,
    fiber: 1
  }
};

export const GATE_RECIPE = {
  id: 'gate',
  name: 'Tor',
  result: 'gate',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 4,
    fiber: 2
  }
};

export const DOOR_RECIPE = {
  id: 'door',
  name: 'Tür',
  result: 'door',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 4,
    fiber: 2
  }
};

export const BED_RECIPE = {
  id: 'bed',
  name: 'Bett',
  result: 'bed',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 6,
    fiber: 6
  }
};

export const ROASTED_BERRIES_RECIPE = {
  id: 'roastedBerries',
  name: 'Geröstete Beeren',
  result: 'roastedBerries',
  resultAmount: 1,
  craftingContext: 'cooking',
  requiresWorkbench: false,
  costs: {
    berry: 2
  }
};

export const COOKED_STEAK_RECIPE = {
  id: 'cookedSteak',
  name: 'Gebratenes Steak',
  result: 'cookedSteak',
  resultAmount: 1,
  craftingContext: 'cooking',
  requiresWorkbench: false,
  costs: {
    rawMeat: 1
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
  AXE_RECIPE,
  SCYTHE_RECIPE,
  LASSO_RECIPE,
  WOOD_WALL_RECIPE,
  DOOR_RECIPE,
  FENCE_RECIPE,
  GATE_RECIPE,
  BED_RECIPE,
  TABLE_RECIPE,
  CHAIR_RECIPE
];

export const COOKING_RECIPES = [
  ROASTED_BERRIES_RECIPE,
  COOKED_STEAK_RECIPE
];
