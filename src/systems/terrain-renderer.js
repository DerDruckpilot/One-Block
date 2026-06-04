import { TILE_SIZE, TILE_TYPES } from '../config/constants.js';

const edgeMap = {
  earth: { top: '#a46f3b', mid: '#7a4f2d', side: '#52331f', dark: '#332015', light: '#c28b4d' },
  grass: { top: '#68ad4c', mid: '#4f8f3f', side: '#385a2e', dark: '#253d20', light: '#9bd66e' },
  stone: { top: '#9ca2a4', mid: '#747b7f', side: '#4d5358', dark: '#31363b', light: '#c4c9ca' },
  clay: { top: '#8d7568', mid: '#6b5c55', side: '#4a3f3a', dark: '#2f2825', light: '#b39a88' },
  moistEarth: { top: '#6f5943', mid: '#554536', side: '#3d3028', dark: '#261f1a', light: '#8ca0a5' },
  water: { top: '#4eb3d8', mid: '#277aa8', side: '#1d4d70', dark: '#12314e', light: '#a4ecff' }
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
    const same = this.getSameNeighborMask(tile, tileMap);

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
    context.fillRect(
      x + (same.left ? 0 : 1),
      y + (same.up ? 1 : 2),
      TILE_SIZE - (same.left ? 0 : 1) - (same.right ? 0 : 1),
      24 + (same.down ? 2 : 0)
    );
    context.fillStyle = palette.top;
    context.fillRect(
      x + (same.left ? 0 : 2),
      y + (same.up ? 1 : 2),
      TILE_SIZE - (same.left ? 0 : 2) - (same.right ? 0 : 2),
      20 + (same.down ? 1 : 0)
    );
    context.fillStyle = palette.light;
    if (!same.up) {
      context.fillRect(x + 4, y + 4, TILE_SIZE - 8, 3);
    } else {
      context.fillRect(x + 6, y + 5, TILE_SIZE - 12, 2);
    }
    context.fillStyle = palette.dark;
    if (!same.left) context.fillRect(x, y + 2, 2, 24);
    if (!same.right) context.fillRect(x + TILE_SIZE - 2, y + 2, 2, 24);

    this.drawTileDetails(context, tile, palette, x, y, this.detailVariant(tile));
    if (tile.type !== TILE_TYPES.water && tileMap.isWatered?.(tile.x, tile.y)) {
      context.globalAlpha = 0.22;
      context.fillStyle = '#5eb7d7';
      context.fillRect(x + 3, y + 6, TILE_SIZE - 6, 14);
      context.globalAlpha = 1;
    }
    context.restore();
  }

  getSameNeighborMask(tile, tileMap) {
    return {
      up: tileMap.getTile(tile.x, tile.y - 1) === tile.type,
      down: tileMap.getTile(tile.x, tile.y + 1) === tile.type,
      left: tileMap.getTile(tile.x - 1, tile.y) === tile.type,
      right: tileMap.getTile(tile.x + 1, tile.y) === tile.type
    };
  }

  detailVariant(tile) {
    const value = Math.abs((tile.x * 7349 + tile.y * 9151 + String(tile.type).length * 101) % 5);
    return value;
  }

  getRenderProfile(tile, tileMap) {
    const same = this.getSameNeighborMask(tile, tileMap);
    const sameCount = Object.values(same).filter(Boolean).length;
    return {
      same,
      variant: this.detailVariant(tile),
      interior: sameCount === 4,
      outerEdge: sameCount < 4
    };
  }

  drawTileDetails(context, tile, palette, x, y, variant = 0) {
    if (tile.type === TILE_TYPES.grass) {
      this.drawGrassDetails(context, x, y, variant);
      return;
    }

    if (tile.type === TILE_TYPES.stone) {
      this.drawStoneDetails(context, x, y, variant);
      return;
    }

    if (tile.type === TILE_TYPES.clay || tile.type === TILE_TYPES.moistEarth || tile.type === TILE_TYPES.water) {
      this.drawWetDetails(context, tile, x, y);
      return;
    }

    context.fillStyle = palette.dark;
    context.fillRect(x + 5 + (variant % 3), y + 17, 5, 2);
    if (variant !== 1) context.fillRect(x + 21, y + 10 + (variant % 2), 5, 2);
    context.fillStyle = '#91613a';
    context.fillRect(x + 13 + variant, y + 7, 4, 2);
    if (variant >= 2) context.fillRect(x + 24, y + 18, 3, 2);
  }

  drawGrassDetails(context, x, y, variant = 0) {
    context.fillStyle = '#2f6f35';
    context.fillRect(x + 4 + (variant % 2), y + 17, 6, 3);
    if (variant !== 2) context.fillRect(x + 20, y + 10 + (variant % 2), 5, 3);
    context.fillStyle = '#83c85e';
    context.fillRect(x + 9, y + 7, 3, 2);
    if (variant >= 1) context.fillRect(x + 24, y + 17, 2, 3);
    context.fillStyle = '#f6e68a';
    if (variant === 0 || variant === 3) {
      context.fillRect(x + 15, y + 14, 2, 2);
      context.fillRect(x + 17, y + 12, 2, 2);
    }
    context.fillStyle = '#ffffff';
    if (variant === 4) context.fillRect(x + 6, y + 8, 2, 2);
  }

  drawStoneDetails(context, x, y, variant = 0) {
    context.fillStyle = '#c4c9ca';
    context.fillRect(x + 5 + (variant % 3), y + 6, 8, 4);
    context.fillRect(x + 18, y + 15, 8, 3);
    context.fillStyle = '#596065';
    context.fillRect(x + 6, y + 19, 7, 3);
    context.fillRect(x + 21, y + 8, 6, 3);
    context.fillStyle = '#848b8f';
    context.fillRect(x + 13, y + 12, 5, 3);
  }

  drawWetDetails(context, tile, x, y) {
    if (tile.type === TILE_TYPES.water) {
      context.fillStyle = '#b9f7ff';
      context.fillRect(x + 5, y + 7, 9, 2);
      context.fillRect(x + 17, y + 15, 8, 2);
      context.fillStyle = '#1a5f91';
      context.fillRect(x + 7, y + 19, 6, 2);
      return;
    }

    context.fillStyle = '#3f332d';
    context.fillRect(x + 5, y + 17, 6, 3);
    context.fillRect(x + 21, y + 10, 5, 3);
    context.fillStyle = '#8ca0a5';
    context.fillRect(x + 12, y + 8, 5, 2);
    context.fillRect(x + 23, y + 18, 4, 2);
  }
}
