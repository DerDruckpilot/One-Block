export class PointerHitboxSystem {
  constructor({
    canvas,
    craftingButton,
    craftingPanel,
    getCraftingOpen = () => false,
    getInventoryOpen = () => false,
    hotbarElement,
    inventoryButton,
    inventoryPanel,
    onBlockedCraft = () => {},
    onCraftWorkbench = () => {},
    onCraftingToggle = () => {},
    onHotbarSelect = () => {},
    onInventoryToggle = () => {},
    pointerTarget = globalThis.window
  }) {
    this.canvas = canvas;
    this.craftingButton = craftingButton;
    this.craftingPanel = craftingPanel;
    this.getCraftingOpen = getCraftingOpen;
    this.getInventoryOpen = getInventoryOpen;
    this.hotbarElement = hotbarElement;
    this.inventoryButton = inventoryButton;
    this.inventoryPanel = inventoryPanel;
    this.onBlockedCraft = onBlockedCraft;
    this.onCraftWorkbench = onCraftWorkbench;
    this.onCraftingToggle = onCraftingToggle;
    this.onHotbarSelect = onHotbarSelect;
    this.onInventoryToggle = onInventoryToggle;
    this.hitboxes = [];

    pointerTarget?.addEventListener?.('pointerdown', (event) => this.handlePointerDown(event), { capture: true });
  }

  updateHitboxes() {
    this.hitboxes = [
      ...this.getTopMenuHitboxes(),
      ...this.getPanelHitboxes(),
      ...this.getHotbarHitboxes()
    ];
    return this.hitboxes;
  }

  handlePointerDown(event) {
    const point = this.getPointerPoint(event);
    this.updateHitboxes();

    const hitbox = this.hitboxes.find((candidate) => this.contains(candidate.rect, point.clientX, point.clientY));
    if (!hitbox) {
      this.canvas?.focus?.({ preventScroll: true });
      return false;
    }

    this.consumeEvent(event);
    hitbox.action(point);
    return true;
  }

  getPointerPoint(event) {
    const clientX = Number(event.clientX || 0);
    const clientY = Number(event.clientY || 0);
    const canvasPoint = this.clientToCanvasPoint(clientX, clientY);

    return {
      clientX,
      clientY,
      canvasX: canvasPoint.x,
      canvasY: canvasPoint.y,
      devicePixelRatio: canvasPoint.devicePixelRatio
    };
  }

  clientToCanvasPoint(clientX, clientY) {
    const rect = this.canvas?.getBoundingClientRect?.();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return { x: clientX, y: clientY, devicePixelRatio: globalThis.devicePixelRatio || 1 };
    }

    return {
      x: (clientX - rect.left) * (this.canvas.width / rect.width),
      y: (clientY - rect.top) * (this.canvas.height / rect.height),
      devicePixelRatio: globalThis.devicePixelRatio || 1
    };
  }

  getTopMenuHitboxes() {
    return [
      this.createElementHitbox(this.inventoryButton, 'top-inventory', () => this.onInventoryToggle()),
      this.createElementHitbox(this.craftingButton, 'top-crafting', () => this.onCraftingToggle())
    ].filter(Boolean);
  }

  getPanelHitboxes() {
    const hitboxes = [];

    if (this.getCraftingOpen()) {
      const craftButton = this.craftingPanel?.querySelector?.('[data-craft="workbench"]');
      const craftButtonHitbox = this.createElementHitbox(craftButton, 'craft-workbench', () => {
        if (craftButton.disabled) {
          this.onBlockedCraft();
          return;
        }
        this.onCraftWorkbench();
      });
      if (craftButtonHitbox) hitboxes.push(craftButtonHitbox);

      const panelHitbox = this.createElementHitbox(this.craftingPanel, 'crafting-panel', () => {});
      if (panelHitbox) hitboxes.push(panelHitbox);
    }

    if (this.getInventoryOpen()) {
      const panelHitbox = this.createElementHitbox(this.inventoryPanel, 'inventory-panel', () => {});
      if (panelHitbox) hitboxes.push(panelHitbox);
    }

    return hitboxes;
  }

  getHotbarHitboxes() {
    return Array.from(this.hotbarElement?.querySelectorAll?.('[data-resource]') || [])
      .map((element) => this.createElementHitbox(
        element,
        `hotbar-${element.dataset.resource}`,
        () => this.onHotbarSelect(element.dataset.resource)
      ))
      .filter(Boolean);
  }

  createElementHitbox(element, id, action) {
    if (!element || element.hidden) return null;

    const rect = element.getBoundingClientRect?.();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;

    return {
      id,
      element,
      rect: {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom
      },
      action
    };
  }

  contains(rect, x, y) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  consumeEvent(event) {
    event.preventDefault?.();
    event.stopPropagation?.();
  }
}
