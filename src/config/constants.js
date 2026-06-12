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
export const FURNACE_INTERACTION_DISTANCE = TILE_SIZE * 1.55;
export const BED_INTERACTION_DISTANCE = TILE_SIZE * 1.55;
export const HUSBANDRY_INTERACTION_DISTANCE = TILE_SIZE * 1.45;
export const HUSBANDRY_PRODUCTION_DISTANCE = TILE_SIZE * 2.4;
export const EGG_PRODUCTION_SECONDS = 20;
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
export const ANIMAL_MAX_COUNT = 4;
export const SHEEP_WOOL_PRODUCTION_SECONDS = 36;
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
export const AMMO_CAPS = {
  stoneBall: 10,
  arrow: 10
};
export const AMMO_CAP_UPGRADES = {
  stoneBall: { item: 'ammoPouch', cap: 20 },
  arrow: { item: 'quiver', cap: 20 }
};
export const CLOTHING_EQUIPMENT_RESOURCES = ['linenTunic'];
export const SHOE_EQUIPMENT_RESOURCES = ['travelBoots'];
export const ACCESSORY_EQUIPMENT_RESOURCES = ['ammoPouch', 'quiver'];
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
  window: 'window',
  table: 'table',
  chair: 'chair',
  rug: 'rug',
  plantPot: 'plantPot',
  shelf: 'shelf',
  floorLantern: 'floorLantern',
  fence: 'fence',
  gate: 'gate',
  door: 'door',
  bed: 'bed',
  chickenNest: 'chickenNest',
  feedTrough: 'feedTrough',
  waterTrough: 'waterTrough',
  furnace: 'furnace',
  sapling: 'sapling',
  tree: 'tree',
  berryBush: 'berryBush'
};

export const CONNECTABLE_BARRIER_GROUPS = {
  wall: [OBJECT_TYPES.woodWall, OBJECT_TYPES.door, OBJECT_TYPES.window],
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
  OBJECT_TYPES.plantPot,
  OBJECT_TYPES.shelf,
  OBJECT_TYPES.woodWall,
  OBJECT_TYPES.window,
  OBJECT_TYPES.fence,
  OBJECT_TYPES.gate,
  OBJECT_TYPES.door,
  OBJECT_TYPES.bed,
  OBJECT_TYPES.furnace,
  OBJECT_TYPES.tree
];

export const GROUND_ENTITY_BLOCKING_OBJECTS = [
  OBJECT_TYPES.workbench,
  OBJECT_TYPES.table,
  OBJECT_TYPES.plantPot,
  OBJECT_TYPES.shelf,
  OBJECT_TYPES.woodWall,
  OBJECT_TYPES.window,
  OBJECT_TYPES.fence,
  OBJECT_TYPES.gate,
  OBJECT_TYPES.door,
  OBJECT_TYPES.bed,
  OBJECT_TYPES.furnace,
  OBJECT_TYPES.tree
];

export const FLYING_ENTITY_BLOCKING_OBJECTS = [
  OBJECT_TYPES.woodWall,
  OBJECT_TYPES.window,
  OBJECT_TYPES.door,
  OBJECT_TYPES.tree
];

