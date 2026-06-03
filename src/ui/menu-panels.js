import {
  HOTBAR_SLOT_COUNT,
  INVENTORY_RESOURCES,
  INVENTORY_TABS,
  RESOURCE_CATEGORIES,
  RESOURCE_ICONS,
  RESOURCE_LABELS,
  RESOURCE_SHORT_LABELS
} from '../config/constants.js';

export class MenuPanels {
  constructor({ inventoryPanel, craftingPanel }) {
    this.inventoryPanel = inventoryPanel;
    this.craftingPanel = craftingPanel;
    this.lastInventoryHtml = '';
    this.lastCraftingHtml = '';
    this.inventoryTab = 'all';
    this.inventoryFilter = '';
    this.selectedCraftingRecipeId = null;

    this.inventoryPanel?.addEventListener?.('input', (event) => {
      if (event.target?.dataset?.inventoryFilter === 'true') {
        this.inventoryFilter = event.target.value || '';
        this.lastInventoryHtml = '';
      }
    });
  }

  update({
    craftingContext = 'normal',
    craftingOpen,
    hotbarSlots = [],
    activeHotbarSlot = 0,
    inventory,
    inventoryOpen,
    recipeStates,
    selectedInventoryResource
  }) {
    this.renderInventory(inventory, inventoryOpen, selectedInventoryResource, hotbarSlots, activeHotbarSlot);
    this.renderCrafting(inventory, craftingOpen, recipeStates, craftingContext);
  }

  selectInventoryTab(tabId) {
    if (!INVENTORY_TABS.some((tab) => tab.id === tabId)) return false;
    this.inventoryTab = tabId;
    this.lastInventoryHtml = '';
    return true;
  }

  setInventoryFilter(value) {
    this.inventoryFilter = value || '';
    this.lastInventoryHtml = '';
  }

  selectCraftingRecipe(recipeId) {
    this.selectedCraftingRecipeId = recipeId;
    this.lastCraftingHtml = '';
  }

  renderInventory(inventory, isOpen, selectedInventoryResource = null, hotbarSlots = [], activeHotbarSlot = 0) {
    if (!this.inventoryPanel) return;
    this.inventoryPanel.hidden = !isOpen;

    if (!isOpen) {
      this.setInventoryHtml('');
      return;
    }

    const tabs = INVENTORY_TABS.map((tab) => `
      <button
        class="menu-tab${this.inventoryTab === tab.id ? ' is-active' : ''}"
        type="button"
        data-inventory-tab="${tab.id}"
        aria-pressed="${this.inventoryTab === tab.id ? 'true' : 'false'}"
      >${tab.label}</button>
    `).join('');
    const rows = this.getFilteredInventoryResources()
      .map((resource) => `
        <button
          class="inventory-slot${selectedInventoryResource === resource ? ' is-selected' : ''}"
          type="button"
          data-inventory-resource="${resource}"
          aria-pressed="${selectedInventoryResource === resource ? 'true' : 'false'}"
        >
          <span class="inventory-slot-icon">${RESOURCE_ICONS[resource]}</span>
          <span class="inventory-slot-name">${RESOURCE_LABELS[resource]}</span>
          <strong class="inventory-slot-count">${inventory.get(resource)}</strong>
        </button>
      `)
      .join('');

    const selectedText = selectedInventoryResource
      ? `${RESOURCE_LABELS[selectedInventoryResource]} ausgewählt`
      : 'Kein Item für Hotbar-Zuweisung ausgewählt';

    this.setInventoryHtml(`
      <div class="menu-frame-title">Inventar</div>
      <div class="menu-tabs">${tabs}</div>
      <label class="menu-search">
        <span>Suche</span>
        <input data-inventory-filter="true" type="search" value="${this.escapeAttribute(this.inventoryFilter)}" placeholder="Filter..." />
      </label>
      <div class="menu-note">${selectedText}</div>
      <div class="inventory-grid">${rows}</div>
      <div class="menu-note">Item anklicken, dann Hotbar-Slot anklicken.</div>
      ${this.renderInventoryHotbar(inventory, hotbarSlots, activeHotbarSlot)}
    `);
  }

  renderInventoryHotbar(inventory, hotbarSlots, activeHotbarSlot) {
    const slots = [];
    for (let index = 0; index < HOTBAR_SLOT_COUNT; index += 1) {
      const resource = hotbarSlots[index] || null;
      const isActive = index === activeHotbarSlot;
      const isEmpty = !resource;
      const icon = isEmpty ? '--' : RESOURCE_ICONS[resource];
      const label = isEmpty ? 'Leer' : RESOURCE_LABELS[resource];
      const shortLabel = isEmpty ? 'Leer' : RESOURCE_SHORT_LABELS[resource];
      const amount = isEmpty ? 0 : inventory.get(resource);
      slots.push(`
        <button
          class="inventory-hotbar-slot${isActive ? ' is-active' : ''}${isEmpty ? ' is-empty' : ''}"
          type="button"
          data-inventory-hotbar-slot="${index}"
          aria-pressed="${isActive ? 'true' : 'false'}"
          aria-label="Hotbar ${index + 1}: ${label}"
        >
          <span class="hotbar-key">${index + 1}</span>
          <span class="hotbar-icon">${icon}</span>
          <span class="hotbar-label">${shortLabel}</span>
          <span class="hotbar-count">${amount}</span>
        </button>
      `);
    }

    return `
      <div class="inventory-hotbar-assignment" aria-label="Hotbar-Zuweisung">
        ${slots.join('')}
      </div>
    `;
  }

