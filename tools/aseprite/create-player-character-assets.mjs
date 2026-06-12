import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { deflateSync } from 'node:zlib';

const OUTPUT_ROOT = 'assets/generated/sprites/player';

const rgba = (hex, alpha = 255) => {
  const value = hex.replace('#', '');
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
    alpha
  ];
};

const palette = {
  outline: rgba('#2b1a11'),
  hairDark: rgba('#321a10'),
  hairMid: rgba('#6d3519'),
  hairLight: rgba('#a85825'),
  skinDark: rgba('#8a4e2d'),
  skin: rgba('#c9824b'),
  skinLight: rgba('#f0b36b'),
  linenDark: rgba('#8f7442'),
  linenMid: rgba('#d5bd7c'),
  linen: rgba('#f1e1af'),
  linenLight: rgba('#fff0c6'),
  band: rgba('#5c3820'),
  bandLight: rgba('#9b6532'),
  eye: rgba('#2b1a11'),
  eyeLight: rgba('#fff4d8'),
  blush: rgba('#d78a58'),
  shadow: rgba('#000000', 58)
};

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  typeBuffer.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return out;
}

function savePng(path, canvas) {
  mkdirSync(dirname(path), { recursive: true });
  const raw = Buffer.alloc((canvas.width * 4 + 1) * canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    const rowStart = y * (canvas.width * 4 + 1);
    raw[rowStart] = 0;
    canvas.pixels.copy(raw, rowStart + 1, y * canvas.width * 4, (y + 1) * canvas.width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(canvas.width, 0);
  ihdr.writeUInt32BE(canvas.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  writeFileSync(path, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND')
  ]));
}

function createCanvas(width, height) {
  return {
    width,
    height,
    pixels: Buffer.alloc(width * height * 4)
  };
}

function setPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
  const offset = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
  canvas.pixels[offset] = color[0];
  canvas.pixels[offset + 1] = color[1];
  canvas.pixels[offset + 2] = color[2];
  canvas.pixels[offset + 3] = color[3];
}

function rect(canvas, x, y, width, height, color) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) setPixel(canvas, xx, yy, color);
  }
}

function ellipse(canvas, cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1) setPixel(canvas, x, y, color);
    }
  }
}

function line(canvas, x0, y0, x1, y1, color) {
  let dx = Math.abs(x1 - x0);
  let sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0);
  let sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    setPixel(canvas, x0, y0, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function poly(canvas, points, color) {
  const minY = Math.floor(Math.min(...points.map((p) => p[1])));
  const maxY = Math.ceil(Math.max(...points.map((p) => p[1])));
  for (let y = minY; y <= maxY; y += 1) {
    const nodes = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
      const pi = points[i];
      const pj = points[j];
      if ((pi[1] < y && pj[1] >= y) || (pj[1] < y && pi[1] >= y)) {
        nodes.push(Math.floor(pi[0] + ((y - pi[1]) / (pj[1] - pi[1])) * (pj[0] - pi[0])));
      }
    }
    nodes.sort((a, b) => a - b);
    for (let n = 0; n < nodes.length; n += 2) {
      for (let x = nodes[n]; x <= nodes[n + 1]; x += 1) setPixel(canvas, x, y, color);
    }
  }
}

function outlinePoly(canvas, points, color) {
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    line(canvas, a[0], a[1], b[0], b[1], color);
  }
}