export const REMOVABLE_OBJECT_TYPES = [
  OBJECT_TYPES.workbench,
  OBJECT_TYPES.torch,
  OBJECT_TYPES.campfire,
  OBJECT_TYPES.woodWall,
  OBJECT_TYPES.window,
  OBJECT_TYPES.table,
  OBJECT_TYPES.chair,
  OBJECT_TYPES.rug,
  OBJECT_TYPES.plantPot,
  OBJECT_TYPES.shelf,
  OBJECT_TYPES.floorLantern,
  OBJECT_TYPES.fence,
  OBJECT_TYPES.gate,
  OBJECT_TYPES.door,
  OBJECT_TYPES.bed,
  OBJECT_TYPES.chickenNest,
  OBJECT_TYPES.feedTrough,
  OBJECT_TYPES.waterTrough,
  OBJECT_TYPES.furnace
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
  window: 'Fenster',
  woodFloor: 'Holzboden',
  stoneFloor: 'Steinboden',
  table: 'Tisch',
  chair: 'Stuhl',
  rug: 'Matte',
  plantPot: 'Pflanzenkübel',
  shelf: 'Regal',
  floorLantern: 'Laterne',
  lasso: 'Lasso',
  fence: 'Zaun',
  gate: 'Tor',
  door: 'Tür',
  bed: 'Bett',
  chickenNest: 'HÃ¼hnernest',
  feedTrough: 'Futterstelle',
  waterTrough: 'Wassertrug',
  furnace: 'Ofen',
  rawMeat: 'Rohes Fleisch',
  wool: 'Wolle',
  roastedBerries: 'Geröstete Beeren',
  cookedSteak: 'Gebratenes Steak',
  egg: 'Ei',
  friedEgg: 'Gebratenes Ei',
  clayBrick: 'Lehmziegel',
  unfiredBowl: 'Ungebrannte Tonschale',
  bowl: 'Tonschale',
  unfiredJug: 'Ungebrannter Tonkrug',
  jug: 'Tonkrug',
  ammoPouch: 'Munitionsbeutel',
  quiver: 'Köcher',
  linenTunic: 'Leinentunika',
  travelBoots: 'Reisestiefel'
};

export const BASE_RESOURCES = ['earth', 'rawWood', 'fiber', 'grassSeed'];
export const WORLD_RESOURCES = ['earth', 'stone', 'clay', 'clayBrick', 'unfiredBowl', 'bowl', 'unfiredJug', 'jug'];
export const FOOD_RESOURCES = ['berry', 'rawMeat', 'roastedBerries', 'cookedSteak', 'egg', 'friedEgg'];
export const FLOOR_OVERLAY_RESOURCES = ['woodFloor', 'stoneFloor'];
export const TOOL_RESOURCES = ['workbench', 'woodenPickaxe', 'woodenSpear', 'slingshot', 'bow', 'axe', 'scythe', 'lasso', 'torch', 'campfire', 'furnace', 'woodWall', 'window', 'door', 'fence', 'gate', 'bed', 'chickenNest', 'feedTrough', 'waterTrough', 'table', 'chair', 'rug', 'plantPot', 'shelf', 'floorLantern'];
export const AMMO_RESOURCES = ['arrow', 'stoneBall'];
export const ANIMAL_PRODUCT_RESOURCES = ['wool'];
export const EQUIPMENT_RESOURCES = ['ammoPouch', 'quiver', 'linenTunic', 'travelBoots'];
export const INVENTORY_RESOURCES = [...WORLD_RESOURCES, ...FLOOR_OVERLAY_RESOURCES, 'rawWood', 'fiber', 'grassSeed', 'treeSeed', 'springDrop', ...FOOD_RESOURCES, ...ANIMAL_PRODUCT_RESOURCES, ...AMMO_RESOURCES, ...TOOL_RESOURCES, ...EQUIPMENT_RESOURCES];
export const HOTBAR_SLOT_COUNT = 4;
export const HAND_EQUIPMENT_RESOURCES = [
  'woodenPickaxe',
  'woodenSpear',
  'slingshot',
  'bow',
  'lasso',
  'axe',
  'scythe'
];
export const HOTBAR_ALLOWED_RESOURCES = [
  'earth',
  'stone',
  'clay',
  'grassSeed',
  'treeSeed',
  'springDrop',
  'berry',
  'rawMeat',
  'roastedBerries',
  'cookedSteak',
  'egg',
  'friedEgg',
  'workbench',
  'torch',
  'campfire',
  'woodFloor',
  'stoneFloor',
  'woodWall',
  'window',
  'door',
  'fence',
  'gate',
  'bed',
  'chickenNest',
  'feedTrough',
  'waterTrough',
  'furnace',
  'table',
  'chair',
  'rug',
  'plantPot',
  'shelf',
  'floorLantern'
];
export const DEFAULT_HOTBAR_SLOTS = ['earth', 'grassSeed', null, null];

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
  woodFloor: 'HF',
  stoneFloor: 'SF',
  woodWall: 'WW',
  window: 'FE',
  table: 'TA',
  chair: 'CH',
  rug: 'MA',
  plantPot: 'PK',
  shelf: 'RG',
  floorLantern: 'LA',
  lasso: 'LA',
  fence: 'ZA',
  gate: 'TO',
  door: 'TU',
  bed: 'BD',
  chickenNest: 'HN',
  feedTrough: 'FT',
  waterTrough: 'WT',
  furnace: 'OF',
  rawMeat: 'RF',
  roastedBerries: 'RB',
  cookedSteak: 'CS',
  wool: 'WO',
  egg: 'EI',
  friedEgg: 'GE',
  clayBrick: 'LZ',
  unfiredBowl: 'US',
  bowl: 'TS',
  unfiredJug: 'UK',
  jug: 'TK',
  ammoPouch: 'MB',
  quiver: 'KO',
  linenTunic: 'LT',
  travelBoots: 'RS'
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
  woodFloor: '==',
  stoneFloor: '[]',
  woodWall: '|#|',
  window: '|o|',
  table: 'T',
  chair: 'h',
  rug: '__',
  plantPot: 'p',
  shelf: 'sh',
  floorLantern: 'l',
  lasso: 'o-',
  fence: '|=',
  gate: '[]',
  door: 'D',
  bed: 'Zz',
  chickenNest: 'nn',
  feedTrough: 'ff',
  waterTrough: 'wt',
  furnace: 'O',
  rawMeat: 'rm',
  roastedBerries: 'rb',
  cookedSteak: 'cs',
  wool: 'wo',
  egg: 'eg',
  friedEgg: 'fe',
  clayBrick: 'lz',
  unfiredBowl: 'ub',
  bowl: 'tb',
  unfiredJug: 'uj',
  jug: 'tj',
  ammoPouch: 'mb',
  quiver: 'ko',
  linenTunic: 'lt',
  travelBoots: 'rs'
};

