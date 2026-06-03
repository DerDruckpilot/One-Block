export class LogSystem {
  constructor(maxEntries = 5) {
    this.maxEntries = maxEntries;
    this.entries = [];
  }

  add(message) {
    const text = String(message || '').trim();
    if (!text) return this.entries;
    if (this.entries[0] === text) return this.entries;

    this.entries.unshift(text);
    this.entries = this.entries.slice(0, this.maxEntries);
    return this.entries;
  }

  reset(message) {
    this.entries = [];
    if (message) this.add(message);
  }

  load(entries) {
    this.entries = Array.isArray(entries)
      ? entries
        .filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
        .slice(0, this.maxEntries)
      : [];
  }

  latest(fallback = '') {
    return this.entries[0] || fallback;
  }

  toJSON() {
    return [...this.entries];
  }
}
