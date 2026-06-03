const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export class TouchInput {
  constructor({
    joystickElement = null,
    joystickKnobElement = null,
    actionButton = null,
    attackButton = null
  } = {}) {
    this.joystickElement = joystickElement;
    this.joystickKnobElement = joystickKnobElement;
    this.actionButton = actionButton;
    this.attackButton = attackButton;
    this.joystickPointerId = null;
    this.buttonPointers = new Map();
    this.vector = { x: 0, y: 0 };
    this.actionPressedThisFrame = false;
    this.attackPressedThisFrame = false;

    this.bindJoystick();
    this.bindButton(actionButton, 'action');
    this.bindButton(attackButton, 'attack');
  }

  bindJoystick() {
    this.joystickElement?.addEventListener?.('pointerdown', (event) => {
      if (this.joystickPointerId !== null) return;
      this.consumeEvent(event);
      this.joystickPointerId = event.pointerId;
      this.joystickElement.setPointerCapture?.(event.pointerId);
      this.updateJoystickVector(event);
      this.joystickElement.classList?.add('is-active');
    });

    this.joystickElement?.addEventListener?.('pointermove', (event) => {
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

  bindButton(button, action) {
    button?.addEventListener?.('pointerdown', (event) => {
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

  updateJoystickVector(event) {
    const rect = this.joystickElement?.getBoundingClientRect?.();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      this.vector = { x: 0, y: 0 };
      return;
    }

    const radius = Math.min(rect.width, rect.height) / 2;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
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
    this.vector = { x: 0, y: 0 };
    if (this.joystickKnobElement) {
      this.joystickKnobElement.style.transform = 'translate(-50%, -50%)';
    }
    this.joystickElement?.classList?.remove('is-active');
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
      joystickActive: this.joystickPointerId !== null,
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