export const INVENTORY_TABS = [
  { id: 'all', label: 'Alle' },
  { id: 'resources', label: 'Rohstoffe' },
  { id: 'tools', label: 'Werkzeuge' },
  { id: 'ammo', label: 'Munition' },
  { id: 'equipment', label: 'Ausrüstung' },
  { id: 'building', label: 'Bauelemente' },
  { id: 'seeds', label: 'Samen' },
  { id: 'food', label: 'Nahrung' }
];

export const RESOURCE_CATEGORIES = {
  earth: ['resources', 'building'],
  stone: ['resources', 'building'],
  clay: ['resources', 'building'],
  woodFloor: ['building'],
  stoneFloor: ['building'],
  rawWood: ['resources'],
  fiber: ['resources'],
  grassSeed: ['seeds'],
  treeSeed: ['seeds'],
  springDrop: ['resources'],
  berry: ['resources', 'food'],
  rawMeat: ['resources', 'food'],
  roastedBerries: ['food'],
  cookedSteak: ['food'],
  wool: ['resources'],
  egg: ['food'],
  friedEgg: ['food'],
  clayBrick: ['resources', 'building'],
  unfiredBowl: ['resources'],
  bowl: ['resources'],
  unfiredJug: ['resources'],
  jug: ['resources'],
  workbench: ['building'],
  woodenPickaxe: ['tools'],
  woodenSpear: ['tools'],
  slingshot: ['tools'],
  bow: ['tools'],
  axe: ['tools'],
  scythe: ['tools'],
  arrow: ['ammo'],
  stoneBall: ['ammo'],
  ammoPouch: ['equipment', 'ammo'],
  quiver: ['equipment', 'ammo'],
  linenTunic: ['equipment'],
  travelBoots: ['equipment'],
  torch: ['building'],
  campfire: ['building'],
  woodWall: ['building'],
  window: ['building'],
  door: ['building'],
  bed: ['building'],
  chickenNest: ['building'],
  feedTrough: ['building'],
  waterTrough: ['building'],
  furnace: ['building'],
  table: ['building'],
  chair: ['building'],
  rug: ['building'],
  plantPot: ['building'],
  shelf: ['building'],
  floorLantern: ['building'],
  lasso: ['tools'],
  fence: ['building'],
  gate: ['building']
};

