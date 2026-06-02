export const SAVE_KEY = 'one-block-save-v1';

export class SaveSystem {
  constructor(storage = SaveSystem.getDefaultStorage()) {
    this.storage = storage;
  }

  static getDefaultStorage() {
    try {
      return globalThis.localStorage;
    } catch {
      return null;
    }
  }

  load() {
    if (!this.storage) return null;

    try {
      const rawSave = this.storage.getItem(SAVE_KEY);
      return rawSave ? JSON.parse(rawSave) : null;
    } catch {
      return null;
    }
  }

  save(state) {
    if (!this.storage) return false;

    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        ...state
      }));
      return true;
    } catch {
      return false;
    }
  }

  clear() {
    if (!this.storage) return false;

    try {
      this.storage.removeItem(SAVE_KEY);
      return true;
    } catch {
      return false;
    }
  }
}
