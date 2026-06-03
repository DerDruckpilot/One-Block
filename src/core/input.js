export class Input {
  constructor() {
    this.keys = new Set();
    this.pressedThisFrame = new Set();
    this.lastKey = 'none';
    this.virtualMovement = { x: 0, y: 0 };

    window.addEventListener('keydown', (event) => {
      if (this.isEditableTarget(event.target)) return;

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
      if (this.isEditableTarget(event.target)) return;

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

  isEditableTarget(target) {
    const tagName = target?.tagName?.toLowerCase?.();
    return tagName === 'input' || tagName === 'textarea' || target?.isContentEditable === true;
  }

  shouldPreventDefault(key) {
    return [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '1', '2', '3', '4', 'c', 'i', 'p', 'r'].includes(key);
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

  setVirtualMovement(vector) {
    this.virtualMovement = {
      x: Number(vector?.x || 0),
      y: Number(vector?.y || 0)
    };
  }

  getVirtualMovement() {
    return { ...this.virtualMovement };
  }

  getDebugState() {
    return {
      movementKeys: this.getMovementKeys(),
      virtualMovement: this.getVirtualMovement(),
      lastKey: this.lastKey
    };
  }
}
