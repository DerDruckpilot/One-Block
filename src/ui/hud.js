import { RESOURCE_LABELS } from '../config/constants.js';

export class Hud {
  constructor(element) {
    this.element = element;
  }

  update({ inventory, hint, debug }) {
    const resources = Object.entries(inventory)
      .filter(([, amount]) => amount > 0)
      .map(([resource, amount]) => `${RESOURCE_LABELS[resource] || resource}: ${amount}`)
      .join('<br>');

    this.element.innerHTML = `
      <div><strong>Rohstoffe:</strong><br>${resources || 'noch keine'}</div>
      <div><strong>Log:</strong> ${hint}</div>
      <div><strong>Steuerung:</strong><br>WASD/Pfeile: bewegen<br>E/Leertaste: Kristall aktivieren<br>B: Erde platzieren</div>
      <div class="debug-hud">
        <strong>Debug:</strong><br>
        Spieler: ${this.formatNumber(debug.playerX)}, ${this.formatNumber(debug.playerY)}<br>
        Kamera: ${this.formatNumber(debug.cameraX)}, ${this.formatNumber(debug.cameraY)}<br>
        Support-Tile: ${debug.supportTileX}, ${debug.supportTileY}<br>
        supported: ${debug.supported ? 'true' : 'false'}<br>
        void/falling: ${debug.inVoid ? 'void' : 'safe'} / ${debug.falling ? 'falling' : 'stable'}<br>
        Bewegung: ${debug.movementKeys.length > 0 ? debug.movementKeys.join(', ') : 'keine'}<br>
        Letzter Key: ${debug.lastKey}
      </div>
    `;
  }

  formatNumber(value) {
    return Number(value).toFixed(1);
  }
}