function drawHair(canvas, ox, oy, dir, scale = 1) {
  const px = (v) => Math.round(ox + v * scale);
  const py = (v) => Math.round(oy + v * scale);
  ellipse(canvas, px(24), py(13), 12 * scale, 9 * scale, palette.outline);
  ellipse(canvas, px(24), py(13), 11 * scale, 8 * scale, palette.hairMid);
  const spikes = dir === 'up'
    ? [[14, 8, 9, 5], [20, 5, 18, 1], [27, 4, 31, 0], [34, 8, 39, 5]]
    : [[15, 9, 9, 8], [20, 6, 18, 2], [26, 5, 29, 1], [33, 8, 39, 7]];
  for (const [x0, y0, x1, y1] of spikes) {
    line(canvas, px(x0), py(y0), px(x1), py(y1), palette.outline);
    line(canvas, px(x0), py(y0 + 1), px(x1), py(y1 + 1), palette.hairLight);
  }
  line(canvas, px(17), py(11), px(29), py(6), palette.hairDark);
  line(canvas, px(22), py(9), px(20), py(20), palette.hairDark);
  line(canvas, px(30), py(10), px(35), py(14), palette.hairDark);
  line(canvas, px(16), py(14), px(12), py(17), palette.hairLight);
}

function drawCharacter(canvas, ox, oy, { direction = 'down', action = 'idle', frame = 0, scale = 1 } = {}) {
  const isSide = direction === 'left' || direction === 'right';
  const flip = direction === 'left' ? -1 : 1;
  const px = (v) => Math.round(ox + (isSide ? 24 + (v - 24) * flip : v) * scale);
  const py = (v) => Math.round(oy + v * scale);
  const bob = action === 'idle' ? (frame % 2 === 1 ? 1 : 0) : action === 'walk' ? [0, 1, 0, -1][frame % 4] : action === 'run' ? [0, 2, 0, -2][frame % 4] : 0;
  const stride = action === 'idle' ? 0 : action === 'run' ? [2, -2, 2, -2][frame % 4] : [1, -1, 1, -1][frame % 4];
  const punch = action === 'attack' ? [0, 4, 2, 0][frame % 4] : 0;
  const yShift = bob;

  ellipse(canvas, px(24), py(43), 11 * scale, 3 * scale, palette.shadow);

  if (direction === 'up') {
    rect(canvas, px(16), py(27 + yShift), 5, 13, palette.outline);
    rect(canvas, px(17), py(28 + yShift), 3, 11, palette.skin);
    rect(canvas, px(28), py(27 - yShift), 5, 13, palette.outline);
    rect(canvas, px(29), py(28 - yShift), 3, 11, palette.skinDark);
  } else {
    rect(canvas, px(16), py(29 + yShift + stride), 5, 12, palette.outline);
    rect(canvas, px(17), py(29 + yShift + stride), 3, 11, palette.skin);
    rect(canvas, px(28), py(29 - yShift - stride), 5, 12, palette.outline);
    rect(canvas, px(29), py(29 - yShift - stride), 3, 11, palette.skinDark);
  }
  rect(canvas, px(15), py(40 + yShift + stride), 8, 3, palette.outline);
  rect(canvas, px(26), py(40 - yShift - stride), 8, 3, palette.outline);
  rect(canvas, px(16), py(40 + yShift + stride), 6, 2, palette.skinLight);
  rect(canvas, px(27), py(40 - yShift - stride), 6, 2, palette.skin);

  const armForward = action === 'attack' ? punch : 0;
  if (isSide) {
    rect(canvas, px(16), py(23 + yShift), 6, 11, palette.outline);
    rect(canvas, px(17), py(23 + yShift), 4, 10, palette.skinDark);
    rect(canvas, px(32 + armForward), py(23 + yShift), 6, 12, palette.outline);
    rect(canvas, px(33 + armForward), py(23 + yShift), 4, 10, palette.skin);
  } else {
    rect(canvas, px(11), py(22 + yShift), 6, 13, palette.outline);
    rect(canvas, px(12), py(23 + yShift), 4, 11, palette.skinDark);
    rect(canvas, px(31), py(22 + yShift + armForward), 6, 13, palette.outline);
    rect(canvas, px(32), py(23 + yShift + armForward), 4, 11, palette.skin);
  }
  rect(canvas, px(11), py(31 + yShift), 6, 3, palette.band);
  rect(canvas, px(31), py(31 + yShift + armForward), 6, 3, palette.band);
  rect(canvas, px(12), py(31 + yShift), 4, 1, palette.bandLight);
  rect(canvas, px(32), py(31 + yShift + armForward), 4, 1, palette.bandLight);

  const tunic = direction === 'up'
    ? [[17, 20], [31, 20], [34, 36], [29, 34], [27, 39], [24, 35], [21, 39], [18, 34], [14, 36]]
    : [[17, 20], [31, 20], [34, 35], [29, 34], [26, 40], [24, 36], [21, 40], [19, 34], [14, 35]];
  const shifted = tunic.map(([x, y]) => [px(x), py(y + yShift)]);
  poly(canvas, shifted, palette.outline);
  poly(canvas, tunic.map(([x, y]) => [px(x), py(y + yShift + 1)]), palette.linen);
  line(canvas, px(18), py(22 + yShift), px(23), py(34 + yShift), palette.linenLight);
  line(canvas, px(30), py(22 + yShift), px(25), py(35 + yShift), palette.linenDark);
  if (direction !== 'up') {
    line(canvas, px(22), py(21 + yShift), px(24), py(27 + yShift), palette.linenDark);
    line(canvas, px(26), py(21 + yShift), px(24), py(27 + yShift), palette.linenDark);
    rect(canvas, px(23), py(26 + yShift), 2, 2, palette.band);
  }
  setPixel(canvas, px(18), py(33 + yShift), palette.linenDark);
  setPixel(canvas, px(30), py(32 + yShift), palette.linenDark);

  drawHair(canvas, ox, oy + yShift, direction, scale);

  if (isSide) {
    ellipse(canvas, px(24), py(15 + yShift), 8 * scale, 8 * scale, palette.outline);
    ellipse(canvas, px(24), py(15 + yShift), 7 * scale, 7 * scale, palette.skin);
    rect(canvas, px(27), py(15 + yShift), 2, 3, palette.eye);
    setPixel(canvas, px(28), py(15 + yShift), palette.eyeLight);
    rect(canvas, px(32), py(15 + yShift), 2, 3, palette.skinDark);
  } else if (direction === 'up') {
    ellipse(canvas, px(24), py(15 + yShift), 8 * scale, 8 * scale, palette.outline);
    ellipse(canvas, px(24), py(15 + yShift), 7 * scale, 7 * scale, palette.skinDark);
  } else {
    ellipse(canvas, px(24), py(15 + yShift), 9 * scale, 8 * scale, palette.outline);
    ellipse(canvas, px(24), py(15 + yShift), 8 * scale, 7 * scale, palette.skin);
    rect(canvas, px(18), py(14 + yShift), 3, 4, palette.eye);
    rect(canvas, px(27), py(14 + yShift), 3, 4, palette.eye);
    setPixel(canvas, px(19), py(14 + yShift), palette.eyeLight);
    setPixel(canvas, px(28), py(14 + yShift), palette.eyeLight);
    setPixel(canvas, px(24), py(18 + yShift), palette.skinDark);
    line(canvas, px(21), py(21 + yShift), px(27), py(21 + yShift), palette.blush);
  }
  if (direction !== 'up') {
    line(canvas, px(19), py(8 + yShift), px(21), py(17 + yShift), palette.hairDark);
    line(canvas, px(23), py(7 + yShift), px(23), py(18 + yShift), palette.hairLight);
    line(canvas, px(29), py(8 + yShift), px(26), py(17 + yShift), palette.hairDark);
  }
}

