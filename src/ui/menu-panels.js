import { INVENTORY_RESOURCES, RESOURCE_LABELS, WORKBENCH_RECIPE } from '../config/constants.js';

export class MenuPanels {
  constructor({ inventoryPanel, craftingPanel }) {
    this.inventoryPanel = inventoryPanel;
    this.craftingPanel = craftingPanel;
  }

  update({ inventory, inventoryOpen, craftingOpen, workbenchRecipe }) {
    this.renderInventory(inventory, inventoryOpen);
    this.renderCrafting(inventory, craftingOpen, workbenchRecipe);
  }

  renderInventory(inventory, isOpen) {
    if (!this.inventoryPanel) return;
    this.inventoryPanel.hidden = !isOpen;

    if (!isOpen) {
      this.inventoryPanel.innerHTML = '';
      return;
    }

    const rows = INVENTORY_RESOURCES
      .filter((resource) => resource !== 'workbench' || inventory.get(resource) > 0)
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

  renderCrafting(inventory, isOpen, workbenchRecipe) {
    if (!this.craftingPanel) return;
    this.craftingPanel.hidden = !isOpen;

    if (!isOpen) {
      this.craftingPanel.innerHTML = '';
      return;
    }

    const costs = Object.entries(WORKBENCH_RECIPE.costs)
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

    const missingText = workbenchRecipe.missing.length > 0
      ? `<div class="menu-note">Fehlt: ${workbenchRecipe.missing.map((cost) => `${cost.missing}x ${cost.label}`).join(', ')}</div>`
      : '';

    this.craftingPanel.innerHTML = `
      <h2>Crafting</h2>
      <div class="recipe-card">
        <h3>Werkbank</h3>
        <div class="menu-list">${costs}</div>
        ${missingText}
        <button class="craft-button" type="button" data-craft="workbench" ${workbenchRecipe.canCraft ? '' : 'disabled'}>
          Herstellen
        </button>
      </div>
    `;
  }
}
