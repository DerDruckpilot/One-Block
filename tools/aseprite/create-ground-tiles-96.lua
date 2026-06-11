local sourceDir = "assets/source/aseprite/tiles/ground_96"
local outputDir = "assets/generated/tiles/ground_96"

local TILE = 96
local SHEET_COLS = 4
local SHEET_ROWS = 4

local tileOrder = {
  "full_01", "full_02", "full_03", "full_04",
  "edge_top", "edge_bottom", "edge_left", "edge_right",
  "outer_corner_tl", "outer_corner_tr", "outer_corner_bl", "outer_corner_br",
  "inner_corner_tl", "inner_corner_tr", "inner_corner_bl", "inner_corner_br",
}

local materials = {
  grass = {
    base = Color{r=76,g=132,b=57,a=255},
    mid = Color{r=91,g=151,b=62,a=255},
    light = Color{r=135,g=190,b=78,a=255},
    hi = Color{r=184,g=226,b=106,a=255},
    dark = Color{r=45,g=88,b=43,a=255},
    deep = Color{r=29,g=64,b=34,a=255},
    side = Color{r=119,g=70,b=38,a=255},
    sideDark = Color{r=71,g=42,b=26,a=255},
    sideLight = Color{r=164,g=96,b=50,a=255},
    type = "grass"
  },
  earth = {
    base = Color{r=167,g=94,b=48,a=255},
    mid = Color{r=184,g=104,b=51,a=255},
    light = Color{r=214,g=137,b=68,a=255},
    hi = Color{r=234,g=166,b=86,a=255},
    dark = Color{r=118,g=65,b=38,a=255},
    deep = Color{r=73,g=42,b=29,a=255},
    side = Color{r=125,g=70,b=39,a=255},
    sideDark = Color{r=73,g=42,b=28,a=255},
    sideLight = Color{r=194,g=112,b=56,a=255},
    type = "earth"
  },
  stone = {
    base = Color{r=119,g=123,b=116,a=255},
    mid = Color{r=133,g=136,b=128,a=255},
    light = Color{r=168,g=170,b=158,a=255},
    hi = Color{r=207,g=207,b=192,a=255},
    dark = Color{r=83,g=87,b=83,a=255},
    deep = Color{r=55,g=60,b=59,a=255},
    side = Color{r=87,g=91,b=88,a=255},
    sideDark = Color{r=47,g=52,b=52,a=255},
    sideLight = Color{r=146,g=149,b=139,a=255},
    type = "stone"
  },
  clay = {
    base = Color{r=181,g=91,b=58,a=255},
    mid = Color{r=196,g=103,b=64,a=255},
    light = Color{r=228,g=134,b=82,a=255},
    hi = Color{r=246,g=166,b=104,a=255},
    dark = Color{r=124,g=61,b=44,a=255},
    deep = Color{r=83,g=42,b=33,a=255},
    side = Color{r=140,g=67,b=45,a=255},
    sideDark = Color{r=78,g=39,b=31,a=255},
    sideLight = Color{r=216,g=119,b=74,a=255},
    type = "clay"
  },
  farmland = {
    base = Color{r=113,g=69,b=42,a=255},
    mid = Color{r=139,g=82,b=47,a=255},
    light = Color{r=176,g=105,b=58,a=255},
    hi = Color{r=214,g=138,b=73,a=255},
    dark = Color{r=74,g=45,b=32,a=255},
    deep = Color{r=45,g=30,b=24,a=255},
    side = Color{r=102,g=59,b=36,a=255},
    sideDark = Color{r=58,g=36,b=28,a=255},
    sideLight = Color{r=162,g=94,b=51,a=255},
    type = "farmland"
  }
}

local materialOrder = { "grass", "earth", "stone", "clay", "farmland" }

local function pixel(img, x, y, color)
  x = math.floor(x)
  y = math.floor(y)
  if x >= 0 and y >= 0 and x < img.width and y < img.height then
    img:drawPixel(x, y, color)
  end
end

local function rect(img, x, y, w, h, color)
  for yy = y, y + h - 1 do
    for xx = x, x + w - 1 do
      pixel(img, xx, yy, color)
    end
  end
end

local function ellipse(img, cx, cy, rx, ry, color)
  for y = math.floor(cy - ry), math.ceil(cy + ry) do
    for x = math.floor(cx - rx), math.ceil(cx + rx) do
      local dx = (x - cx) / rx
      local dy = (y - cy) / ry
      if dx * dx + dy * dy <= 1 then
        pixel(img, x, y, color)
      end
    end
  end
