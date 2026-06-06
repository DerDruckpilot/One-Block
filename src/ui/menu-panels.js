import {
  BUILD_MENU_CATEGORIES,
  HOTBAR_SLOT_COUNT,
  INVENTORY_RESOURCES,
  INVENTORY_TABS,
  RESOURCE_CATEGORIES,
  RESOURCE_LABELS,
  RESOURCE_SHORT_LABELS
} from '../config/constants.js';
import { renderItemIcon } from './item-icons.js';

export class MenuPanels {
  constructor({ inventoryPanel, craftingPanel, buildPanel, cookingPanel, furnacePanel, settingsPanel }) {
    this.inventoryPanel = inventoryPanel;
    this.craftingPanel = craftingPanel;
    this.buildPanel = buildPanel;
    this.cookingPanel = cookingPanel;
    this.furnacePanel = furnacePanel;
    this.settingsPanel = settingsPanel;
    this.lastInventoryHtml = '';
    this.lastCraftingHtml = '';
    this.lastBuildHtml = '';
    this.lastCookingHtml = '';
    this.lastFurnaceHtml = '';
    this.lastSettingsHtml = '';
    this.inventoryTab = 'all';
    this.inventoryFilter = '';
    this.selectedCraftingRecipeId = null;
    this.selectedCookingRecipeId = null;
    this.selectedFurnaceRecipeId = null;
    this.craftingScrollTop = {
      normal: 0,
      workbench: 0,
      cooking: 0,
      furnace: 0
    };

    this.inventoryPanel?.addEventListener?.('input', (event) => {
      if (event.target?.dataset?.inventoryFilter === 'true') {
        this.inventoryFilter = event.target.value || '';
        this.lastInventoryHtml = '';
      }
    });
  }

