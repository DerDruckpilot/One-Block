export class PointerHitboxSystem {
  constructor({
    buildButton,
    buildPanel,
    canvas,
    craftingButton,
    craftingPanel,
    getCraftingOpen = () => false,
    getInventoryOpen = () => false,
    getBuildOpen = () => false,
    hotbarElement,
    inventoryButton,
    inventoryPanel,
    onBlockedCraft = () => {},
    onBuildItemSelect = () => {},
    onBuildRemoveToggle = () => {},
    onBuildToggle = () => {},
    onCraft = () => {},
    onCraftSelect = () => {},
    onCraftingToggle = () => {},
    onHotbarSelect = () => {},
    onInventoryItemSelect = () => {},
    onInventoryTabSelect = () => {},
    onInventoryToggle = () => {},
    pointerTarget = globalThis.window
  }) {
    this.canvas = canvas;
    this.buildButton = buildButton;
    this.buildPanel = buildPanel;
    this.craftingButton = craftingButton;
    this.craftingPanel = craftingPanel;
    this.getCraftingOpen = getCraftingOpen;
    this.getInventoryOpen = getInventoryOpen;
    this.getBuildOpen = getBuildOpen;
    this.hotbarElement = hotbarElement;
    this.inventoryButton = inventoryButton;
    this.inventoryPanel = inventoryPanel;
    this.onBlockedCraft = onBlockedCraft;
    this.onBuildItemSelect = onBuildItemSelect;
    this.onBuildRemoveToggle = onBuildRemoveToggle;
    this.onBuildToggle = onBuildToggle;
    this.onCraft = onCraft;
    this.onCraftSelect = onCraftSelect;
    this.onCraftingToggle = onCraftingToggle;
    this.onHotbarSelect = onHotbarSelect;
    this.onInventoryItemSelect = onInventoryItemSelect;
    this.onInventoryTabSelect = onInventoryTabSelect;
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
    if (event.target?.matches?.('input, textarea')) {
      return false;
    }

    const point = this.getPointerPoint(event);
    this.updateHitboxes();

    const hitbox = this.hitboxes.find((candidate) => this.contains(candidate.rect, point.clientX, point.clientY));
    if (!hitbox) {
      this.canvas?.focus?.({ preventScroll: true });
      return false;
    }

    if (hitbox.consume !== false) {
      this.consumeEvent(event);
    }
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

    const logicalWidth = Number(this.canvas?.dataset?.logicalWidth || this.canvas.width);
    const logicalHeight = Number(this.canvas?.dataset?.logicalHeight || this.canvas.height);

    return {
      x: (clientX - rect.left) * (logicalWidth / rect.width),
      y: (clientY - rect.top) * (logicalHeight / rect.height),
      devicePixelRatio: globalThis.devicePixelRatio || 1
    };
  }

  getTopMenuHitboxes() {
    return [
      this.createElementHitbox(this.buildButton, 'top-build', () => this.onBuildToggle()),
      this.createElementHitbox(this.inventoryButton, 'top-inventory', () => this.onInventoryToggle()),
      this.createElementHitbox(this.craftingButton, 'top-crafting', () => this.onCraftingToggle())
    ].filter(Boolean);
  }

  getPanelHitboxes() {
    const hitboxes = [];

    if (this.getCraftingOpen()) {
      for (const craftButton of Array.from(this.craftingPanel?.querySelectorAll?.('[data-craft]') || [])) {
        if (!craftButton.dataset.craft) continue;
        const craftButtonHitbox = this.createElementHitbox(craftButton, `craft-${craftButton.dataset.craft}`, () => {
          if (craftButton.disabled) {
            this.onBlockedCraft(craftButton.dataset.craft);
            return;
          }
          this.onCraft(craftButton.dataset.craft);
        });
        if (craftButtonHitbox) hitboxes.push(craftButtonHitbox);
      }

      for (const recipeButton of Array.from(this.craftingPanel?.querySelectorAll?.('[data-craft-select]') || [])) {
        if (!recipeButton.dataset.craftSelect) continue;
        const recipeHitbox = this.createElementHitbox(recipeButton, `recipe-${recipeButton.dataset.craftSelect}`, () => {
          this.onCraftSelect(recipeButton.dataset.craftSelect);
        });
        if (recipeHitbox) hitboxes.push(recipeHitbox);
      }

      const panelHitbox = this.createElementHitbox(this.craftingPanel, 'crafting-panel', () => {}, { consume: false });
      if (panelHitbox) hitboxes.push(panelHitbox);
    }

    if (this.getInventoryOpen()) {
      for (const tabButton of Array.from(this.inventoryPanel?.querySelectorAll?.('[data-inventory-tab]') || [])) {
        if (!tabButton.dataset.inventoryTab) continue;
        const tabHitbox = this.createElementHitbox(tabButton, `inventory-tab-${tabButton.dataset.inventoryTab}`, () => {
          this.onInventoryTabSelect(tabButton.dataset.inventoryTab);
        });
        if (tabHitbox) hitboxes.push(tabHitbox);
      }

      for (const itemButton of Array.from(this.inventoryPanel?.querySelectorAll?.('[data-inventory-resource]') || [])) {
        if (!itemButton.dataset.inventoryResource) continue;
        const itemHitbox = this.createElementHitbox(itemButton, `inventory-${itemButton.dataset.inventoryResource}`, () => {
          this.onInventoryItemSelect(itemButton.dataset.inventoryResource);
        });
        if (itemHitbox) hitboxes.push(itemHitbox);
      }

      for (const hotbarSlot of Array.from(this.inventoryPanel?.querySelectorAll?.('[data-inventory-hotbar-slot]') || [])) {
        if (hotbarSlot.dataset.inventoryHotbarSlot === undefined) continue;
        const hotbarHitbox = this.createElementHitbox(hotbarSlot, `inventory-hotbar-${hotbarSlot.dataset.inventoryHotbarSlot}`, () => {
          this.onHotbarSelect(Number(hotbarSlot.dataset.inventoryHotbarSlot));
        });
        if (hotbarHitbox) hitboxes.push(hotbarHitbox);
      }

      const panelHitbox = this.createElementHitbox(this.inventoryPanel, 'inventory-panel', () => {}, { consume: false });
      if (panelHitbox) hitboxes.push(panelHitbox);
    }

    if (this.getBuildOpen()) {
      for (const buildButton of Array.from(this.buildPanel?.querySelectorAll?.('[data-build-resource]') || [])) {
        if (!buildButton.dataset.buildResource) continue;
        const buildHitbox = this.createElementHitbox(buildButton, `build-${buildButton.dataset.buildResource}`, () => {
          this.onBuildItemSelect(buildButton.dataset.buildResource);
        });
        if (buildHitbox) hitboxes.push(buildHitbox);
      }

      for (const removeButton of Array.from(this.buildPanel?.querySelectorAll?.('[data-build-remove]') || [])) {
        const removeHitbox = this.createElementHitbox(removeButton, 'build-remove', () => {
          this.onBuildRemoveToggle();
        });
        if (removeHitbox) hitboxes.push(removeHitbox);
      }

      const panelHitbox = this.createElementHitbox(this.buildPanel, 'build-panel', () => {}, { consume: false });
      if (panelHitbox) hitboxes.push(panelHitbox);
    }

    return hitboxes;
  }

  getHotbarHitboxes() {
    if (this.getInventoryOpen() || this.getCraftingOpen() || this.getBuildOpen()) return [];

    return Array.from(this.hotbarElement?.querySelectorAll?.('[data-hotbar-slot]') || [])
      .map((element) => this.createElementHitbox(
        element,
        `hotbar-${element.dataset.hotbarSlot}`,
        () => this.onHotbarSelect(Number(element.dataset.hotbarSlot))
      ))
      .filter(Boolean);
  }

  createElementHitbox(element, id, action, options = {}) {
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
      action,
      consume: options.consume
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