end

local function line(img, x0, y0, x1, y1, color, thickness)
  thickness = thickness or 1
  x0, y0, x1, y1 = math.floor(x0), math.floor(y0), math.floor(x1), math.floor(y1)
  local dx = math.abs(x1 - x0)
  local sx = x0 < x1 and 1 or -1
  local dy = -math.abs(y1 - y0)
  local sy = y0 < y1 and 1 or -1
  local err = dx + dy
  local radius = math.floor(thickness / 2)
  while true do
    for oy = -radius, radius do
      for ox = -radius, radius do
        if ox * ox + oy * oy <= radius * radius + thickness then
          pixel(img, x0 + ox, y0 + oy, color)
        end
      end
    end
    if x0 == x1 and y0 == y1 then break end
    local e2 = 2 * err
    if e2 >= dy then err = err + dy; x0 = x0 + sx end
    if e2 <= dx then err = err + dx; y0 = y0 + sy end
  end
end

local function polygon(img, points, color)
  local minY, maxY = points[1][2], points[1][2]
  for _, p in ipairs(points) do
    minY = math.min(minY, p[2])
    maxY = math.max(maxY, p[2])
  end
  for y = minY, maxY do
    local nodes = {}
    local j = #points
    for i = 1, #points do
      local yi, yj = points[i][2], points[j][2]
      if (yi < y and yj >= y) or (yj < y and yi >= y) then
        local xi, xj = points[i][1], points[j][1]
        table.insert(nodes, math.floor(xi + (y - yi) / (yj - yi) * (xj - xi)))
      end
      j = i
    end
    table.sort(nodes)
    for i = 1, #nodes, 2 do
      if nodes[i + 1] then
        for x = nodes[i], nodes[i + 1] do
          pixel(img, x, y, color)
        end
      end
    end
  end
end

local function noiseValue(x, y, seed)
  local n = (
    x * 374761393 +
    y * 668265263 +
    seed * 1442695041 +
    x * y * 1274126177 +
    x * x * 15731 +
    y * y * 789221
  ) % 104729
  return n / 104729
end

