export const SAVE_KEY = 'one-block-save-v1';
export const MANUAL_SAVE_SLOT_PREFIX = 'one-block-manual-save-v1-slot-';

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

  getSlotKey(slotIndex) {
    return `${MANUAL_SAVE_SLOT_PREFIX}${slotIndex}`;
  }

  loadSlot(slotIndex) {
    if (!this.storage) return null;

    try {
      const rawSave = this.storage.getItem(this.getSlotKey(slotIndex));
      return rawSave ? JSON.parse(rawSave) : null;
    } catch {
      return null;
    }
  }

  saveSlot(slotIndex, state) {
    if (!this.storage) return false;

    try {
      this.storage.setItem(this.getSlotKey(slotIndex), JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        ...state
      }));
      return true;
    } catch {
      return false;
    }
  }

  clearSlot(slotIndex) {
    if (!this.storage) return false;

    try {
      this.storage.removeItem(this.getSlotKey(slotIndex));
      return true;
    } catch {
      return false;
    }
  }

  listSlots(count = 3) {
    const slots = [];
    for (let index = 1; index <= count; index += 1) {
      const save = this.loadSlot(index);
      slots.push({
        index,
        occupied: Boolean(save),
        savedAt: Number.isFinite(save?.savedAt) ? save.savedAt : null
      });
    }
    return slots;
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
