import { INVENTORY_RESOURCES, RESOURCE_ICONS, RESOURCE_LABELS } from '../config/constants.js';

export class MenuPanels {
  constructor({ inventoryPanel, craftingPanel }) {
    this.inventoryPanel = inventoryPanel;
    this.craftingPanel = craftingPanel;
    this.lastInventoryHtml = '';
    this.lastCraftingHtml = '';
  }

  update({ craftingOpen, inventory, inventoryOpen, recipeStates, hasWorkbenchAccess, selectedInventoryResource }) {
    this.renderInventory(inventory, inventoryOpen, selectedInventoryResource);
    this.renderCrafting(inventory, craftingOpen, recipeStates, hasWorkbenchAccess);
  }

  renderInventory(inventory, isOpen, selectedInventoryResource = null) {
    if (!this.inventoryPanel) return;
    this.inventoryPanel.hidden = !isOpen;

    if (!isOpen) {
      this.setInventoryHtml('');
      return;
    }

    const rows = INVENTORY_RESOURCES
      .map((resource) => `
        <button
          class="menu-row inventory-item${selectedInventoryResource === resource ? ' is-selected' : ''}"
          type="button"
          data-inventory-resource="${resource}"
          aria-pressed="${selectedInventoryResource === resource ? 'true' : 'false'}"
        >
          <span><span class="menu-icon">${RESOURCE_ICONS[resource]}</span> ${RESOURCE_LABELS[resource]}</span>
          <strong>${inventory.get(resource)}</strong>
        </button>
      `)
      .join('');

    const selectedText = selectedInventoryResource
      ? `${RESOURCE_LABELS[selectedInventoryResource]} ausgewählt`
      : 'Kein Item für Hotbar-Zuweisung ausgewählt';

    this.setInventoryHtml(`
      <h2>Inventar</h2>
      <div class="menu-note">Item anklicken, dann Hotbar-Slot anklicken.</div>
      <div class="menu-note">${selectedText}</div>
      <div class="menu-list">${rows}</div>
    `);
  }

  renderCrafting(inventory, isOpen, recipeStates, hasWorkbenchAccess) {
    if (!this.craftingPanel) return;
    this.craftingPanel.hidden = !isOpen;

    if (!isOpen) {
      this.setCraftingHtml('');
      return;
    }

    const accessText = hasWorkbenchAccess
      ? 'Werkbank in Reichweite'
      : 'Für weitere Rezepte nahe an eine Werkbank stellen';
    const recipes = recipeStates.map((recipeState) => this.renderRecipe(inventory, recipeState)).join('');

    this.setCraftingHtml(`
      <h2>Crafting</h2>
      <div class="menu-note">${accessText}</div>
      <div class="recipe-list">${recipes}</div>
    `);
  }

  renderRecipe(inventory, recipeState) {
    const { recipe } = recipeState;
    const costs = Object.entries(recipe.costs)
      .map(([resource, amount]) => {
        const available = inventory.get(resource);
        const isMissing = available < amount;
        return `
          <div class="menu-row${isMissing ? ' is-missing' : ''}">
            <span>${RESOURCE_LABELS[resource]}</span>
            <strong>${available}/${amount}</strong>
          </div>
        `;
      })
      .join('');
    const missingText = recipeState.missing.length > 0
      ? `<div class="menu-note">Fehlt: ${recipeState.missing.map((cost) => `${cost.missing}x ${cost.label}`).join(', ')}</div>`
      : '';
    const lockedText = recipeState.isAvailable ? '' : '<div class="menu-note">Werkbank benötigt.</div>';

    return `
      <div class="recipe-card">
        <h3>${recipe.name}</h3>
        <div class="menu-list">${costs}</div>
        ${lockedText}
        ${missingText}
        <button class="craft-button" type="button" data-craft="${recipe.id}" ${recipeState.canCraft ? '' : 'disabled'}>
          Herstellen
        </button>
      </div>
    `;
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