function drawInventoryPortrait(canvas) {
  ellipse(canvas, 96, 190, 48, 9, palette.shadow);

  poly(canvas, [[70, 122], [82, 122], [83, 178], [70, 178]], palette.outline);
  poly(canvas, [[72, 124], [81, 124], [80, 177], [72, 177]], palette.skin);
  poly(canvas, [[108, 122], [121, 122], [122, 178], [109, 178]], palette.outline);
  poly(canvas, [[110, 124], [119, 124], [120, 177], [111, 177]], palette.skinDark);
  ellipse(canvas, 76, 183, 14, 6, palette.outline);
  ellipse(canvas, 116, 183, 14, 6, palette.outline);
  ellipse(canvas, 76, 181, 11, 4, palette.skinLight);
  ellipse(canvas, 116, 181, 11, 4, palette.skin);
  for (const x of [70, 76, 82, 110, 116, 122]) line(canvas, x, 181, x - 2, 185, palette.skinDark);

  poly(canvas, [[55, 78], [70, 78], [68, 136], [54, 139], [46, 96]], palette.outline);
  poly(canvas, [[58, 81], [68, 81], [65, 132], [56, 134], [50, 97]], palette.skinDark);
  poly(canvas, [[122, 78], [138, 78], [145, 99], [137, 139], [124, 136]], palette.outline);
  poly(canvas, [[124, 81], [135, 81], [141, 100], [134, 134], [126, 132]], palette.skin);
  rect(canvas, 51, 128, 18, 6, palette.band);
  rect(canvas, 125, 128, 18, 6, palette.band);
  rect(canvas, 53, 128, 14, 2, palette.bandLight);
  rect(canvas, 127, 128, 14, 2, palette.bandLight);

  const outerTunic = [[65, 72], [126, 72], [136, 162], [119, 156], [111, 178], [97, 161], [86, 178], [78, 156], [60, 162]];
  const innerTunic = [[68, 76], [123, 76], [131, 154], [116, 150], [109, 169], [97, 154], [87, 170], [80, 150], [65, 154]];
  poly(canvas, outerTunic, palette.outline);
  poly(canvas, innerTunic, palette.linen);
  line(canvas, 72, 82, 90, 151, palette.linenLight);
  line(canvas, 121, 82, 103, 156, palette.linenDark);
  line(canvas, 82, 80, 96, 110, palette.linenDark);
  line(canvas, 110, 80, 96, 110, palette.linenDark);
  rect(canvas, 92, 105, 8, 7, palette.band);
  for (const [x, y] of [[69, 142], [80, 157], [118, 146], [105, 165], [75, 118]]) rect(canvas, x, y, 5, 5, palette.linenDark);
  for (let y = 90; y < 160; y += 12) {
    setPixel(canvas, 83 + (y % 3), y, palette.linenMid);
    setPixel(canvas, 113 - (y % 4), y + 4, palette.linenMid);
  }

  ellipse(canvas, 96, 52, 36, 34, palette.outline);
  ellipse(canvas, 96, 54, 32, 30, palette.skin);
  ellipse(canvas, 78, 53, 8, 11, palette.skinDark);
  ellipse(canvas, 114, 53, 8, 11, palette.skinDark);
  rect(canvas, 75, 49, 9, 12, palette.eye);
  rect(canvas, 108, 49, 9, 12, palette.eye);
  rect(canvas, 79, 50, 3, 4, palette.eyeLight);
  rect(canvas, 112, 50, 3, 4, palette.eyeLight);
  rect(canvas, 92, 62, 7, 6, palette.skinDark);
  line(canvas, 84, 74, 108, 74, palette.blush);
  line(canvas, 88, 73, 104, 73, palette.outline);
  setPixel(canvas, 97, 62, palette.skinLight);

  ellipse(canvas, 96, 31, 48, 31, palette.outline);
  ellipse(canvas, 96, 32, 45, 29, palette.hairMid);
  for (const spike of [
    [61, 28, 44, 22], [69, 17, 58, 7], [83, 8, 79, -2], [99, 6, 105, -3],
    [115, 12, 132, 3], [128, 25, 149, 18], [56, 43, 39, 47], [136, 41, 155, 43]
  ]) {
    line(canvas, spike[0], spike[1], spike[2], spike[3], palette.outline);
    line(canvas, spike[0], spike[1] + 1, spike[2], spike[3] + 1, palette.hairLight);
  }
  for (const strand of [[64, 32, 93, 16], [79, 24, 76, 58], [96, 15, 93, 54], [110, 18, 100, 58], [125, 30, 115, 58]]) {
    line(canvas, strand[0], strand[1], strand[2], strand[3], palette.hairDark);
  }
  line(canvas, 72, 38, 61, 56, palette.hairLight);
  line(canvas, 121, 34, 135, 53, palette.hairLight);

  ellipse(canvas, 96, 55, 31, 28, palette.skin);
  ellipse(canvas, 78, 54, 7, 10, palette.skinDark);
  ellipse(canvas, 114, 54, 7, 10, palette.skinDark);
  rect(canvas, 75, 50, 9, 12, palette.eye);
  rect(canvas, 108, 50, 9, 12, palette.eye);
  rect(canvas, 79, 51, 3, 4, palette.eyeLight);
  rect(canvas, 112, 51, 3, 4, palette.eyeLight);
  rect(canvas, 92, 63, 7, 6, palette.skinDark);
  line(canvas, 84, 75, 108, 75, palette.blush);
  line(canvas, 88, 74, 104, 74, palette.outline);
  line(canvas, 82, 41, 78, 58, palette.hairDark);
  line(canvas, 96, 35, 95, 57, palette.hairLight);
  line(canvas, 111, 41, 106, 58, palette.hairDark);
}

