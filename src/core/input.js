export class Input {
  constructor() {
    this.keys = new Set();
    this.pressedThisFrame = new Set();
    this.lastKey = 'none';

    window.addEventListener('keydown', (event) => {
      const key = this.normalizeKey(event.key);
      this.lastKey = key;
      if (this.shouldPreventDefault(key)) {
        event.preventDefault();
      }

      if (!this.keys.has(key)) {
        this.pressedThisFrame.add(key);
      }
      this.keys.add(key);
    }, { capture: true });

    window.addEventListener('keyup', (event) => {
      const key = this.normalizeKey(event.key);
      this.lastKey = key;
      if (this.shouldPreventDefault(key)) {
        event.preventDefault();
      }

      this.keys.delete(key);
    }, { capture: true });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pressedThisFrame.clear();
    });
  }

  normalizeKey(key) {
    if (key === 'Spacebar') return ' ';
    return key.length === 1 ? key.toLowerCase() : key;
  }

  shouldPreventDefault(key) {
    return [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F3'].includes(key);
  }

  isDown(...keys) {
    return keys.some((key) => this.keys.has(this.normalizeKey(key)));
  }

  wasPressed(...keys) {
    return keys.some((key) => this.pressedThisFrame.has(this.normalizeKey(key)));
  }

  consumeFramePresses() {
    this.pressedThisFrame.clear();
  }

  getMovementKeys() {
    return ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']
      .filter((key) => this.keys.has(key));
  }

  getDebugState() {
    return {
      movementKeys: this.getMovementKeys(),
      lastKey: this.lastKey
    };
  }
}
