export const PLAYER_SPRITE_SHEET_PATH = 'assets/generated/sprites/player/player_final_48.png';
export const PLAYER_INVENTORY_PORTRAIT_PATH = 'assets/generated/sprites/player/player_inventory_portrait.png';
export const PLAYER_FRAME_WIDTH = 48;
export const PLAYER_FRAME_HEIGHT = 48;

const PLAYER_ANIMATIONS = {
  idle_down: { row: 0, frameCount: 2, fps: 2 },
  idle_left: { row: 1, frameCount: 2, fps: 2 },
  idle_right: { row: 2, frameCount: 2, fps: 2 },
  idle_up: { row: 3, frameCount: 2, fps: 2 },
  walk_down: { row: 4, frameCount: 4, fps: 6 },
  walk_left: { row: 5, frameCount: 4, fps: 6 },
  walk_right: { row: 6, frameCount: 4, fps: 6 },
  walk_up: { row: 7, frameCount: 4, fps: 6 },
  run_down: { row: 8, frameCount: 4, fps: 9 },
  run_left: { row: 9, frameCount: 4, fps: 9 },
  run_right: { row: 10, frameCount: 4, fps: 9 },
  run_up: { row: 11, frameCount: 4, fps: 9 },
  attack_down: { row: 12, frameCount: 4, fps: 10 },
  attack_left: { row: 13, frameCount: 4, fps: 10 },
  attack_right: { row: 14, frameCount: 4, fps: 10 },
  attack_up: { row: 15, frameCount: 4, fps: 10 }
};

let playerSpriteSheet = null;

export function preloadPlayerAssets() {
  if (typeof Image === 'undefined' || playerSpriteSheet) return;
  const image = new Image();
  image.decoding = 'async';
  image.src = PLAYER_SPRITE_SHEET_PATH;
  playerSpriteSheet = image;
}

export function getLoadedPlayerSpriteSheet() {
  if (!playerSpriteSheet || playerSpriteSheet.complete !== true || playerSpriteSheet.naturalWidth <= 0) return null;
  return playerSpriteSheet;
}

export function getPlayerDirectionKey(facing = { x: 0, y: 1 }) {
  if (Math.abs(facing.x || 0) > Math.abs(facing.y || 0)) {
    return facing.x < 0 ? 'left' : 'right';
  }
  return facing.y < 0 ? 'up' : 'down';
}

export function getPlayerFrameSource(player) {
  const direction = getPlayerDirectionKey(player?.facing);
  const isAttacking = (player?.attackAnimationSeconds || 0) > 0;
  const base = isAttacking ? 'attack' : player?.isMoving ? player?.isRunning ? 'run' : 'walk' : 'idle';
  const animation = PLAYER_ANIMATIONS[`${base}_${direction}`] || PLAYER_ANIMATIONS.idle_down;
  const animationSeconds = isAttacking
    ? Math.max(0, (player.attackAnimationDuration || 0.32) - player.attackAnimationSeconds)
    : player?.animationSeconds || 0;
  const frame = Math.floor(animationSeconds * animation.fps) % animation.frameCount;
  return {
    sx: frame * PLAYER_FRAME_WIDTH,
    sy: animation.row * PLAYER_FRAME_HEIGHT,
    sw: PLAYER_FRAME_WIDTH,
    sh: PLAYER_FRAME_HEIGHT
  };
}

preloadPlayerAssets();
