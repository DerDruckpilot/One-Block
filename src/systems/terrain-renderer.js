import { TILE_SIZE, TILE_TYPES } from '../config/constants.js';

const edgeMap = {
  earth: { top: '#a46f3b', mid: '#7a4f2d', side: '#52331f', dark: '#332015', light: '#c28b4d' },
  grass: { top: '#68ad4c', mid: '#4f8f3f', side: '#385a2e', dark: '#253d20', light: '#9bd66e' },
  stone: { top: '#9ca2a4', mid: '#747b7f', side: '#4d5358', dark: '#31363b', light: '#c4c9ca' }
};

export class TerrainRenderer {
  drawTile(context, tile, tileMap, screenX, screenY) {
    if (tile.type === TILE_TYPES.crystal) {
      this.drawBaseTile(context, { ...tile, type: TILE_TYPES.earth }, tileMap, screenX, screenY);
      return;
    }

    this.drawBaseTile(context, tile, tileMap, screenX, screenY);
  }

  drawBaseTile(context, tile, tileMap, x, y) {
    const palette = edgeMap[tile.type] || edgeMap.earth;
    const hasTileBelow = tileMap.getTile(tile.x, tile.y + 1);

    context.save();
    context.fillStyle = palette.dark;
    context.fillRect(x + 1, y + 23, TILE_SIZE - 2, 9);
    context.fillStyle = palette.side;
    context.fillRect(x + 2, y + 25, TILE_SIZE - 4, 6);

    if (!hasTileBelow) {
      context.fillStyle = palette.dark;
      context.fillRect(x + 3, y + 30, TILE_SIZE - 6, 4);
      context.fillStyle = 'rgba(0, 0, 0, 0.2)';
      context.fillRect(x + 6, y + 34, TILE_SIZE - 12, 3);
    }

    context.fillStyle = palette.mid;
    context.fillRect(x, y + 2, TILE_SIZE, 24);
    context.fillStyle = palette.top;
    context.fillRect(x + 2, y + 2, TILE_SIZE - 4, 20);
    context.fillStyle = palette.light;
    context.fillRect(x + 4, y + 4, TILE_SIZE - 8, 3);
    context.fillStyle = palette.dark;
    context.fillRect(x, y + 2, 2, 24);
    context.fillRect(x + TILE_SIZE - 2, y + 2, 2, 24);

    this.drawTileDetails(context, tile, palette, x, y);
    context.restore();
  }

  drawTileDetails(context, tile, palette, x, y) {
    if (tile.type === TILE_TYPES.grass) {
      this.drawGrassDetails(context, x, y);
      return;
    }

    if (tile.type === TILE_TYPES.stone) {
      this.drawStoneDetails(context, x, y);
      return;
    }

    context.fillStyle = palette.dark;
    context.fillRect(x + 5, y + 17, 6, 3);
    context.fillRect(x + 21, y + 10, 5, 3);
    context.fillStyle = '#91613a';
    context.fillRect(x + 14, y + 7, 4, 3);
    context.fillRect(x + 24, y + 18, 3, 2);
  }

  drawGrassDetails(context, x, y) {
    context.fillStyle = '#2f6f35';
    context.fillRect(x + 4, y + 17, 6, 3);
    context.fillRect(x + 20, y + 10, 5, 3);
    context.fillStyle = '#83c85e';
    context.fillRect(x + 9, y + 7, 3, 2);
    context.fillRect(x + 24, y + 17, 2, 3);
    context.fillStyle = '#f6e68a';
    context.fillRect(x + 15, y + 14, 2, 2);
    context.fillRect(x + 17, y + 12, 2, 2);
    context.fillStyle = '#ffffff';
    context.fillRect(x + 6, y + 8, 2, 2);
  }

  drawStoneDetails(context, x, y) {
    context.fillStyle = '#c4c9ca';
    context.fillRect(x + 5, y + 6, 9, 4);
    context.fillRect(x + 18, y + 15, 8, 3);
    context.fillStyle = '#596065';
    context.fillRect(x + 6, y + 19, 7, 3);
    context.fillRect(x + 21, y + 8, 6, 3);
    context.fillStyle = '#848b8f';
    context.fillRect(x + 13, y + 12, 5, 3);
  }
}
