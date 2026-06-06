import { RESOURCE_LABELS, RESOURCE_SHORT_LABELS } from '../config/constants.js';
import { renderItemIcon } from './item-icons.js';

export class HandIndicator {
  constructor(element) {
    this.element = element;
    this.lastHtml = '';
  }

  update({ handItem = null, ammoResource = null, ammoCount = 0 } = {}) {
    if (!this.element) return;

    const html = handItem
      ? `
        <span class="hand-indicator-label">Hand</span>
        ${renderItemIcon(handItem, 'hand-icon item-pixel-icon')}
        <strong>${RESOURCE_SHORT_LABELS[handItem] || RESOURCE_LABELS[handItem] || handItem}</strong>
        ${ammoResource ? `<span class="hand-ammo">${RESOURCE_SHORT_LABELS[ammoResource] || ammoResource}: ${ammoCount}</span>` : ''}
      `
      : `
        <span class="hand-indicator-label">Hand</span>
        <span class="hand-icon item-pixel-icon item-icon-fallback" aria-hidden="true">--</span>
        <strong>Leer</strong>
      `;

    if (html !== this.lastHtml) {
      this.element.innerHTML = html;
      this.lastHtml = html;
    }
  }
}
