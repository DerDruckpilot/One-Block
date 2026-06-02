import { MOVEMENT, PLAYER_FOOT_OFFSET, PLAYER_SIZE, TILE_SIZE } from '../config/constants.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;
    this.facing = { x: 0, y: -1 };
  }

  update(deltaSeconds, input, tileMap) {
    const movement = this.readMovement(input);
    if (movement.x !== 0 || movement.y !== 0) {
      this.facing = this.primaryFacing(movement);
    }

    const speed = input.isDown('Shift') ? MOVEMENT.runSpeed : MOVEMENT.walkSpeed;
    const nextX = this.x + movement.x * speed * deltaSeconds;
    const nextY = this.y + movement.y * speed * deltaSeconds;

    if (this.canMoveTo(nextX, this.y, tileMap)) {
      this.x = nextX;
    }

    if (this.canMoveTo(this.x, nextY, tileMap)) {
      this.y = nextY;
    }
  }

  readMovement(input) {
    let x = 0;
    let y = 0;

    if (input.isDown('a', 'ArrowLeft')) x -= 1;
    if (input.isDown('d', 'ArrowRight')) x += 1;
    if (input.isDown('w', 'ArrowUp')) y -= 1;
    if (input.isDown('s', 'ArrowDown')) y += 1;

    if (x !== 0 && y !== 0) {
      const normalizer = Math.SQRT1_2;
      x *= normalizer;
      y *= normalizer;
    }

    return { x, y };
  }

  primaryFacing(movement) {
    if (Math.abs(movement.x) > Math.abs(movement.y)) {
      return { x: Math.sign(movement.x), y: 0 };
    }
    return { x: 0, y: Math.sign(movement.y) };
  }

  canMoveTo(x, y, tileMap) {
    const foot = this.getFootPositionAt(x, y);
    return !tileMap.isCrystalAtWorld(foot.x, foot.y);
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  getFootPosition() {
    return this.getFootPositionAt(this.x, this.y);
  }

  getFootPositionAt(x, y) {
    return {
      x: x + this.width / 2,
      y: y + this.height - PLAYER_FOOT_OFFSET
    };
  }

  getTilePosition() {
    const foot = this.getFootPosition();
    return {
      x: Math.floor(foot.x / TILE_SIZE),
      y: Math.floor(foot.y / TILE_SIZE)
    };
  }

  getFacingTile() {
    const tile = this.getTilePosition();
    return {
      x: tile.x + this.facing.x,
      y: tile.y + this.facing.y
    };
  }
}
