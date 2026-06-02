import { RESOURCE_LABELS, WORKBENCH_RECIPE } from '../config/constants.js';

export class CraftingSystem {
  constructor(inventory) {
    this.inventory = inventory;
  }

  getWorkbenchRecipeState() {
    const missing = Object.entries(WORKBENCH_RECIPE.costs)
      .map(([resource, amount]) => ({
        resource,
        label: RESOURCE_LABELS[resource],
        required: amount,
        available: this.inventory.get(resource),
        missing: Math.max(0, amount - this.inventory.get(resource))
      }))
      .filter((cost) => cost.missing > 0);

    return {
      recipe: WORKBENCH_RECIPE,
      canCraft: missing.length === 0,
      missing
    };
  }

  craftWorkbench() {
    const state = this.getWorkbenchRecipeState();
    if (!state.canCraft) {
      return {
        crafted: false,
        message: 'Nicht genug Ressourcen.'
      };
    }

    for (const [resource, amount] of Object.entries(WORKBENCH_RECIPE.costs)) {
      this.inventory.remove(resource, amount);
    }
    this.inventory.add(WORKBENCH_RECIPE.result, WORKBENCH_RECIPE.resultAmount);

    return {
      crafted: true,
      message: 'Werkbank hergestellt.'
    };
  }
}
