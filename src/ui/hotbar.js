import {
  RESOURCE_ICONS,
  RESOURCE_LABELS,
  RESOURCE_SHORT_LABELS
} from '../config/constants.js';

export class Hotbar {
  constructor(element) {
    this.element = element;
    this.lastHtml = '';
  }

  update({ inventory, activeSlot, slots }) {
    if (!this.element) return;

    const html = slots.map((resource, index) => {
      const isActive = index === activeSlot;
      const isEmpty = !resource;
      const label = isEmpty ? 'Leer' : RESOURCE_LABELS[resource];
      const shortLabel = isEmpty ? 'Leer' : RESOURCE_SHORT_LABELS[resource];
      const icon = isEmpty ? '--' : RESOURCE_ICONS[resource];
      const amount = isEmpty ? 0 : inventory[resource] || 0;

      return `
        <button
          class="hotbar-slot${isActive ? ' is-active' : ''}${isEmpty ? ' is-empty' : ''}"
          type="button"
          data-hotbar-slot="${index}"
          ${resource ? `data-resource="${resource}"` : ''}
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

    if (html !== this.lastHtml) {
      this.element.innerHTML = html;
      this.lastHtml = html;
    }
  }
}
