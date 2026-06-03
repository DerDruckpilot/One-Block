import {
  DAY_NIGHT_CYCLE_SECONDS,
  DAY_NIGHT_START_TIME
} from '../config/constants.js';

export class DayNightSystem {
  constructor(time = DAY_NIGHT_START_TIME) {
    this.time = this.normalize(time);
  }

  update(deltaSeconds) {
    this.time = this.normalize(this.time + deltaSeconds / DAY_NIGHT_CYCLE_SECONDS);
  }

  reset() {
    this.time = DAY_NIGHT_START_TIME;
  }

  load(value) {
    this.time = Number.isFinite(value) ? this.normalize(value) : DAY_NIGHT_START_TIME;
  }

  normalize(value) {
    return ((Number(value) % 1) + 1) % 1;
  }

  getPhase() {
    if (this.time >= 0.25 && this.time < 0.68) return 'Tag';
    if ((this.time >= 0.68 && this.time < 0.82) || (this.time >= 0.14 && this.time < 0.25)) return 'Dämmerung';
    return 'Nacht';
  }

  getDarkness() {
    const phase = this.getPhase();
    if (phase === 'Tag') return 0;
    if (phase === 'Dämmerung') return 0.28;
    return 0.52;
  }

  toJSON() {
    return this.time;
  }
}