  getFilteredInventoryResources() {
    const needle = this.inventoryFilter.trim().toLowerCase();
    return INVENTORY_RESOURCES.filter((resource) => {
      const categories = RESOURCE_CATEGORIES[resource] || [];
      const matchesTab = this.inventoryTab === 'all' || categories.includes(this.inventoryTab);
      const matchesFilter = needle.length === 0 || RESOURCE_LABELS[resource].toLowerCase().includes(needle);
      return matchesTab && matchesFilter;
    });
  }

  renderCrafting(inventory, isOpen, recipeStates, craftingContext) {
    if (!this.craftingPanel) return;
    this.craftingPanel.hidden = !isOpen;

    if (!isOpen) {
      this.setCraftingHtml('');
      return;
    }

    const selectedState = this.getSelectedRecipeState(recipeStates);
    const title = craftingContext === 'workbench' ? 'Werkbank' : 'Crafting';
    const recipes = recipeStates.map((recipeState) => this.renderRecipeListItem(recipeState, selectedState)).join('');
    const detail = selectedState
      ? this.renderRecipeDetail(inventory, selectedState)
      : '<div class="recipe-detail-empty">Keine Rezepte verfügbar.</div>';

    this.setCraftingHtml(`
      <div class="menu-frame-title">${title}</div>
      <div class="crafting-layout">
        <div class="recipe-list">${recipes}</div>
        <div class="recipe-detail">${detail}</div>
      </div>
    `);
  }

  getSelectedRecipeState(recipeStates) {
    if (!recipeStates.length) return null;
    const selected = recipeStates.find((recipeState) => recipeState.recipe.id === this.selectedCraftingRecipeId);
    return selected || recipeStates[0];
  }

  renderRecipeListItem(recipeState, selectedState) {
    const { recipe } = recipeState;
    const isSelected = selectedState?.recipe.id === recipe.id;
    return `
      <button
        class="recipe-list-item${isSelected ? ' is-selected' : ''}${recipeState.canCraft ? '' : ' is-disabled'}"
        type="button"
        data-craft-select="${recipe.id}"
        aria-pressed="${isSelected ? 'true' : 'false'}"
      >
        <span class="menu-icon">${RESOURCE_ICONS[recipe.result]}</span>
        <span>${recipe.name}</span>
      </button>
    `;
  }

  renderRecipeDetail(inventory, recipeState) {
    const { recipe } = recipeState;
    const costs = Object.entries(recipe.costs)
      .map(([resource, amount]) => {
        const available = inventory.get(resource);
        const isMissing = available < amount;
        return `
          <div class="material-card${isMissing ? ' is-missing' : ''}">
            <span class="menu-icon">${RESOURCE_ICONS[resource]}</span>
            <span>${RESOURCE_LABELS[resource]}</span>
            <strong>${available}/${amount}</strong>
          </div>
        `;
      })
      .join('');
    const missingText = recipeState.missing.length > 0
      ? `<div class="menu-note">Fehlt: ${recipeState.missing.map((cost) => `${cost.missing}x ${cost.label}`).join(', ')}</div>`
      : '<div class="menu-note">Alle Materialien verfügbar.</div>';
    const lockedText = recipeState.isAvailable ? '' : '<div class="menu-note">Werkbank benötigt.</div>';

    return `
      <h3>${recipe.name}</h3>
      <div class="recipe-result"><span class="menu-icon">${RESOURCE_ICONS[recipe.result]}</span> ${RESOURCE_LABELS[recipe.result]}</div>
      <div class="material-grid">${costs}</div>
      ${lockedText}
      ${missingText}
      <button class="craft-button" type="button" data-craft="${recipe.id}" ${recipeState.canCraft ? '' : 'disabled'}>
        Herstellen
      </button>
    `;
  }

  escapeAttribute(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  }

  setInventoryHtml(html) {
    if (html !== this.lastInventoryHtml) {
      this.inventoryPanel.innerHTML = html;
      this.lastInventoryHtml = html;
    }
  }

  setCraftingHtml(html) {
    if (html !== this.lastCraftingHtml) {
      this.craftingPanel.innerHTML = html;
      this.lastCraftingHtml = html;
    }
  }
}