  update({
    buildOpen = false,
    buildRemoveMode = false,
    buildSelectedResource = null,
    cookingOpen = false,
    cookingRecipeStates = [],
    craftingContext = 'normal',
    craftingOpen,
    furnaceOpen = false,
    furnaceRecipeStates = [],
    hotbarSlots = [],
    handItem = null,
    activeHotbarSlot = 0,
    inventory,
    inventoryOpen,
    recipeStates,
    selectedInventoryResource,
    settingsOpen = false,
    saveSlots = []
  }) {
    this.renderInventory(inventory, inventoryOpen, selectedInventoryResource, hotbarSlots, activeHotbarSlot, handItem);
    this.renderCrafting(inventory, craftingOpen, recipeStates, craftingContext);
    this.renderCooking(inventory, cookingOpen, cookingRecipeStates);
    this.renderFurnace(inventory, furnaceOpen, furnaceRecipeStates);
    this.renderBuildMenu(inventory, buildOpen, buildSelectedResource, buildRemoveMode);
    this.renderSettings(settingsOpen, saveSlots);
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

  selectCookingRecipe(recipeId) {
    this.selectedCookingRecipeId = recipeId;
    this.lastCookingHtml = '';
  }

  selectFurnaceRecipe(recipeId) {
    this.selectedFurnaceRecipeId = recipeId;
    this.lastFurnaceHtml = '';
  }

  renderCloseButton(menuId) {
    return `<button class="menu-close-button" type="button" data-menu-close="${menuId}" aria-label="Menue schliessen">x</button>`;
  }

  renderInventory(inventory, isOpen, selectedInventoryResource = null, hotbarSlots = [], activeHotbarSlot = 0, handItem = null) {
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
          <span class="inventory-slot-icon">${renderItemIcon(resource)}</span>
          <span class="inventory-slot-name">${RESOURCE_LABELS[resource]}</span>
          <strong class="inventory-slot-count">${inventory.get(resource)}</strong>
        </button>
      `)
      .join('');

    const selectedText = selectedInventoryResource
      ? `${RESOURCE_LABELS[selectedInventoryResource]} ausgewählt`
      : 'Kein Item fuer Hotbar-Zuweisung ausgewaehlt';

    this.setInventoryHtml(`
      ${this.renderCloseButton('inventory')}
      <div class="menu-frame-title inventory-title">Inventar</div>
      <div class="inventory-layout">
        <aside class="inventory-character-panel">
          <div class="inventory-character-name">Abenteurer</div>
          <div class="inventory-equipment-grid">
            <button
              class="equipment-slot hand-slot${handItem ? '' : ' is-empty'}"
              type="button"
              data-hand-slot="true"
              aria-label="Hand-Slot"
            >
              <span class="equipment-label">Hand</span>
              ${handItem ? renderItemIcon(handItem, 'equipment-icon item-pixel-icon') : '<span class="equipment-icon item-pixel-icon item-icon-fallback">--</span>'}
              <strong>${handItem ? RESOURCE_LABELS[handItem] : 'Leer'}</strong>
            </button>
            <div class="equipment-slot equipment-slot-placeholder equip-clothing" aria-hidden="true">
              <span class="equipment-label">Kleidung</span>
              <span class="equipment-icon equipment-placeholder-icon">T</span>
            </div>
            <div class="inventory-character-scene" aria-hidden="true">
              <div class="inventory-character-sprite">
                <span class="character-hair"></span>
                <span class="character-face"></span>
                <span class="character-shirt"></span>
                <span class="character-legs"></span>
              </div>
              <div class="character-island">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div class="equipment-slot equipment-slot-placeholder equip-jewelry" aria-hidden="true">
              <span class="equipment-label">Schmuck</span>
              <span class="equipment-icon equipment-placeholder-icon">o</span>
            </div>
            <div class="equipment-slot equipment-slot-placeholder equip-offhand" aria-hidden="true">
              <span class="equipment-label">Nebenhand</span>
              <span class="equipment-icon equipment-placeholder-icon">O</span>
            </div>
            <div class="equipment-slot equipment-slot-placeholder equip-shoes" aria-hidden="true">
              <span class="equipment-label">Schuhe</span>
              <span class="equipment-icon equipment-placeholder-icon">U</span>
            </div>
          </div>
          <div class="inventory-character-stats" aria-hidden="true">
            <span><strong>Gesundheit</strong><i class="stat-bar stat-health"></i></span>
            <span><strong>Ausdauer</strong><i class="stat-bar stat-stamina"></i></span>
            <span><strong>Angriff</strong><b>10</b></span>
            <span><strong>Bewegung</strong><b>100%</b></span>
          </div>
        </aside>
        <section class="inventory-items-panel">
          <div class="inventory-tabs-row">
            <div class="menu-tabs">${tabs}</div>
          </div>
          <div class="inventory-search-row">
            <label class="menu-search">
              <span>Suche</span>
              <input data-inventory-filter="true" type="search" value="${this.escapeAttribute(this.inventoryFilter)}" placeholder="Filter..." />
            </label>
            <span class="inventory-filter-button" aria-hidden="true">v</span>
          </div>
          <div class="menu-note">${selectedText}</div>
          <div class="inventory-grid">${rows}</div>
        </section>
      </div>
      <div class="inventory-hotbar-dock">
        <div class="inventory-hotbar-title">Schnellleiste</div>
        <div class="menu-note">Item anklicken, dann Hand-Slot oder Hotbar-Slot anklicken.</div>
        ${this.renderInventoryHotbar(inventory, hotbarSlots, activeHotbarSlot)}
      </div>
    `);
  }

  renderInventoryHotbar(inventory, hotbarSlots, activeHotbarSlot) {
    const slots = [];
    for (let index = 0; index < HOTBAR_SLOT_COUNT; index += 1) {
      const resource = hotbarSlots[index] || null;
      const isActive = index === activeHotbarSlot;
      const isEmpty = !resource;
      const icon = isEmpty ? '<span class="item-pixel-icon item-icon-fallback">--</span>' : renderItemIcon(resource);
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

    const selectedState = this.getSelectedRecipeState(recipeStates, this.selectedCraftingRecipeId);
    const title = craftingContext === 'workbench' ? 'Werkbank' : 'Crafting';
    const recipes = recipeStates.map((recipeState) => this.renderRecipeListItem(recipeState, selectedState, 'craft-select')).join('');
    const detail = selectedState
      ? this.renderRecipeDetail(inventory, selectedState)
      : '<div class="recipe-detail-empty">Keine Rezepte verfuegbar.</div>';

    this.setCraftingHtml(`
      ${this.renderCloseButton('crafting')}
      <div class="menu-frame-title">${title}</div>
      <div class="crafting-layout">
        <div class="recipe-list" data-craft-scroll="${craftingContext}">${recipes}</div>
        <div class="recipe-detail">${detail}</div>
      </div>
    `);
  }

  renderCooking(inventory, isOpen, recipeStates) {
    if (!this.cookingPanel) return;
    this.cookingPanel.hidden = !isOpen;

    if (!isOpen) {
      this.setCookingHtml('');
      return;
    }

    const selectedState = this.getSelectedRecipeState(recipeStates, this.selectedCookingRecipeId);
    const recipes = recipeStates.map((recipeState) => this.renderRecipeListItem(recipeState, selectedState, 'cook-select')).join('');
    const detail = selectedState
      ? this.renderRecipeDetail(inventory, selectedState, { buttonLabel: 'Kochen', buttonDataset: 'cook' })
      : '<div class="recipe-detail-empty">Keine Kochrezepte verfuegbar.</div>';

    this.setCookingHtml(`
      ${this.renderCloseButton('cooking')}
      <div class="menu-frame-title">Kochen</div>
      <div class="crafting-layout">
        <div class="recipe-list" data-craft-scroll="cooking">${recipes}</div>
        <div class="recipe-detail">${detail}</div>
      </div>
    `);
  }

  renderFurnace(inventory, isOpen, recipeStates) {
    if (!this.furnacePanel) return;
    this.furnacePanel.hidden = !isOpen;

    if (!isOpen) {
      this.setFurnaceHtml('');
      return;
    }

    const selectedState = this.getSelectedRecipeState(recipeStates, this.selectedFurnaceRecipeId);
    const recipes = recipeStates.map((recipeState) => this.renderRecipeListItem(recipeState, selectedState, 'furnace-select')).join('');
    const detail = selectedState
      ? this.renderRecipeDetail(inventory, selectedState, { buttonLabel: 'Brennen', buttonDataset: 'furnace' })
      : '<div class="recipe-detail-empty">Keine Ofenrezepte verfuegbar.</div>';

    this.setFurnaceHtml(`
      ${this.renderCloseButton('furnace')}
      <div class="menu-frame-title">Ofen</div>
      <div class="crafting-layout">
        <div class="recipe-list" data-craft-scroll="furnace">${recipes}</div>
        <div class="recipe-detail">${detail}</div>
      </div>
    `);
  }

  getSelectedRecipeState(recipeStates, selectedRecipeId = null) {
    if (!recipeStates.length) return null;
    const selected = recipeStates.find((recipeState) => recipeState.recipe.id === selectedRecipeId);
    return selected || recipeStates[0];
  }

  renderRecipeListItem(recipeState, selectedState, dataset = 'craft-select') {
    const { recipe } = recipeState;
    const isSelected = selectedState?.recipe.id === recipe.id;
    return `
      <button
        class="recipe-list-item${isSelected ? ' is-selected' : ''}${recipeState.canCraft ? '' : ' is-disabled'}"
        type="button"
        data-${dataset}="${recipe.id}"
        aria-pressed="${isSelected ? 'true' : 'false'}"
      >
        <span class="menu-icon">${renderItemIcon(recipe.result)}</span>
        <span>${recipe.name}</span>
      </button>
    `;
  }

  renderRecipeDetail(inventory, recipeState, { buttonLabel = 'Herstellen', buttonDataset = 'craft' } = {}) {
    const { recipe } = recipeState;
    const costs = Object.entries(recipe.costs)
      .map(([resource, amount]) => {
        const available = inventory.get(resource);
        const isMissing = available < amount;
        return `
          <div class="material-card${isMissing ? ' is-missing' : ''}">
            <span class="menu-icon">${renderItemIcon(resource)}</span>
            <span>${RESOURCE_LABELS[resource]}</span>
            <strong>${available}/${amount}</strong>
          </div>
        `;
      })
      .join('');
    const missingText = recipeState.missing.length > 0
      ? `<div class="menu-note">Fehlt: ${recipeState.missing.map((cost) => `${cost.missing}x ${cost.label}`).join(', ')}</div>`
      : '<div class="menu-note">Alle Materialien verfuegbar.</div>';
    const lockedText = recipeState.isAvailable ? '' : '<div class="menu-note">Werkbank benoetigt.</div>';

    return `
      <h3>${recipe.name}</h3>
      <div class="recipe-result"><span class="menu-icon">${renderItemIcon(recipe.result)}</span> ${RESOURCE_LABELS[recipe.result]}</div>
      <div class="material-grid">${costs}</div>
      ${lockedText}
      ${missingText}
      <button class="craft-button" type="button" data-${buttonDataset}="${recipe.id}" ${recipeState.canCraft ? '' : 'disabled'}>
        ${buttonLabel}
      </button>
    `;
  }

  renderBuildMenu(inventory, isOpen, selectedResource = null, removeMode = false) {
    if (!this.buildPanel) return;
    this.buildPanel.hidden = !isOpen;

    if (!isOpen) {
      this.setBuildHtml('');
      return;
    }

    const categories = BUILD_MENU_CATEGORIES.map((category) => {
      const rows = category.resources.map((resource) => {
        const amount = inventory.get(resource);
        const isSelected = selectedResource === resource && !removeMode;
        return `
          <button
            class="build-menu-item${isSelected ? ' is-selected' : ''}${amount <= 0 ? ' is-empty' : ''}"
            type="button"
            data-build-resource="${resource}"
            aria-pressed="${isSelected ? 'true' : 'false'}"
          >
            <span class="menu-icon">${renderItemIcon(resource)}</span>
            <span>${RESOURCE_LABELS[resource]}</span>
            <strong>${amount}</strong>
          </button>
        `;
      }).join('');
      return `
        <section class="build-menu-category">
          <h3>${category.label}</h3>
          <div class="build-menu-grid">${rows}</div>
        </section>
      `;
    }).join('');

    this.setBuildHtml(`
      ${this.renderCloseButton('build')}
      <div class="menu-frame-title">Bauen</div>
      <button
        class="build-remove-toggle${removeMode ? ' is-selected' : ''}"
        type="button"
        data-build-remove="true"
        aria-pressed="${removeMode ? 'true' : 'false'}"
      >Entfernen</button>
      <div class="menu-note">${removeMode ? 'Entfernen aktiv: Ziel markieren und Aktion druecken.' : 'Item waehlen, dann mit B oder Aktion platzieren.'}</div>
      <div class="build-menu-scroll">${categories}</div>
    `);
  }

  renderSettings(isOpen, saveSlots = []) {
    if (!this.settingsPanel) return;
    this.settingsPanel.hidden = !isOpen;

    if (!isOpen) {
      this.setSettingsHtml('');
      return;
    }

    const rows = saveSlots.map((slot) => {
      const state = slot.occupied
        ? `Belegt${slot.savedAt ? ` · ${new Date(slot.savedAt).toLocaleString('de-DE')}` : ''}`
        : 'Leer';
      return `
        <div class="settings-save-slot">
          <div>
            <strong>Slot ${slot.index}</strong>
            <span>${state}</span>
          </div>
          <div class="settings-slot-actions">
            <button type="button" data-save-slot="${slot.index}">Speichern</button>
            <button type="button" data-load-slot="${slot.index}" ${slot.occupied ? '' : 'disabled'}>Laden</button>
            <button type="button" data-delete-slot="${slot.index}" ${slot.occupied ? '' : 'disabled'}>Loeschen</button>
          </div>
        </div>
      `;
    }).join('');

    this.setSettingsHtml(`
      ${this.renderCloseButton('settings')}
      <div class="menu-frame-title">Einstellungen</div>
      <div class="settings-panel-content">
        <section>
          <h3>Manuelle Speicherstaende</h3>
          <div class="settings-save-grid">${rows}</div>
        </section>
        <section class="settings-danger-zone">
          <h3>Spielstand</h3>
          <button class="settings-reset-button" type="button" data-settings-reset="true">Aktuellen Spielstand zuruecksetzen</button>
          <div class="menu-note">Manuelle Save-Slots bleiben erhalten.</div>
        </section>
      </div>
    `);
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
      const currentList = this.craftingPanel?.querySelector?.('[data-craft-scroll]');
      if (currentList?.dataset?.craftScroll) {
        this.craftingScrollTop[currentList.dataset.craftScroll] = currentList.scrollTop;
      }
      this.craftingPanel.innerHTML = html;
      this.lastCraftingHtml = html;
      const nextList = this.craftingPanel?.querySelector?.('[data-craft-scroll]');
      if (nextList?.dataset?.craftScroll) {
        nextList.scrollTop = this.craftingScrollTop[nextList.dataset.craftScroll] || 0;
      }
    }
  }

  setBuildHtml(html) {
    if (html !== this.lastBuildHtml) {
      this.buildPanel.innerHTML = html;
      this.lastBuildHtml = html;
    }
  }

  setCookingHtml(html) {
    if (html !== this.lastCookingHtml) {
      const currentList = this.cookingPanel?.querySelector?.('[data-craft-scroll]');
      if (currentList?.dataset?.craftScroll) {
        this.craftingScrollTop[currentList.dataset.craftScroll] = currentList.scrollTop;
      }
      this.cookingPanel.innerHTML = html;
      this.lastCookingHtml = html;
      const nextList = this.cookingPanel?.querySelector?.('[data-craft-scroll]');
      if (nextList?.dataset?.craftScroll) {
        nextList.scrollTop = this.craftingScrollTop[nextList.dataset.craftScroll] || 0;
      }
    }
  }

  setFurnaceHtml(html) {
    if (html !== this.lastFurnaceHtml) {
      const currentList = this.furnacePanel?.querySelector?.('[data-craft-scroll]');
      if (currentList?.dataset?.craftScroll) {
        this.craftingScrollTop[currentList.dataset.craftScroll] = currentList.scrollTop;
      }
      this.furnacePanel.innerHTML = html;
      this.lastFurnaceHtml = html;
      const nextList = this.furnacePanel?.querySelector?.('[data-craft-scroll]');
      if (nextList?.dataset?.craftScroll) {
        nextList.scrollTop = this.craftingScrollTop[nextList.dataset.craftScroll] || 0;
      }
    }
  }

  setSettingsHtml(html) {
    if (html !== this.lastSettingsHtml) {
      this.settingsPanel.innerHTML = html;
      this.lastSettingsHtml = html;
    }
  }
}
