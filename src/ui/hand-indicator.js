import { RESOURCE_LABELS } from '../config/constants.js';
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
        ${renderItemIcon(handItem, 'hand-icon item-pixel-icon')}
        ${ammoResource ? `<span class="hand-ammo" aria-label="${RESOURCE_LABELS[ammoResource] || ammoResource}">${ammoCount}</span>` : ''}
      `
      : `
        <span class="hand-icon item-pixel-icon item-icon-fallback" aria-hidden="true"></span>
      `;

    if (html !== this.lastHtml) {
      this.element.innerHTML = html;
      this.lastHtml = html;
    }
  }
}