export const BUILD_MENU_CATEGORIES = [
  { id: 'terrain', label: 'Gelände', resources: ['earth', 'stone', 'clay'] },
  { id: 'floor', label: 'Boden', resources: ['woodFloor', 'stoneFloor'] },
  { id: 'nature', label: 'Natur', resources: ['grassSeed', 'treeSeed'] },
  { id: 'light', label: 'Licht', resources: ['torch', 'campfire'] },
  { id: 'furniture', label: 'Moebel', resources: ['table', 'chair', 'bed', 'rug', 'plantPot', 'shelf', 'floorLantern', 'chickenNest', 'feedTrough', 'waterTrough'] },
  { id: 'building', label: 'Bau', resources: ['woodWall', 'window', 'door', 'fence', 'gate'] },
  { id: 'stations', label: 'Stationen', resources: ['workbench', 'furnace'] }
];

export const BASIC_RESOURCE_DROPS = [
  { resource: 'earth', amount: 1, weight: 34 },
  { resource: 'rawWood', amount: 1, weight: 18 },
  { resource: 'fiber', amount: 1, weight: 18 },
  { resource: 'grassSeed', amount: 1, weight: 12 },
  { resource: 'treeSeed', amount: 1, weight: 7 },
  { resource: 'berry', amount: 1, weight: 7 },
  { resource: 'springDrop', amount: 1, weight: 4 }
];

export const PICKAXE_RESOURCE_DROPS = [
  { resource: 'stone', amount: 1, weight: 72 },
  { resource: 'clay', amount: 1, weight: 28 }
];

export const CRYSTAL_LEVEL_THRESHOLDS = [
  { level: 2, xp: 150 },
  { level: 3, xp: 750 },
  { level: 4, xp: 1350 },
  { level: 5, xp: 2200 }
];

export const CRYSTAL_DROP_TABLES = {
  1: BASIC_RESOURCE_DROPS,
  2: [
    { resource: 'earth', amount: 1, weight: 28 },
    { resource: 'rawWood', amount: 1, weight: 18 },
    { resource: 'fiber', amount: 1, weight: 15 },
    { resource: 'grassSeed', amount: 1, weight: 12 },
    { resource: 'treeSeed', amount: 1, weight: 10 },
    { resource: 'berry', amount: 1, weight: 9 },
    { resource: 'springDrop', amount: 1, weight: 8 }
  ],
  3: [
    { resource: 'earth', amount: 1, weight: 23 },
    { resource: 'rawWood', amount: 1, weight: 17 },
    { resource: 'fiber', amount: 1, weight: 14 },
    { resource: 'grassSeed', amount: 1, weight: 12 },
    { resource: 'treeSeed', amount: 1, weight: 12 },
    { resource: 'berry', amount: 1, weight: 10 },
    { resource: 'springDrop', amount: 1, weight: 12 }
  ],
  4: [
    { resource: 'earth', amount: 1, weight: 18 },
    { resource: 'rawWood', amount: 2, weight: 16 },
    { resource: 'fiber', amount: 2, weight: 14 },
    { resource: 'grassSeed', amount: 1, weight: 10 },
    { resource: 'treeSeed', amount: 1, weight: 14 },
    { resource: 'berry', amount: 2, weight: 12 },
    { resource: 'springDrop', amount: 1, weight: 16 }
  ],
  5: [
    { resource: 'earth', amount: 2, weight: 16 },
    { resource: 'rawWood', amount: 2, weight: 17 },
    { resource: 'fiber', amount: 2, weight: 16 },
    { resource: 'grassSeed', amount: 2, weight: 10 },
    { resource: 'treeSeed', amount: 2, weight: 14 },
    { resource: 'berry', amount: 2, weight: 12 },
    { resource: 'springDrop', amount: 1, weight: 15 }
  ]
};

