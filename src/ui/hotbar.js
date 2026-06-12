import {
  RESOURCE_LABELS
} from '../config/constants.js';
import { renderItemIcon } from './item-icons.js';

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
      const icon = isEmpty ? '<span class="item-pixel-icon item-icon-fallback"></span>' : renderItemIcon(resource);
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
          <span class="hotbar-icon">${icon}</span>
          ${isEmpty ? '' : `<span class="hotbar-count">${amount}</span>`}
        </button>
      `;
    }).join('');

    if (html !== this.lastHtml) {
      this.element.innerHTML = html;
      this.lastHtml = html;
    }
  }
}
