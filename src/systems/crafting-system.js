import { CRAFTING_RECIPES, RESOURCE_LABELS } from '../config/constants.js';

const getRecipeContext = (recipeId) => (
  CRAFTING_RECIPES.find((recipe) => recipe.id === recipeId)?.craftingContext || 'normal'
);

export class CraftingSystem {
  constructor(inventory) {
    this.inventory = inventory;
  }

  getRecipeStates({ hasWorkbenchAccess = false, craftingContext = 'normal' } = {}) {
    return CRAFTING_RECIPES
      .filter((recipe) => recipe.craftingContext === craftingContext)
      .map((recipe) => this.getRecipeState(recipe, hasWorkbenchAccess));
  }

  getRecipeState(recipe, hasWorkbenchAccess = false) {
    const missing = Object.entries(recipe.costs)
      .map(([resource, amount]) => ({
        resource,
        label: RESOURCE_LABELS[resource],
        required: amount,
        available: this.inventory.get(resource),
        missing: Math.max(0, amount - this.inventory.get(resource))
      }))
      .filter((cost) => cost.missing > 0);
    const isAvailable = !recipe.requiresWorkbench || hasWorkbenchAccess;

    return {
      recipe,
      canCraft: isAvailable && missing.length === 0,
      isAvailable,
      missing
    };
  }

  getWorkbenchRecipeState() {
    return this.getRecipeStates().find((state) => state.recipe.id === 'workbench');
  }

  craft(recipeId, { hasWorkbenchAccess = false, craftingContext = getRecipeContext(recipeId) } = {}) {
    const state = this.getRecipeStates({ hasWorkbenchAccess, craftingContext })
      .find((recipeState) => recipeState.recipe.id === recipeId);

    if (!state) {
      return {
        crafted: false,
        message: 'Unbekanntes Rezept.'
      };
    }

    if (!state.isAvailable) {
      return {
        crafted: false,
        message: 'Werkbank benötigt.'
      };
    }

    if (!state.canCraft) {
      return {
        crafted: false,
        message: 'Nicht genug Ressourcen.'
      };
    }

    for (const [resource, amount] of Object.entries(state.recipe.costs)) {
      this.inventory.remove(resource, amount);
    }
    this.inventory.add(state.recipe.result, state.recipe.resultAmount);

    return {
      crafted: true,
      message: `${RESOURCE_LABELS[state.recipe.result]} hergestellt.`
    };
  }

  craftWorkbench() {
    return this.craft('workbench');
  }
}
