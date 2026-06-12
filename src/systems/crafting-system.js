import { COOKING_RECIPES, CRAFTING_RECIPES, FURNACE_RECIPES, RESOURCE_LABELS } from '../config/constants.js';

const ALL_RECIPES = [...CRAFTING_RECIPES, ...COOKING_RECIPES, ...FURNACE_RECIPES];

const getRecipeContext = (recipeId) => (
  ALL_RECIPES.find((recipe) => recipe.id === recipeId)?.craftingContext || 'normal'
);

export class CraftingSystem {
  constructor(inventory) {
    this.inventory = inventory;
  }

  getRecipeStates({ hasWorkbenchAccess = false, craftingContext = 'normal', crystalLevel = Infinity } = {}) {
    return ALL_RECIPES
      .filter((recipe) => recipe.craftingContext === craftingContext)
      .map((recipe) => this.getRecipeState(recipe, hasWorkbenchAccess, crystalLevel));
  }

  getRecipeState(recipe, hasWorkbenchAccess = false, crystalLevel = Infinity) {
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
    const requiredCrystalLevel = Number(recipe.minCrystalLevel || 1);
    const isCrystalLevelUnlocked = crystalLevel >= requiredCrystalLevel;
    const remainingCapacity = this.inventory.getRemainingCapacity?.(recipe.result) ?? Infinity;
    const hasResultCapacity = remainingCapacity > 0;

    return {
      recipe,
      canCraft: isAvailable && isCrystalLevelUnlocked && missing.length === 0 && hasResultCapacity,
      isAvailable,
      isCrystalLevelUnlocked,
      requiredCrystalLevel,
      missing,
      hasResultCapacity,
      remainingCapacity
    };
  }

  getWorkbenchRecipeState() {
    return this.getRecipeStates().find((state) => state.recipe.id === 'workbench');
  }

  craft(recipeId, { hasWorkbenchAccess = false, craftingContext = getRecipeContext(recipeId), crystalLevel = Infinity } = {}) {
    const state = this.getRecipeStates({ hasWorkbenchAccess, craftingContext, crystalLevel })
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

    if (!state.isCrystalLevelUnlocked) {
      return {
        crafted: false,
        message: `Kristallstufe ${state.requiredCrystalLevel} benötigt.`
      };
    }

    if (!state.canCraft) {
      return {
        crafted: false,
        message: state.hasResultCapacity === false ? 'Limit erreicht.' : 'Nicht genug Ressourcen.'
      };
    }

    for (const [resource, amount] of Object.entries(state.recipe.costs)) {
      this.inventory.remove(resource, amount);
    }
    const amountToAdd = Math.min(state.recipe.resultAmount, state.remainingCapacity);
    this.inventory.add(state.recipe.result, amountToAdd);

    return {
      crafted: true,
      message: `${RESOURCE_LABELS[state.recipe.result]} hergestellt.`
    };
  }

  craftWorkbench() {
    return this.craft('workbench');
  }
}