export const PICKAXE_RESOURCE_DROPS_BY_LEVEL = {
  1: PICKAXE_RESOURCE_DROPS,
  2: [
    { resource: 'stone', amount: 1, weight: 64 },
    { resource: 'clay', amount: 1, weight: 36 }
  ],
  3: [
    { resource: 'stone', amount: 1, weight: 55 },
    { resource: 'clay', amount: 1, weight: 45 }
  ],
  4: [
    { resource: 'stone', amount: 2, weight: 50 },
    { resource: 'clay', amount: 2, weight: 50 }
  ],
  5: [
    { resource: 'stone', amount: 2, weight: 45 },
    { resource: 'clay', amount: 2, weight: 55 }
  ]
};

export const CRYSTAL_ENCOUNTER_DROPS_BY_LEVEL = {
  1: CRYSTAL_ENCOUNTER_DROPS,
  2: CRYSTAL_ENCOUNTER_DROPS,
  3: [
    { encounter: 'ground', weight: 70 },
    { encounter: 'flying', weight: 30 }
  ],
  4: [
    { encounter: 'ground', weight: 58 },
    { encounter: 'flying', weight: 42 }
  ],
  5: [
    { encounter: 'ground', weight: 50 },
    { encounter: 'flying', weight: 50 }
  ]
};

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

export const WOOD_FLOOR_RECIPE = {
  id: 'woodFloor',
  name: 'Holzboden',
  result: 'woodFloor',
  resultAmount: 2,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  minCrystalLevel: 4,
  costs: {
    rawWood: 2
  }
};

export const STONE_FLOOR_RECIPE = {
  id: 'stoneFloor',
  name: 'Steinboden',
  result: 'stoneFloor',
  resultAmount: 2,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  minCrystalLevel: 4,
  costs: {
    stone: 3
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

export const AMMO_POUCH_RECIPE = {
  id: 'ammoPouch',
  name: 'Munitionsbeutel',
  result: 'ammoPouch',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    fiber: 10,
    rawWood: 2
  }
};

export const QUIVER_RECIPE = {
  id: 'quiver',
  name: 'Koecher',
  result: 'quiver',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    fiber: 8,
    rawWood: 4
  }
};

export const LINEN_TUNIC_RECIPE = {
  id: 'linenTunic',
  name: 'Leinentunika',
  result: 'linenTunic',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    fiber: 14,
    wool: 2
  }
};

