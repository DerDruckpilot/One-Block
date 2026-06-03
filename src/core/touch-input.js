const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export class TouchInput {
  constructor({
    joystickElement = null,
    joystickKnobElement = null,
    actionButton = null,
    attackButton = null,
    pointerTarget = globalThis.window,
    isUiBlocked = (event) => TouchInput.isDefaultUiTarget(event.target)
  } = {}) {
    this.joystickElement = joystickElement;
    this.joystickKnobElement = joystickKnobElement;
    this.actionButton = actionButton;
    this.attackButton = attackButton;
    this.joystickPointerId = null;
    this.buttonPointers = new Map();
    this.vector = { x: 0, y: 0 };
    this.origin = null;
    this.actionPressedThisFrame = false;
    this.attackPressedThisFrame = false;
    this.enabled = true;
    this.pointerTarget = pointerTarget;
    this.isUiBlocked = isUiBlocked;

    this.bindJoystick();
    this.bindDynamicSurface();
    this.bindButton(actionButton, 'action');
    this.bindButton(attackButton, 'attack');
    this.setJoystickVisible(false);
  }

  static isDefaultUiTarget(target) {
    return Boolean(target?.closest?.(
      '#inventory-panel, #crafting-panel, #top-menu, #hotbar, #touch-action, #touch-attack, button, input, textarea'
    ));
  }

  bindJoystick() {
    this.joystickElement?.addEventListener?.('pointerdown', (event) => {
      if (!this.enabled) return;
      if (this.joystickPointerId !== null) return;
      this.consumeEvent(event);
      this.startJoystick(event);
    });

    this.joystickElement?.addEventListener?.('pointermove', (event) => {
      if (!this.enabled) return;
      if (event.pointerId !== this.joystickPointerId) return;
      this.consumeEvent(event);
      this.updateJoystickVector(event);
    });

    for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      this.joystickElement?.addEventListener?.(eventName, (event) => {
        if (event.pointerId !== this.joystickPointerId) return;
        this.consumeEvent(event);
        this.clearJoystick();
      });
    }
  }

  bindDynamicSurface() {
    this.pointerTarget?.addEventListener?.('pointerdown', (event) => {
      if (!this.shouldStartDynamicJoystick(event)) return;
      this.consumeEvent(event);
      this.startJoystick(event);
    }, { capture: true });

    this.pointerTarget?.addEventListener?.('pointermove', (event) => {
      if (!this.enabled) return;
      if (event.pointerId !== this.joystickPointerId) return;
      this.consumeEvent(event);
      this.updateJoystickVector(event);
    }, { capture: true });

    for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      this.pointerTarget?.addEventListener?.(eventName, (event) => {
        if (event.pointerId !== this.joystickPointerId) return;
        this.consumeEvent(event);
        this.clearJoystick();
      }, { capture: true });
    }
  }

  shouldStartDynamicJoystick(event) {
    if (!this.enabled) return false;
    if (this.joystickPointerId !== null) return false;
    if (event.pointerType === 'mouse') return false;
    if (this.isUiBlocked(event)) return false;

    const viewportWidth = globalThis.innerWidth || this.pointerTarget?.innerWidth || 0;
    if (viewportWidth > 0 && event.clientX > viewportWidth / 2) return false;
    return true;
  }

  startJoystick(event) {
    this.joystickPointerId = event.pointerId;
    this.origin = { x: Number(event.clientX || 0), y: Number(event.clientY || 0) };
    this.positionJoystickAtOrigin();
    this.setJoystickVisible(true);
    this.joystickElement?.setPointerCapture?.(event.pointerId);
    this.updateJoystickVector(event);
    this.joystickElement?.classList?.add('is-active');
  }

  bindButton(button, action) {
    button?.addEventListener?.('pointerdown', (event) => {
      if (!this.enabled) return;
      this.consumeEvent(event);
      button.setPointerCapture?.(event.pointerId);
      this.buttonPointers.set(event.pointerId, action);
      if (action === 'action') this.actionPressedThisFrame = true;
      if (action === 'attack') this.attackPressedThisFrame = true;
      button.classList?.add('is-pressed');
    });

    const release = (event) => {
      if (this.buttonPointers.get(event.pointerId) !== action) return;
      this.consumeEvent(event);
      this.buttonPointers.delete(event.pointerId);
      if (!this.isButtonHeld(action)) {
        button.classList?.remove('is-pressed');
      }
    };

    button?.addEventListener?.('pointerup', release);
    button?.addEventListener?.('pointercancel', release);
    button?.addEventListener?.('lostpointercapture', release);
  }

  setEnabled(enabled) {
    const nextEnabled = enabled === true;
    if (this.enabled === nextEnabled) return;

    this.enabled = nextEnabled;
    if (!this.enabled) {
      this.clearJoystick();
      this.buttonPointers.clear();
      this.actionPressedThisFrame = false;
      this.attackPressedThisFrame = false;
      this.actionButton?.classList?.remove('is-pressed');
      this.attackButton?.classList?.remove('is-pressed');
    }
  }

  updateJoystickVector(event) {
    const rect = this.joystickElement?.getBoundingClientRect?.();
    const width = rect?.width || 112;
    const height = rect?.height || 112;
    if (width <= 0 || height <= 0) {
      this.vector = { x: 0, y: 0 };
      return;
    }

    const radius = Math.min(width, height) / 2;
    const centerX = this.origin?.x ?? rect.left + width / 2;
    const centerY = this.origin?.y ?? rect.top + height / 2;
    const offsetX = event.clientX - centerX;
    const offsetY = event.clientY - centerY;
    const distance = Math.hypot(offsetX, offsetY);
    const clampedDistance = Math.min(distance, radius);
    const angle = distance > 0 ? Math.atan2(offsetY, offsetX) : 0;
    const normalized = radius > 0 ? clampedDistance / radius : 0;
    const deadzone = 0.12;

    this.vector = normalized < deadzone
      ? { x: 0, y: 0 }
      : {
        x: clamp(Math.cos(angle) * normalized, -1, 1),
        y: clamp(Math.sin(angle) * normalized, -1, 1)
      };

    this.updateKnob(offsetX, offsetY, clampedDistance, distance);
  }

  updateKnob(offsetX, offsetY, clampedDistance, distance) {
    if (!this.joystickKnobElement) return;
    const scale = distance > 0 ? clampedDistance / distance : 0;
    const x = offsetX * scale;
    const y = offsetY * scale;
    this.joystickKnobElement.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  clearJoystick() {
    this.joystickPointerId = null;
    this.origin = null;
    this.vector = { x: 0, y: 0 };
    if (this.joystickKnobElement) {
      this.joystickKnobElement.style.transform = 'translate(-50%, -50%)';
    }
    this.joystickElement?.classList?.remove('is-active');
    this.setJoystickVisible(false);
  }

  positionJoystickAtOrigin() {
    if (!this.joystickElement || !this.origin) return;
    this.joystickElement.style.left = `${this.origin.x}px`;
    this.joystickElement.style.top = `${this.origin.y}px`;
    this.joystickElement.style.bottom = 'auto';
    this.joystickElement.style.transform = 'translate(-50%, -50%)';
  }

  setJoystickVisible(visible) {
    if (!this.joystickElement) return;
    this.joystickElement.hidden = visible !== true;
  }

  getMovementVector() {
    return { ...this.vector };
  }

  consumeActionPress() {
    const wasPressed = this.actionPressedThisFrame;
    this.actionPressedThisFrame = false;
    return wasPressed;
  }

  consumeAttackPress() {
    const wasPressed = this.attackPressedThisFrame;
    this.attackPressedThisFrame = false;
    return wasPressed;
  }

  consumeFramePresses() {
    this.actionPressedThisFrame = false;
    this.attackPressedThisFrame = false;
  }

  isButtonHeld(action) {
    return Array.from(this.buttonPointers.values()).includes(action);
  }

  getDebugState() {
    return {
      enabled: this.enabled,
      joystickActive: this.joystickPointerId !== null,
      joystickOrigin: this.origin ? { ...this.origin } : null,
      actionPressed: this.isButtonHeld('action'),
      attackPressed: this.isButtonHeld('attack'),
      pointerCount: this.buttonPointers.size + (this.joystickPointerId !== null ? 1 : 0)
    };
  }

  consumeEvent(event) {
    event.preventDefault?.();
    event.stopPropagation?.();
  }
}
