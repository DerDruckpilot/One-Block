export class Hud {
  constructor(element) {
    this.element = element;
  }

  update({ hint, debug, debugEnabled, resetHoldSeconds }) {
    const touch = debug.touch || {
      joystickActive: false,
      actionPressed: false,
      attackPressed: false,
      pointerCount: 0
    };
    const virtualMovement = debug.virtualMovement || { x: 0, y: 0 };

    this.element.innerHTML = `
      <div><strong>Log:</strong> ${hint}</div>
      ${resetHoldSeconds > 0 ? `<div><strong>Reset:</strong> ${this.formatNumber(Math.min(resetHoldSeconds, 2))}/2.0s halten</div>` : ''}
      ${debugEnabled === true ? `<div class="debug-hud">
        <strong>Debug:</strong><br>
        Spieler: ${this.formatNumber(debug.playerX)}, ${this.formatNumber(debug.playerY)}<br>
        Kamera: ${this.formatNumber(debug.cameraX)}, ${this.formatNumber(debug.cameraY)}<br>
        Support-Tile: ${debug.supportTileX}, ${debug.supportTileY}<br>
        supported: ${debug.supported ? 'true' : 'false'}<br>
        void/falling: ${debug.inVoid ? 'void' : 'safe'} / ${debug.falling ? 'falling' : 'stable'}<br>
        paused: ${debug.paused ? 'true' : 'false'}<br>
        save: ${debug.saveStatus}<br>
        Hotbar: ${debug.activeHotbarSlot + 1} / ${debug.activeHotbarItem || 'leer'}<br>
        Touch: stick ${touch.joystickActive ? 'true' : 'false'}, action ${touch.actionPressed ? 'true' : 'false'}, attack ${touch.attackPressed ? 'true' : 'false'}, pointer ${touch.pointerCount}<br>
        Touch-Vektor: ${this.formatNumber(virtualMovement.x)}, ${this.formatNumber(virtualMovement.y)}<br>
        Bewegung: ${debug.movementKeys.length > 0 ? debug.movementKeys.join(', ') : 'keine'}<br>
        Letzter Key: ${debug.lastKey}
      </div>` : ''}
    `;
  }

  formatNumber(value) {
    return Number(value).toFixed(1);
  }
}
