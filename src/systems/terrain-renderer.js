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
    const same = this.getSameNeighborMask(tile, tileMap);
    const edges = this.getEdgeProfile(tile, tileMap);
    const surface = this.getSurfaceBounds(same, edges);

    context.save();
    context.fillStyle = palette.mid;
    context.fillRect(
      x + surface.mid.left,
      y + surface.mid.top,
      surface.mid.width,
      surface.mid.height
    );
    context.fillStyle = palette.top;
    context.fillRect(
      x + surface.top.left,
      y + surface.top.top,
      surface.top.width,
      surface.top.height
    );
    context.fillStyle = palette.light;
    if (!edges.hasUp) {
      context.fillRect(x + 4, y + 4, TILE_SIZE - 8, 3);
    } else if (!same.up) {
      context.fillRect(x + 6, y + 5, TILE_SIZE - 12, 2);
    }
    context.fillStyle = palette.dark;
    if (!edges.hasLeft) context.fillRect(x, y + 2, 2, 26);
    if (!edges.hasRight) context.fillRect(x + TILE_SIZE - 2, y + 2, 2, 26);
    if (edges.hasLeft && !same.left) {
      context.fillStyle = palette.mid;
      context.fillRect(x, y + 4, 1, 20);
    }
    if (edges.hasRight && !same.right) {
      context.fillStyle = palette.mid;
      context.fillRect(x + TILE_SIZE - 1, y + 4, 1, 20);
    }
    if (edges.hasUp && !same.up) {
      context.fillStyle = 'rgba(255, 238, 190, 0.12)';
      context.fillRect(x + 3, y + 2, TILE_SIZE - 6, 1);
    }

    if (edges.bottomOuter) {
      const leftInset = edges.bottomContinuesLeft ? 0 : 3;
      const rightInset = edges.bottomContinuesRight ? 0 : 3;
      context.fillStyle = palette.dark;
      context.fillRect(x + leftInset, y + 27, TILE_SIZE - leftInset - rightInset, 7);
      context.fillStyle = palette.side;
      context.fillRect(x + leftInset, y + 25, TILE_SIZE - leftInset - rightInset, 5);
      context.fillStyle = 'rgba(0, 0, 0, 0.18)';
      context.fillRect(x + leftInset, y + 34, TILE_SIZE - leftInset - rightInset, 3);
    } else if (!same.down && edges.hasDown) {
      context.fillStyle = palette.mid;
      context.fillRect(x + 1, y + 23, TILE_SIZE - 2, 2);
    }

    this.drawTransitionDetails(context, tile, palette, x, y, edges, same);

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

  getEdgeProfile(tile, tileMap) {
    const hasUp = Boolean(tileMap.getTile(tile.x, tile.y - 1));
    const hasDown = Boolean(tileMap.getTile(tile.x, tile.y + 1));
    const hasLeft = Boolean(tileMap.getTile(tile.x - 1, tile.y));
    const hasRight = Boolean(tileMap.getTile(tile.x + 1, tile.y));
    const bottomOuter = !hasDown;

    return {
      hasUp,
      hasDown,
      hasLeft,
      hasRight,
      topOuter: !hasUp,
      bottomOuter,
      leftOuter: !hasLeft,
      rightOuter: !hasRight,
      bottomContinuesLeft: bottomOuter && Boolean(tileMap.getTile(tile.x - 1, tile.y)) && !tileMap.getTile(tile.x - 1, tile.y + 1),
      bottomContinuesRight: bottomOuter && Boolean(tileMap.getTile(tile.x + 1, tile.y)) && !tileMap.getTile(tile.x + 1, tile.y + 1)
    };
  }

  getSurfaceBounds(same, edges) {
    const left = same.left ? -1 : edges.hasLeft ? 0 : 2;
    const right = same.right ? -1 : edges.hasRight ? 0 : 2;
    const top = same.up ? -1 : edges.hasUp ? 0 : 2;
    const midBottom = same.down ? 7 : edges.hasDown ? 3 : 0;
    const topBottom = same.down ? 6 : edges.hasDown ? 2 : 0;

    return {
      mid: {
        left,
        top,
        width: TILE_SIZE - left - right,
        height: 25 + midBottom - top
      },
      top: {
        left,
        top,
        width: TILE_SIZE - left - right,
        height: 22 + topBottom - top
      }
    };
  }

  detailVariant(tile) {
    const value = Math.abs((tile.x * 7349 + tile.y * 9151 + String(tile.type).length * 101) % 5);
    return value;
  }

  getRenderProfile(tile, tileMap) {
    const palette = edgeMap[tile.type] || edgeMap.earth;
    const same = this.getSameNeighborMask(tile, tileMap);
    const edges = this.getEdgeProfile(tile, tileMap);
    const surface = this.getSurfaceBounds(same, edges);
    const sameCount = Object.values(same).filter(Boolean).length;
    return {
      same,
      edges,
      surface,
      variant: this.detailVariant(tile),
      interior: sameCount === 4,
      outerEdge: edges.topOuter || edges.bottomOuter || edges.leftOuter || edges.rightOuter,
      transitionEdge: (edges.hasUp && !same.up) ||
        (edges.hasDown && !same.down) ||
        (edges.hasLeft && !same.left) ||
        (edges.hasRight && !same.right),
      waterTransition: tile.type === TILE_TYPES.water && (
        (edges.hasUp && !same.up) ||
        (edges.hasDown && !same.down) ||
        (edges.hasLeft && !same.left) ||
        (edges.hasRight && !same.right)
      ),
      horizontalTransitionSealed: (edges.hasLeft && !same.left) || (edges.hasRight && !same.right),
      horizontalTransitionFill: palette.mid,
      verticalTransitionSealed: (edges.hasUp && !same.up) || (edges.hasDown && !same.down),
      connectedSurfaceHorizontal: same.left || same.right,
      connectedSurfaceVertical: same.up || same.down,
      seamlessHorizontal: same.left || same.right ? surface.top.left < 0 || surface.top.width > TILE_SIZE : false,
      seamlessVertical: same.up || same.down ? surface.top.top < 0 || surface.top.height > 24 : false,
      connectedBottomEdge: edges.bottomOuter && (edges.bottomContinuesLeft || edges.bottomContinuesRight)
    };
  }

  drawTransitionDetails(context, tile, palette, x, y, edges, same) {
    const transition = {
      up: edges.hasUp && !same.up,
      down: edges.hasDown && !same.down,
      left: edges.hasLeft && !same.left,
      right: edges.hasRight && !same.right
    };
    if (!transition.up && !transition.down && !transition.left && !transition.right) return;

    if (tile.type === TILE_TYPES.water) {
      context.fillStyle = 'rgba(164, 236, 255, 0.52)';
      if (transition.up) context.fillRect(x + 4, y + 3, TILE_SIZE - 8, 2);
      if (transition.down) context.fillRect(x + 4, y + 21, TILE_SIZE - 8, 2);
      if (transition.left) context.fillRect(x + 3, y + 5, 2, 16);
      if (transition.right) context.fillRect(x + TILE_SIZE - 5, y + 5, 2, 16);
      context.fillStyle = 'rgba(18, 49, 78, 0.24)';
      if (transition.down) context.fillRect(x + 5, y + 24, TILE_SIZE - 10, 2);
      return;
    }

    context.fillStyle = palette.top;
    if (transition.up) context.fillRect(x + 5, y + 3, TILE_SIZE - 10, 1);
    context.fillStyle = palette.mid;
    if (transition.left) context.fillRect(x, y + 5, 2, 18);
    if (transition.right) context.fillRect(x + TILE_SIZE - 2, y + 5, 2, 18);
    if (transition.down) context.fillRect(x + 3, y + 22, TILE_SIZE - 6, 2);
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