local function speckle(img, ox, oy, p, seed, density, colors)
  for y = 5, 90, 3 do
    for x = 5, 90, 3 do
      local n = noiseValue(x, y, seed)
      if n < density then
        local c = colors[1 + math.floor(noiseValue(y, x, seed + 7) * #colors)]
        rect(img, ox + x, oy + y, 2, 2, c)
      end
    end
  end
end

local function grassBlade(img, x, y, p, scale)
  scale = scale or 1
  line(img, x, y, x - 3 * scale, y - 9 * scale, p.dark, 2)
  line(img, x + 2, y, x + 2, y - 11 * scale, p.light, 2)
  line(img, x + 4, y, x + 9 * scale, y - 8 * scale, p.dark, 2)
end

local function flower(img, x, y, p, yellow)
  local petal = yellow and Color{r=255,g=204,b=61,a=255} or Color{r=246,g=246,b=230,a=255}
  rect(img, x, y - 4, 4, 4, petal)
  rect(img, x - 4, y, 4, 4, petal)
  rect(img, x + 4, y, 4, 4, petal)
  rect(img, x, y + 4, 4, 4, petal)
  rect(img, x + 1, y + 1, 2, 2, yellow and Color{r=246,g=158,b=39,a=255} or Color{r=255,g=208,b=67,a=255})
  line(img, x + 2, y + 8, x + 2, y + 18, p.dark, 2)
end

local function pebble(img, x, y, p, size)
  size = size or 5
  ellipse(img, x, y, size, math.max(3, size - 2), p.deep)
  ellipse(img, x, y - 1, size - 1, math.max(2, size - 3), p.dark)
  rect(img, x - 2, y - 3, 3, 2, p.light)
end

local function crack(img, x, y, p, len)
  len = len or 18
  line(img, x, y, x + len * 0.45, y + 4, p.dark, 2)
  line(img, x + len * 0.45, y + 4, x + len, y - 5, p.deep, 2)
  line(img, x + len * 0.45, y + 4, x + len * 0.62, y + 12, p.dark, 1)
end

local function drawSurfaceDetails(img, ox, oy, p, variant)
  speckle(img, ox, oy, p, variant * 19, p.type == "grass" and 0.05 or p.type == "stone" and 0.07 or 0.04, { p.dark, p.light, p.mid })

  if p.type == "grass" then
    for i = 1, 9 + variant do
      local x = ox + 10 + ((i * 19 + variant * 7) % 76)
      local y = oy + 18 + ((i * 23 + variant * 11) % 62)
      grassBlade(img, x, y, p, 0.75)
    end
    if variant == 2 then flower(img, ox + 34, oy + 44, p, false) end
    if variant == 3 then flower(img, ox + 56, oy + 50, p, true) end
    if variant == 4 then
      flower(img, ox + 28, oy + 36, p, false)
      grassBlade(img, ox + 69, oy + 68, p, 1.15)
    end
  elseif p.type == "earth" then
    if variant >= 2 then pebble(img, ox + 30, oy + 55, materials.stone, 6) end
    if variant == 3 then
      line(img, ox + 46, oy + 38, ox + 62, oy + 51, p.dark, 2)
      line(img, ox + 52, oy + 46, ox + 47, oy + 58, p.deep, 1)
    end
    if variant == 4 then
      pebble(img, ox + 66, oy + 32, materials.stone, 4)
      line(img, ox + 21, oy + 70, ox + 36, oy + 68, p.light, 2)
    end
  elseif p.type == "stone" then
    crack(img, ox + 22, oy + 36, p, 33)
    if variant >= 2 then crack(img, ox + 48, oy + 66, p, 23) end
    if variant == 3 then pebble(img, ox + 29, oy + 64, p, 4) end
    if variant == 4 then
      line(img, ox + 36, oy + 37, ox + 69, oy + 30, Color{r=96,g=115,b=61,a=255}, 3)
      line(img, ox + 41, oy + 45, ox + 70, oy + 53, Color{r=96,g=115,b=61,a=255}, 3)
    end
  elseif p.type == "clay" then
    crack(img, ox + 24, oy + 51, p, 24)
    if variant == 2 then crack(img, ox + 49, oy + 33, p, 25) end
    if variant == 3 then ellipse(img, ox + 48, oy + 50, 11, 7, p.dark); ellipse(img, ox + 47, oy + 48, 8, 4, p.light) end
    if variant == 4 then
      pebble(img, ox + 34, oy + 36, materials.stone, 5)
      pebble(img, ox + 67, oy + 62, materials.stone, 7)
    end
  elseif p.type == "farmland" then
    for x = 14, 86, 18 do
      line(img, ox + x, oy + 8, ox + x - 5, oy + 88, p.deep, 7)
      line(img, ox + x + 4, oy + 9, ox + x - 1, oy + 88, p.light, 3)
    end
    if variant >= 2 then
      for i = 1, 5 do pebble(img, ox + 18 + i * 11, oy + 30 + (i % 2) * 24, p, 3) end
    end
    if variant == 4 then
      for y = 24, 74, 24 do
        for x = 25, 72, 24 do
          grassBlade(img, ox + x, oy + y, materials.grass, 0.55)
        end
      end
    end
  end
end

local function drawBase(img, ox, oy, p, variant)
  rect(img, ox, oy, TILE, TILE, p.mid)
  speckle(img, ox, oy, p, variant * 41, p.type == "farmland" and 0.02 or 0.035, { p.base, p.light, p.dark })
  drawSurfaceDetails(img, ox, oy, p, variant)
end

local function drawEdgeBand(img, ox, oy, p, side)
  local jag = { 0, 3, 1, 5, 2, 0, 4, 1, 3, 0, 2, 5 }
  if side == "top" then
    for x = 0, TILE - 1, 8 do
      local h = 9 + jag[(x / 8) % #jag + 1]
      rect(img, ox + x, oy, 8, h, p.deep)
      rect(img, ox + x, oy + h - 3, 8, 4, p.dark)
      rect(img, ox + x + 2, oy + h, 4, 3, p.light)
    end
  elseif side == "bottom" then
    for x = 0, TILE - 1, 8 do
      local h = 15 + jag[(x / 8) % #jag + 1]
      rect(img, ox + x, oy + TILE - h, 8, h, p.side)
      rect(img, ox + x, oy + TILE - 5, 8, 5, p.sideDark)
      rect(img, ox + x + 1, oy + TILE - h + 2, 5, 5, p.sideLight)
      rect(img, ox + x, oy + TILE - h, 8, 4, p.deep)
    end
  elseif side == "left" then
    for y = 0, TILE - 1, 8 do
      local w = 10 + jag[(y / 8) % #jag + 1]
      rect(img, ox, oy + y, w, 8, p.deep)
      rect(img, ox + w - 3, oy + y, 4, 8, p.dark)
      rect(img, ox + w, oy + y + 2, 3, 4, p.light)
    end
  elseif side == "right" then
    for y = 0, TILE - 1, 8 do
      local w = 10 + jag[(y / 8) % #jag + 1]
      rect(img, ox + TILE - w, oy + y, w, 8, p.deep)
      rect(img, ox + TILE - w, oy + y, 4, 8, p.dark)
      rect(img, ox + TILE - w - 2, oy + y + 2, 3, 4, p.light)
    end
  end
end

local function drawInnerCorner(img, ox, oy, p, corner)
  local cx = corner:find("r") and ox + TILE - 1 or ox
  local cy = corner:find("b") and oy + TILE - 1 or oy
  local sx = corner:find("r") and -1 or 1
  local sy = corner:find("b") and -1 or 1
  for r = 0, 30 do
    for a = 0, r do
      local x = cx + sx * a
      local y = cy + sy * (r - a)
      pixel(img, x, y, p.deep)
    end
  end
  ellipse(img, cx + sx * 30, cy + sy * 30, 25, 25, p.dark)
  ellipse(img, cx + sx * 34, cy + sy * 34, 18, 18, p.base)
end

local function drawTile(img, ox, oy, p, tileName, variant)
  drawBase(img, ox, oy, p, variant)
  if tileName == "edge_top" then drawEdgeBand(img, ox, oy, p, "top") end
  if tileName == "edge_bottom" then drawEdgeBand(img, ox, oy, p, "bottom") end
  if tileName == "edge_left" then drawEdgeBand(img, ox, oy, p, "left") end
  if tileName == "edge_right" then drawEdgeBand(img, ox, oy, p, "right") end
  if tileName == "outer_corner_tl" then drawEdgeBand(img, ox, oy, p, "top"); drawEdgeBand(img, ox, oy, p, "left") end
  if tileName == "outer_corner_tr" then drawEdgeBand(img, ox, oy, p, "top"); drawEdgeBand(img, ox, oy, p, "right") end
  if tileName == "outer_corner_bl" then drawEdgeBand(img, ox, oy, p, "bottom"); drawEdgeBand(img, ox, oy, p, "left") end
  if tileName == "outer_corner_br" then drawEdgeBand(img, ox, oy, p, "bottom"); drawEdgeBand(img, ox, oy, p, "right") end
  if tileName == "inner_corner_tl" then drawInnerCorner(img, ox, oy, p, "tl") end
  if tileName == "inner_corner_tr" then drawInnerCorner(img, ox, oy, p, "tr") end
  if tileName == "inner_corner_bl" then drawInnerCorner(img, ox, oy, p, "bl") end
  if tileName == "inner_corner_br" then drawInnerCorner(img, ox, oy, p, "br") end
end

local renderedSheets = {}

for _, materialName in ipairs(materialOrder) do
  local p = materials[materialName]
  local sprite = Sprite(SHEET_COLS * TILE, SHEET_ROWS * TILE)
  sprite.filename = app.fs.joinPath(sourceDir, materialName .. "_tileset_96.aseprite")
  local img = sprite.cels[1].image
  img:clear(Color{r=0,g=0,b=0,a=0})
  for index, tileName in ipairs(tileOrder) do
    local col = (index - 1) % SHEET_COLS
    local row = math.floor((index - 1) / SHEET_COLS)
    drawTile(img, col * TILE, row * TILE, p, tileName, math.min(index, 4))
  end
  app.command.SaveFileAs{filename=sprite.filename}
  app.command.SaveFileCopyAs{filename=app.fs.joinPath(outputDir, materialName .. "_tileset_96.png")}
  renderedSheets[materialName] = img:clone()
  sprite:close()
end

local function drawTransition(img, ox, oy, from, to, direction, seed)
  local a = materials[from]
  local b = materials[to]
  rect(img, ox, oy, TILE, TILE, a.mid)
  for y = 0, TILE - 1 do
    for x = 0, TILE - 1 do
      local t
      if direction == "right" then t = x / (TILE - 1)
      elseif direction == "left" then t = 1 - x / (TILE - 1)
      elseif direction == "bottom" then t = y / (TILE - 1)
      else t = 1 - y / (TILE - 1) end
      local lowFreq = noiseValue(math.floor(x / 8), math.floor(y / 8), seed) - 0.5
      local rough = lowFreq * 0.22
      local blend = t + rough
      if blend > 0.49 then
        pixel(img, ox + x, oy + y, b.mid)
      elseif blend > 0.40 then
        local checker = (x + y + seed) % 5
        pixel(img, ox + x, oy + y, checker <= 1 and b.base or a.base)
      elseif noiseValue(x, y, seed + 11) > 0.975 then
        pixel(img, ox + x, oy + y, a.light)
      end
    end
  end
  speckle(img, ox, oy, a, seed + 3, 0.02, { a.dark, a.light })
  speckle(img, ox, oy, b, seed + 9, 0.02, { b.dark, b.light })
end

local transitionPairs = {
  { "grass", "earth" },
  { "earth", "stone" },
  { "earth", "clay" },
  { "earth", "farmland" },
  { "grass", "stone" },
}
local directions = { "right", "left", "bottom", "top" }
local transitionSprite = Sprite(4 * TILE, #transitionPairs * TILE)
transitionSprite.filename = app.fs.joinPath(sourceDir, "ground_transitions_96.aseprite")
local transitionImg = transitionSprite.cels[1].image
transitionImg:clear(Color{r=0,g=0,b=0,a=0})
for row, pair in ipairs(transitionPairs) do
  for col, direction in ipairs(directions) do
    drawTransition(transitionImg, (col - 1) * TILE, (row - 1) * TILE, pair[1], pair[2], direction, row * 31 + col)
  end
end
app.command.SaveFileAs{filename=transitionSprite.filename}
app.command.SaveFileCopyAs{filename=app.fs.joinPath(outputDir, "ground_transitions_96.png")}
local renderedTransitions = transitionImg:clone()
transitionSprite:close()

local previewSprite = Sprite(5 * 384, 384)
previewSprite.filename = app.fs.joinPath(outputDir, "ground_tiles_preview.png")
local previewImg = previewSprite.cels[1].image
previewImg:clear(Color{r=0,g=0,b=0,a=0})
for materialIndex, materialName in ipairs(materialOrder) do
  local sheet = renderedSheets[materialName]
  local offsetX = (materialIndex - 1) * 384
  for y = 0, 383 do
    for x = 0, 383 do
      previewImg:drawPixel(offsetX + x, y, sheet:getPixel(x, y))
    end
  end
end
app.command.SaveFileCopyAs{filename=previewSprite.filename}
previewSprite:close()

local transitionPreview = Sprite(#transitionPairs * 384, 96)
transitionPreview.filename = app.fs.joinPath(outputDir, "ground_transitions_preview.png")
local transitionPreviewImg = transitionPreview.cels[1].image
transitionPreviewImg:clear(Color{r=0,g=0,b=0,a=0})
for pairIndex = 0, #transitionPairs - 1 do
  for step = 0, 3 do
    for y = 0, 95 do
      for x = 0, 95 do
        transitionPreviewImg:drawPixel(pairIndex * 384 + step * 96 + x, y, renderedTransitions:getPixel(step * 96 + x, pairIndex * 96 + y))
      end
    end
  end
end
app.command.SaveFileCopyAs{filename=transitionPreview.filename}
transitionPreview:close()

local compW, compH = 7 * TILE, 5 * TILE
local compSprite = Sprite(compW, compH)
compSprite.filename = app.fs.joinPath(outputDir, "ground_tiles_composition_preview.png")
local comp = compSprite.cels[1].image
comp:clear(Color{r=0,g=0,b=0,a=0})
local layout = {
  {"grass","grass","grass","grass","grass","stone","stone"},
  {"grass","grass","earth","earth","grass","stone","stone"},
  {"grass","earth","earth","clay","clay","earth","grass"},
  {"grass","grass","earth","farmland","farmland","farmland","grass"},
  {"grass","grass","earth","farmland","farmland","farmland","grass"},
}
for row = 1, #layout do
  for col = 1, #layout[row] do
    local materialName = layout[row][col]
    local source = renderedSheets[materialName]
    local variant = ((row + col) % 4)
    local sx = variant * TILE
    for y = 0, 95 do
      for x = 0, 95 do
        comp:drawPixel((col - 1) * TILE + x, (row - 1) * TILE + y, source:getPixel(sx + x, y))
      end
    end
  end
end
drawTransition(comp, 2 * TILE, 1 * TILE, "grass", "earth", "right", 122)
drawTransition(comp, 4 * TILE, 2 * TILE, "clay", "earth", "right", 144)
drawTransition(comp, 3 * TILE, 3 * TILE, "earth", "farmland", "right", 166)
drawTransition(comp, 4 * TILE, 0 * TILE, "grass", "stone", "right", 188)
app.command.SaveFileCopyAs{filename=compSprite.filename}
compSprite:close()
