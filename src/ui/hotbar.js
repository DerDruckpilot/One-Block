import {
  HOTBAR_RESOURCES,
  RESOURCE_ICONS,
  RESOURCE_LABELS,
  RESOURCE_SHORT_LABELS
} from '../config/constants.js';

export class Hotbar {
  constructor(element, onSelect = () => {}) {
    this.element = element;
    this.onSelect = onSelect;

    this.element?.addEventListener('click', (event) => {
      const button = event.target.closest?.('[data-resource]');
      if (!button) return;
      this.onSelect(button.dataset.resource);
    });
  }

  update({ inventory, activeResource }) {
    if (!this.element) return;

    this.element.innerHTML = HOTBAR_RESOURCES.map((resource, index) => {
      const isActive = resource === activeResource;
      const label = RESOURCE_LABELS[resource];
      const shortLabel = RESOURCE_SHORT_LABELS[resource];
      const icon = RESOURCE_ICONS[resource];
      const amount = inventory[resource] || 0;

      return `
        <button
          class="hotbar-slot${isActive ? ' is-active' : ''}"
          type="button"
          data-resource="${resource}"
          aria-pressed="${isActive ? 'true' : 'false'}"
          aria-label="${index + 1}: ${label}"
        >
          <span class="hotbar-key">${index + 1}</span>
          <span class="hotbar-icon">${icon}</span>
          <span class="hotbar-label">${shortLabel}</span>
          <span class="hotbar-count">${amount}</span>
        </button>
      `;
    }).join('');
  }
}
