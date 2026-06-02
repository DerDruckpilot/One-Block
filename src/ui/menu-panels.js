import { INVENTORY_RESOURCES, RESOURCE_LABELS } from '../config/constants.js';

export class MenuPanels {
  constructor({ inventoryPanel, craftingPanel }) {
    this.inventoryPanel = inventoryPanel;
    this.craftingPanel = craftingPanel;
  }

  update({ craftingOpen, inventory, inventoryOpen, recipeStates, hasWorkbenchAccess }) {
    this.renderInventory(inventory, inventoryOpen);
    this.renderCrafting(inventory, craftingOpen, recipeStates, hasWorkbenchAccess);
  }

  renderInventory(inventory, isOpen) {
    if (!this.inventoryPanel) return;
    this.inventoryPanel.hidden = !isOpen;

    if (!isOpen) {
      this.inventoryPanel.innerHTML = '';
      return;
    }

    const rows = INVENTORY_RESOURCES
      .filter((resource) => inventory.get(resource) > 0 || ['earth', 'rawWood', 'fiber', 'grassSeed'].includes(resource))
      .map((resource) => `
        <div class="menu-row">
          <span>${RESOURCE_LABELS[resource]}</span>
          <strong>${inventory.get(resource)}</strong>
        </div>
      `)
      .join('');

    this.inventoryPanel.innerHTML = `
      <h2>Inventar</h2>
      <div class="menu-list">${rows}</div>
    `;
  }

  renderCrafting(inventory, isOpen, recipeStates, hasWorkbenchAccess) {
    if (!this.craftingPanel) return;
    this.craftingPanel.hidden = !isOpen;

    if (!isOpen) {
      this.craftingPanel.innerHTML = '';
      return;
    }

    const accessText = hasWorkbenchAccess
      ? 'Werkbank in Reichweite'
      : 'Für weitere Rezepte nahe an eine Werkbank stellen';
    const recipes = recipeStates.map((recipeState) => this.renderRecipe(inventory, recipeState)).join('');

    this.craftingPanel.innerHTML = `
      <h2>Crafting</h2>
      <div class="menu-note">${accessText}</div>
      <div class="recipe-list">${recipes}</div>
    `;
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
}
