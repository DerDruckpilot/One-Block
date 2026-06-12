export class PointerHitboxSystem {
  constructor({
    buildButton,
    buildPanel,
    canvas,
    cookingPanel,
    craftingButton,
    craftingPanel,
    getCookingOpen = () => false,
    getCraftingOpen = () => false,
    getFurnaceOpen = () => false,
    getSettingsOpen = () => false,
    getInventoryOpen = () => false,
    getBuildOpen = () => false,
    furnacePanel,
    hotbarElement,
    inventoryButton,
    inventoryPanel,
    menuChromeElement = null,
    onBlockedCook = () => {},
    onBlockedCraft = () => {},
    onBlockedFurnace = () => {},
    onBuildItemSelect = () => {},
    onBuildRemoveToggle = () => {},
    onBuildToggle = () => {},
    onCook = () => {},
    onCookSelect = () => {},
    onCraft = () => {},
    onCraftSelect = () => {},
    onCraftingToggle = () => {},
    onFurnace = () => {},
    onFurnaceSelect = () => {},
    onEquipmentSlotSelect = () => {},
    onHandSlotSelect = () => {},
    onHotbarSelect = () => {},
    onInventoryItemSelect = () => {},
    onInventoryTabSelect = () => {},
    onInventoryToggle = () => {},
    onMenuClose = () => {},
    onSettingsDeleteSlot = () => {},
    onSettingsLoadSlot = () => {},
    onSettingsReset = () => {},
    onSettingsSaveSlot = () => {},
    onSettingsToggle = () => {},
    pointerTarget = globalThis.window,
    settingsButton,
    settingsPanel
  }) {
    this.canvas = canvas;
    this.buildButton = buildButton;
    this.buildPanel = buildPanel;
    this.cookingPanel = cookingPanel;
    this.craftingButton = craftingButton;
    this.craftingPanel = craftingPanel;
    this.getCookingOpen = getCookingOpen;
    this.getCraftingOpen = getCraftingOpen;
    this.getFurnaceOpen = getFurnaceOpen;
    this.getSettingsOpen = getSettingsOpen;
    this.getInventoryOpen = getInventoryOpen;
    this.getBuildOpen = getBuildOpen;
    this.furnacePanel = furnacePanel;
    this.hotbarElement = hotbarElement;
    this.inventoryButton = inventoryButton;
    this.inventoryPanel = inventoryPanel;
    this.menuChromeElement = menuChromeElement;
    this.settingsButton = settingsButton;
    this.settingsPanel = settingsPanel;
    this.onBlockedCook = onBlockedCook;
    this.onBlockedCraft = onBlockedCraft;
    this.onBlockedFurnace = onBlockedFurnace;
    this.onBuildItemSelect = onBuildItemSelect;
    this.onBuildRemoveToggle = onBuildRemoveToggle;
    this.onBuildToggle = onBuildToggle;
    this.onCook = onCook;
    this.onCookSelect = onCookSelect;
    this.onCraft = onCraft;
    this.onCraftSelect = onCraftSelect;
    this.onCraftingToggle = onCraftingToggle;
    this.onFurnace = onFurnace;
    this.onFurnaceSelect = onFurnaceSelect;
    this.onEquipmentSlotSelect = onEquipmentSlotSelect;
    this.onHandSlotSelect = onHandSlotSelect;
    this.onHotbarSelect = onHotbarSelect;
    this.onInventoryItemSelect = onInventoryItemSelect;
    this.onInventoryTabSelect = onInventoryTabSelect;
    this.onInventoryToggle = onInventoryToggle;
    this.onMenuClose = onMenuClose;
    this.onSettingsDeleteSlot = onSettingsDeleteSlot;
    this.onSettingsLoadSlot = onSettingsLoadSlot;
    this.onSettingsReset = onSettingsReset;
    this.onSettingsSaveSlot = onSettingsSaveSlot;
    this.onSettingsToggle = onSettingsToggle;
    this.hitboxes = [];
    this.pendingTap = null;
    this.tapMoveThreshold = 8;

    pointerTarget?.addEventListener?.('pointerdown', (event) => this.handlePointerDown(event), { capture: true });
    pointerTarget?.addEventListener?.('pointermove', (event) => this.handlePointerMove(event), { capture: true });
    pointerTarget?.addEventListener?.('pointerup', (event) => this.handlePointerUp(event), { capture: true });
    pointerTarget?.addEventListener?.('pointercancel', (event) => this.cancelPendingTap(event), { capture: true });
  }

  getCloseButtons(panel, menuId) {
    const panelButtons = Array.from(panel?.querySelectorAll?.('[data-menu-close]') || []);
    const chromeButtons = Array.from(this.menuChromeElement?.querySelectorAll?.(`[data-menu-close="${menuId}"]`) || []);
    return [...panelButtons, ...chromeButtons];
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

    if (hitbox.deferTap) {
      hitbox.element?.setPointerCapture?.(event.pointerId);
      this.pendingTap = {
        hitbox,
        pointerId: event.pointerId,
        startX: point.clientX,
        startY: point.clientY,
        moved: false
      };
      return true;
    }

    if (hitbox.consume !== false) {
      this.consumeEvent(event);
    }
    hitbox.action(point);
    return true;
  }

  handlePointerMove(event) {
    if (!this.pendingTap || this.pendingTap.pointerId !== event.pointerId) return false;
    const point = this.getPointerPoint(event);
    const distance = Math.hypot(point.clientX - this.pendingTap.startX, point.clientY - this.pendingTap.startY);
    if (distance > this.tapMoveThreshold) {
      this.pendingTap.moved = true;
    }
    return false;
  }

  handlePointerUp(event) {
    if (!this.pendingTap || this.pendingTap.pointerId !== event.pointerId) return false;

    const pending = this.pendingTap;
    this.pendingTap = null;
    pending.hitbox.element?.releasePointerCapture?.(event.pointerId);
    if (pending.moved) return false;

    const point = this.getPointerPoint(event);
    if (!this.contains(pending.hitbox.rect, point.clientX, point.clientY)) return false;

    if (pending.hitbox.consume !== false) {
      this.consumeEvent(event);
    }
    pending.hitbox.action(point);
    return true;
  }

  cancelPendingTap(event) {
    if (!this.pendingTap || this.pendingTap.pointerId === event.pointerId) {
      this.pendingTap?.hitbox?.element?.releasePointerCapture?.(event.pointerId);
      this.pendingTap = null;
    }
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
      this.createElementHitbox(this.craftingButton, 'top-crafting', () => this.onCraftingToggle()),
      this.createElementHitbox(this.settingsButton, 'top-settings', () => this.onSettingsToggle())
    ].filter(Boolean);
  }

  getPanelHitboxes() {
    const hitboxes = [];

    if (this.getCraftingOpen()) {
      for (const closeButton of this.getCloseButtons(this.craftingPanel, 'crafting')) {
        if (!closeButton.dataset.menuClose) continue;
        const closeHitbox = this.createElementHitbox(closeButton, 'close-crafting', () => this.onMenuClose(closeButton.dataset.menuClose));
        if (closeHitbox) hitboxes.push(closeHitbox);
      }

      for (const craftButton of Array.from(this.craftingPanel?.querySelectorAll?.('[data-craft]') || [])) {
        if (!craftButton.dataset.craft) continue;
        const craftButtonHitbox = this.createElementHitbox(craftButton, `craft-${craftButton.dataset.craft}`, () => {
          if (craftButton.disabled) {
            this.onBlockedCraft(craftButton.dataset.craft);
            return;
          }
          this.onCraft(craftButton.dataset.craft);
        }, { deferTap: true });
        if (craftButtonHitbox) hitboxes.push(craftButtonHitbox);
      }

      for (const recipeButton of Array.from(this.craftingPanel?.querySelectorAll?.('[data-craft-select]') || [])) {
        if (!recipeButton.dataset.craftSelect) continue;
        const recipeHitbox = this.createElementHitbox(recipeButton, `recipe-${recipeButton.dataset.craftSelect}`, () => {
          this.onCraftSelect(recipeButton.dataset.craftSelect);
        }, { deferTap: true });
        if (recipeHitbox) hitboxes.push(recipeHitbox);
      }

      const panelHitbox = this.createElementHitbox(this.craftingPanel, 'crafting-panel', () => {}, { consume: false });
      if (panelHitbox) hitboxes.push(panelHitbox);
    }

    if (this.getCookingOpen()) {
      for (const closeButton of this.getCloseButtons(this.cookingPanel, 'cooking')) {
        if (!closeButton.dataset.menuClose) continue;
        const closeHitbox = this.createElementHitbox(closeButton, 'close-cooking', () => this.onMenuClose(closeButton.dataset.menuClose));
        if (closeHitbox) hitboxes.push(closeHitbox);
      }

      for (const cookButton of Array.from(this.cookingPanel?.querySelectorAll?.('[data-cook]') || [])) {
        if (!cookButton.dataset.cook) continue;
        const cookButtonHitbox = this.createElementHitbox(cookButton, `cook-${cookButton.dataset.cook}`, () => {
          if (cookButton.disabled) {
            this.onBlockedCook(cookButton.dataset.cook);
            return;
          }
          this.onCook(cookButton.dataset.cook);
        }, { deferTap: true });
        if (cookButtonHitbox) hitboxes.push(cookButtonHitbox);
      }

      for (const recipeButton of Array.from(this.cookingPanel?.querySelectorAll?.('[data-cook-select]') || [])) {
        if (!recipeButton.dataset.cookSelect) continue;
        const recipeHitbox = this.createElementHitbox(recipeButton, `cook-recipe-${recipeButton.dataset.cookSelect}`, () => {
          this.onCookSelect(recipeButton.dataset.cookSelect);
        }, { deferTap: true });
        if (recipeHitbox) hitboxes.push(recipeHitbox);
      }

      const panelHitbox = this.createElementHitbox(this.cookingPanel, 'cooking-panel', () => {}, { consume: false });
      if (panelHitbox) hitboxes.push(panelHitbox);
    }

    if (this.getFurnaceOpen()) {
      for (const closeButton of this.getCloseButtons(this.furnacePanel, 'furnace')) {
        if (!closeButton.dataset.menuClose) continue;
        const closeHitbox = this.createElementHitbox(closeButton, 'close-furnace', () => this.onMenuClose(closeButton.dataset.menuClose));
        if (closeHitbox) hitboxes.push(closeHitbox);
      }

      for (const furnaceButton of Array.from(this.furnacePanel?.querySelectorAll?.('[data-furnace]') || [])) {
        if (!furnaceButton.dataset.furnace) continue;
        const furnaceButtonHitbox = this.createElementHitbox(furnaceButton, `furnace-${furnaceButton.dataset.furnace}`, () => {
          if (furnaceButton.disabled) {
            this.onBlockedFurnace(furnaceButton.dataset.furnace);
            return;
          }
          this.onFurnace(furnaceButton.dataset.furnace);
        }, { deferTap: true });
        if (furnaceButtonHitbox) hitboxes.push(furnaceButtonHitbox);
      }

      for (const recipeButton of Array.from(this.furnacePanel?.querySelectorAll?.('[data-furnace-select]') || [])) {
        if (!recipeButton.dataset.furnaceSelect) continue;
        const recipeHitbox = this.createElementHitbox(recipeButton, `furnace-recipe-${recipeButton.dataset.furnaceSelect}`, () => {
          this.onFurnaceSelect(recipeButton.dataset.furnaceSelect);
        }, { deferTap: true });
        if (recipeHitbox) hitboxes.push(recipeHitbox);
      }

      const panelHitbox = this.createElementHitbox(this.furnacePanel, 'furnace-panel', () => {}, { consume: false });
      if (panelHitbox) hitboxes.push(panelHitbox);
    }

    if (this.getInventoryOpen()) {
      for (const closeButton of this.getCloseButtons(this.inventoryPanel, 'inventory')) {
        if (!closeButton.dataset.menuClose) continue;
        const closeHitbox = this.createElementHitbox(closeButton, 'close-inventory', () => this.onMenuClose(closeButton.dataset.menuClose));
        if (closeHitbox) hitboxes.push(closeHitbox);
      }

      for (const tabButton of Array.from(this.inventoryPanel?.querySelectorAll?.('[data-inventory-tab]') || [])) {
        if (!tabButton.dataset.inventoryTab) continue;
        const tabHitbox = this.createElementHitbox(tabButton, `inventory-tab-${tabButton.dataset.inventoryTab}`, () => {
          this.onInventoryTabSelect(tabButton.dataset.inventoryTab);
        }, { deferTap: true });
        if (tabHitbox) hitboxes.push(tabHitbox);
      }

      for (const itemButton of Array.from(this.inventoryPanel?.querySelectorAll?.('[data-inventory-resource]') || [])) {
        if (!itemButton.dataset.inventoryResource) continue;
        const itemHitbox = this.createElementHitbox(itemButton, `inventory-${itemButton.dataset.inventoryResource}`, () => {
          this.onInventoryItemSelect(itemButton.dataset.inventoryResource);
        }, { deferTap: true });
        if (itemHitbox) hitboxes.push(itemHitbox);
      }

      for (const handSlot of Array.from(this.inventoryPanel?.querySelectorAll?.('[data-hand-slot]') || [])) {
        const handHitbox = this.createElementHitbox(handSlot, 'inventory-hand-slot', () => {
          this.onHandSlotSelect();
        });
        if (handHitbox) hitboxes.push(handHitbox);
      }

      for (const equipmentSlot of Array.from(this.inventoryPanel?.querySelectorAll?.('[data-equipment-slot]') || [])) {
        if (!equipmentSlot.dataset.equipmentSlot) continue;
        const equipmentHitbox = this.createElementHitbox(equipmentSlot, `inventory-equipment-${equipmentSlot.dataset.equipmentSlot}`, () => {
          this.onEquipmentSlotSelect(equipmentSlot.dataset.equipmentSlot);
        });
        if (equipmentHitbox) hitboxes.push(equipmentHitbox);
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
      for (const closeButton of this.getCloseButtons(this.buildPanel, 'build')) {
        if (!closeButton.dataset.menuClose) continue;
        const closeHitbox = this.createElementHitbox(closeButton, 'close-build', () => this.onMenuClose(closeButton.dataset.menuClose));
        if (closeHitbox) hitboxes.push(closeHitbox);
      }

      for (const buildButton of Array.from(this.buildPanel?.querySelectorAll?.('[data-build-resource]') || [])) {
        if (!buildButton.dataset.buildResource) continue;
        const buildHitbox = this.createElementHitbox(buildButton, `build-${buildButton.dataset.buildResource}`, () => {
          this.onBuildItemSelect(buildButton.dataset.buildResource);
        }, { deferTap: true });
        if (buildHitbox) hitboxes.push(buildHitbox);
      }

      for (const removeButton of Array.from(this.buildPanel?.querySelectorAll?.('[data-build-remove]') || [])) {
        const removeHitbox = this.createElementHitbox(removeButton, 'build-remove', () => {
          this.onBuildRemoveToggle();
        }, { deferTap: true });
        if (removeHitbox) hitboxes.push(removeHitbox);
      }

      const panelHitbox = this.createElementHitbox(this.buildPanel, 'build-panel', () => {}, { consume: false });
      if (panelHitbox) hitboxes.push(panelHitbox);
    }

    if (this.getSettingsOpen()) {
      for (const closeButton of this.getCloseButtons(this.settingsPanel, 'settings')) {
        if (!closeButton.dataset.menuClose) continue;
        const closeHitbox = this.createElementHitbox(closeButton, 'close-settings', () => this.onMenuClose(closeButton.dataset.menuClose));
        if (closeHitbox) hitboxes.push(closeHitbox);
      }

      for (const saveButton of Array.from(this.settingsPanel?.querySelectorAll?.('[data-save-slot]') || [])) {
        const saveHitbox = this.createElementHitbox(saveButton, `save-slot-${saveButton.dataset.saveSlot}`, () => {
          this.onSettingsSaveSlot(Number(saveButton.dataset.saveSlot));
        }, { deferTap: true });
        if (saveHitbox) hitboxes.push(saveHitbox);
      }

      for (const loadButton of Array.from(this.settingsPanel?.querySelectorAll?.('[data-load-slot]') || [])) {
        const loadHitbox = this.createElementHitbox(loadButton, `load-slot-${loadButton.dataset.loadSlot}`, () => {
          if (!loadButton.disabled) this.onSettingsLoadSlot(Number(loadButton.dataset.loadSlot));
        }, { deferTap: true });
        if (loadHitbox) hitboxes.push(loadHitbox);
      }

      for (const deleteButton of Array.from(this.settingsPanel?.querySelectorAll?.('[data-delete-slot]') || [])) {
        const deleteHitbox = this.createElementHitbox(deleteButton, `delete-slot-${deleteButton.dataset.deleteSlot}`, () => {
          if (!deleteButton.disabled) this.onSettingsDeleteSlot(Number(deleteButton.dataset.deleteSlot));
        }, { deferTap: true });
        if (deleteHitbox) hitboxes.push(deleteHitbox);
      }

      for (const resetButton of Array.from(this.settingsPanel?.querySelectorAll?.('[data-settings-reset]') || [])) {
        const resetHitbox = this.createElementHitbox(resetButton, 'settings-reset', () => this.onSettingsReset(), { deferTap: true });
        if (resetHitbox) hitboxes.push(resetHitbox);
      }

      const panelHitbox = this.createElementHitbox(this.settingsPanel, 'settings-panel', () => {}, { consume: false });
      if (panelHitbox) hitboxes.push(panelHitbox);
    }

    return hitboxes;
  }

  getHotbarHitboxes() {
    if (this.getCraftingOpen() || this.getBuildOpen() || this.getCookingOpen() || this.getFurnaceOpen() || this.getSettingsOpen()) return [];

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
      consume: options.consume,
      deferTap: options.deferTap === true
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
