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
    onCraft = () => {},
    onCraftingToggle = () => {},
    onHotbarSelect = () => {},
    onInventoryItemSelect = () => {},
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
    this.onCraft = onCraft;
    this.onCraftingToggle = onCraftingToggle;
    this.onHotbarSelect = onHotbarSelect;
    this.onInventoryItemSelect = onInventoryItemSelect;
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
      for (const craftButton of Array.from(this.craftingPanel?.querySelectorAll?.('[data-craft]') || [])) {
        const craftButtonHitbox = this.createElementHitbox(craftButton, `craft-${craftButton.dataset.craft}`, () => {
          if (craftButton.disabled) {
            this.onBlockedCraft(craftButton.dataset.craft);
            return;
          }
          this.onCraft(craftButton.dataset.craft);
        });
        if (craftButtonHitbox) hitboxes.push(craftButtonHitbox);
      }

      const panelHitbox = this.createElementHitbox(this.craftingPanel, 'crafting-panel', () => {});
      if (panelHitbox) hitboxes.push(panelHitbox);
    }

    if (this.getInventoryOpen()) {
      for (const itemButton of Array.from(this.inventoryPanel?.querySelectorAll?.('[data-inventory-resource]') || [])) {
        const itemHitbox = this.createElementHitbox(itemButton, `inventory-${itemButton.dataset.inventoryResource}`, () => {
          this.onInventoryItemSelect(itemButton.dataset.inventoryResource);
        });
        if (itemHitbox) hitboxes.push(itemHitbox);
      }

      const panelHitbox = this.createElementHitbox(this.inventoryPanel, 'inventory-panel', () => {});
      if (panelHitbox) hitboxes.push(panelHitbox);
    }

    return hitboxes;
  }

  getHotbarHitboxes() {
    return Array.from(this.hotbarElement?.querySelectorAll?.('[data-hotbar-slot]') || [])
      .map((element) => this.createElementHitbox(
        element,
        `hotbar-${element.dataset.hotbarSlot}`,
        () => this.onHotbarSelect(Number(element.dataset.hotbarSlot))
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