export const TRAVEL_BOOTS_RECIPE = {
  id: 'travelBoots',
  name: 'Reisestiefel',
  result: 'travelBoots',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 2,
    fiber: 8,
    wool: 2
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

export const WINDOW_RECIPE = {
  id: 'window',
  name: 'Fenster',
  result: 'window',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  minCrystalLevel: 4,
  costs: {
    rawWood: 4,
    fiber: 2,
    clay: 1
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

export const RUG_RECIPE = {
  id: 'rug',
  name: 'Matte',
  result: 'rug',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  minCrystalLevel: 4,
  costs: {
    fiber: 6,
    wool: 1
  }
};

export const PLANT_POT_RECIPE = {
  id: 'plantPot',
  name: 'Pflanzenkübel',
  result: 'plantPot',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  minCrystalLevel: 4,
  costs: {
    clay: 3,
    grassSeed: 1
  }
};

export const SHELF_RECIPE = {
  id: 'shelf',
  name: 'Regal',
  result: 'shelf',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  minCrystalLevel: 4,
  costs: {
    rawWood: 6,
    fiber: 1
  }
};

export const FLOOR_LANTERN_RECIPE = {
  id: 'floorLantern',
  name: 'Laterne',
  result: 'floorLantern',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  minCrystalLevel: 4,
  costs: {
    rawWood: 2,
    fiber: 2,
    stone: 1
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

export const CHICKEN_NEST_RECIPE = {
  id: 'chickenNest',
  name: 'HÃƒÂ¼hnernest',
  result: 'chickenNest',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 4,
    fiber: 6
  }
};

export const FEED_TROUGH_RECIPE = {
  id: 'feedTrough',
  name: 'Futterstelle',
  result: 'feedTrough',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 4,
    fiber: 2
  }
};

export const WATER_TROUGH_RECIPE = {
  id: 'waterTrough',
  name: 'Wassertrug',
  result: 'waterTrough',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    rawWood: 4,
    clay: 1
  }
};

export const FURNACE_RECIPE = {
  id: 'furnace',
  name: 'Ofen',
  result: 'furnace',
  resultAmount: 1,
  craftingContext: 'workbench',
  requiresWorkbench: true,
  costs: {
    clay: 8,
    stone: 6
  }
};

export const UNFIRED_BOWL_RECIPE = {
  id: 'unfiredBowl',
  name: 'Ungebrannte Tonschale',
  result: 'unfiredBowl',
  resultAmount: 1,
  craftingContext: 'normal',
  requiresWorkbench: false,
  costs: {
    clay: 2
  }
};

export const UNFIRED_JUG_RECIPE = {
  id: 'unfiredJug',
  name: 'Ungebrannter Tonkrug',
  result: 'unfiredJug',
  resultAmount: 1,
  craftingContext: 'normal',
  requiresWorkbench: false,
  costs: {
    clay: 3
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

export const FRIED_EGG_RECIPE = {
  id: 'friedEgg',
  name: 'Gebratenes Ei',
  result: 'friedEgg',
  resultAmount: 1,
  craftingContext: 'cooking',
  requiresWorkbench: false,
  costs: {
    egg: 1
  }
};

export const CLAY_BRICK_RECIPE = {
  id: 'clayBrick',
  name: 'Lehmziegel',
  result: 'clayBrick',
  resultAmount: 1,
  craftingContext: 'furnace',
  requiresWorkbench: false,
  costs: {
    clay: 2
  }
};

export const BOWL_RECIPE = {
  id: 'bowl',
  name: 'Tonschale',
  result: 'bowl',
  resultAmount: 1,
  craftingContext: 'furnace',
  requiresWorkbench: false,
  costs: {
    unfiredBowl: 1
  }
};

export const JUG_RECIPE = {
  id: 'jug',
  name: 'Tonkrug',
  result: 'jug',
  resultAmount: 1,
  craftingContext: 'furnace',
  requiresWorkbench: false,
  costs: {
    unfiredJug: 1
  }
};

export const CRAFTING_RECIPES = [
  WORKBENCH_RECIPE,
  TORCH_RECIPE,
  CAMPFIRE_RECIPE,
  WOOD_FLOOR_RECIPE,
  STONE_FLOOR_RECIPE,
  ARROW_RECIPE,
  STONE_BALL_RECIPE,
  UNFIRED_BOWL_RECIPE,
  UNFIRED_JUG_RECIPE,
  AMMO_POUCH_RECIPE,
  QUIVER_RECIPE,
  LINEN_TUNIC_RECIPE,
  TRAVEL_BOOTS_RECIPE,
  WOODEN_PICKAXE_RECIPE,
  WOODEN_SPEAR_RECIPE,
  SLINGSHOT_RECIPE,
  BOW_RECIPE,
  AXE_RECIPE,
  SCYTHE_RECIPE,
  LASSO_RECIPE,
  WOOD_WALL_RECIPE,
  WINDOW_RECIPE,
  DOOR_RECIPE,
  FENCE_RECIPE,
  GATE_RECIPE,
  BED_RECIPE,
  CHICKEN_NEST_RECIPE,
  FEED_TROUGH_RECIPE,
  WATER_TROUGH_RECIPE,
  FURNACE_RECIPE,
  TABLE_RECIPE,
  CHAIR_RECIPE,
  RUG_RECIPE,
  PLANT_POT_RECIPE,
  SHELF_RECIPE,
  FLOOR_LANTERN_RECIPE
];

export const COOKING_RECIPES = [
  ROASTED_BERRIES_RECIPE,
  COOKED_STEAK_RECIPE,
  FRIED_EGG_RECIPE
];

export const FURNACE_RECIPES = [
  CLAY_BRICK_RECIPE,
  BOWL_RECIPE,
  JUG_RECIPE
];
