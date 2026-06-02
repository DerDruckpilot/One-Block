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

export const DIRECTIONS = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export const TOOLS = {
  fist: 'Faust',
  woodPickaxe: 'Holzspitzhacke',
  spear: 'Speer'
};

export const TILE_TYPES = {
  earth: 'earth',
  crystal: 'crystal'
};

export const RESOURCE_LABELS = {
  earth: 'Erde',
  rawWood: 'Rohholz',
  fiber: 'Fasern',
  seed: 'Samen',
  stone: 'Stein',
  clay: 'Lehm',
  encounter: 'Begegnung'
};
