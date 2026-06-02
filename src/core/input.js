export class Input {
  constructor() {
    this.keys = new Set();
    this.pressedThisFrame = new Set();

    window.addEventListener('keydown', (event) => {
      const key = this.normalizeKey(event.key);
      if (!this.keys.has(key)) {
        this.pressedThisFrame.add(key);
      }
      this.keys.add(key);
    });

    window.addEventListener('keyup', (event) => {
      this.keys.delete(this.normalizeKey(event.key));
    });
  }

  normalizeKey(key) {
    return key.length === 1 ? key.toLowerCase() : key;
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
}
