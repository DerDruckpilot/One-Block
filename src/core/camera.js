import { GAME_VIEW } from '../config/constants.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
  }

  follow(target) {
    this.x = target.x - GAME_VIEW.width / 2;
    this.y = target.y - GAME_VIEW.height / 2;
  }

  centerOn(point) {
    this.x = point.x - GAME_VIEW.width / 2;
    this.y = point.y - GAME_VIEW.height / 2;
  }
}