function makeSheet() {
  const frameSize = 48;
  const frameCount = 4;
  const animations = ['idle', 'walk', 'run', 'attack'];
  const directions = ['down', 'left', 'right', 'up'];
  const canvas = createCanvas(frameSize * frameCount, frameSize * animations.length * directions.length);
  const meta = {
    image: 'player_final_48.png',
    frameWidth: frameSize,
    frameHeight: frameSize,
    columns: frameCount,
    rows: animations.length * directions.length,
    animations: {}
  };

  let row = 0;
  for (const animation of animations) {
    for (const direction of directions) {
      const frames = [];
      for (let frame = 0; frame < frameCount; frame += 1) {
        drawCharacter(canvas, frame * frameSize, row * frameSize, { direction, action: animation, frame });
        frames.push(row * frameCount + frame);
      }
      meta.animations[`${animation}_${direction}`] = {
        frames: animation === 'idle' ? frames.slice(0, 2) : frames,
        fps: animation === 'idle' ? 2 : animation === 'attack' ? 10 : animation === 'run' ? 9 : 6
      };
      row += 1;
    }
  }

  return { canvas, meta };
}

function makePreview(sheet, portrait) {
  const canvas = createCanvas(500, 812);
  drawChecker(canvas);
  blit(sheet, 0, 0, sheet.width, sheet.height, canvas, 12, 16);
  blit(portrait, 0, 0, portrait.width, portrait.height, canvas, 276, 116);
  return canvas;
}

function drawChecker(canvas) {
  for (let y = 0; y < canvas.height; y += 8) {
    for (let x = 0; x < canvas.width; x += 8) {
      rect(canvas, x, y, 8, 8, ((x + y) / 8) % 2 === 0 ? rgba('#f1f1f1') : rgba('#ffffff'));
    }
  }
}

function blit(src, sx, sy, sw, sh, dst, dx, dy) {
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const so = ((sy + y) * src.width + sx + x) * 4;
      const color = [src.pixels[so], src.pixels[so + 1], src.pixels[so + 2], src.pixels[so + 3]];
      if (color[3] > 0) setPixel(dst, dx + x, dy + y, color);
    }
  }
}

const { canvas: sheet, meta } = makeSheet();
const portrait = createCanvas(192, 208);
drawInventoryPortrait(portrait);
const preview = makePreview(sheet, portrait);

savePng(`${OUTPUT_ROOT}/player_final_48.png`, sheet);
savePng(`${OUTPUT_ROOT}/player_inventory_portrait.png`, portrait);
savePng(`${OUTPUT_ROOT}/player_character_preview.png`, preview);
writeFileSync(`${OUTPUT_ROOT}/player_final_48.json`, `${JSON.stringify(meta, null, 2)}\n`);
