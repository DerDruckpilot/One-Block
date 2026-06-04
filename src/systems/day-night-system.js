import {
  DAY_NIGHT_CYCLE_SECONDS,
  DAY_NIGHT_PHASES,
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

  sleepUntilNight() {
    this.time = DAY_NIGHT_PHASES.night.start;
  }

  sleepUntilMorning() {
    this.time = DAY_NIGHT_PHASES.day.start;
  }

  getPhase() {
    return this.getPhaseInfo().label;
  }

  getPhaseId() {
    return this.getPhaseInfo().id;
  }

  getPhaseInfo() {
    if (this.time >= DAY_NIGHT_PHASES.day.start && this.time < DAY_NIGHT_PHASES.day.end) return DAY_NIGHT_PHASES.day;
    if (this.time >= DAY_NIGHT_PHASES.dusk.start && this.time < DAY_NIGHT_PHASES.dusk.end) return DAY_NIGHT_PHASES.dusk;
    if (this.time >= DAY_NIGHT_PHASES.night.start && this.time < DAY_NIGHT_PHASES.night.end) return DAY_NIGHT_PHASES.night;
    return DAY_NIGHT_PHASES.dawn;
  }

  getDarkness() {
    const phase = this.getPhaseId();
    if (phase === 'day') return 0;
    if (phase === 'night') return 0.58;
    if (phase === 'dusk') {
      const progress = (this.time - DAY_NIGHT_PHASES.dusk.start) / (DAY_NIGHT_PHASES.dusk.end - DAY_NIGHT_PHASES.dusk.start);
      return 0.18 + progress * 0.36;
    }
    const progress = (this.time - DAY_NIGHT_PHASES.dawn.start) / (DAY_NIGHT_PHASES.dawn.end - DAY_NIGHT_PHASES.dawn.start);
    return 0.54 * (1 - progress);
  }

  getSkyProfile() {
    const phase = this.getPhaseId();
    if (phase === 'night') {
      return {
        top: '#050816',
        middle: '#0c1630',
        bottom: '#182440',
        cloudAlpha: 0.18,
        starAlpha: 0.9,
        warmOverlay: 0
      };
    }

    if (phase === 'dusk') {
      const progress = (this.time - DAY_NIGHT_PHASES.dusk.start) / (DAY_NIGHT_PHASES.dusk.end - DAY_NIGHT_PHASES.dusk.start);
      return {
        top: progress > 0.5 ? '#152044' : '#496da0',
        middle: progress > 0.5 ? '#47365d' : '#dd8e72',
        bottom: '#f3b36b',
        cloudAlpha: 0.36 - progress * 0.16,
        starAlpha: Math.max(0, progress - 0.45) * 1.3,
        warmOverlay: 0.12 + progress * 0.08
      };
    }

    if (phase === 'dawn') {
      const progress = (this.time - DAY_NIGHT_PHASES.dawn.start) / (DAY_NIGHT_PHASES.dawn.end - DAY_NIGHT_PHASES.dawn.start);
      return {
        top: progress < 0.5 ? '#182544' : '#6db5ee',
        middle: '#e08f72',
        bottom: '#fff0bd',
        cloudAlpha: 0.2 + progress * 0.24,
        starAlpha: Math.max(0, 0.55 - progress) * 1.4,
        warmOverlay: 0.2 * (1 - progress)
      };
    }

    return {
      top: '#71c5ff',
      middle: '#bcecff',
      bottom: '#fff0bd',
      cloudAlpha: 0.48,
      starAlpha: 0,
      warmOverlay: 0
    };
  }

  toJSON() {
    return this.time;
  }
}
