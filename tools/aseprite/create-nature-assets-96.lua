local TILE = 96

local paths = {
  waterSource = "assets/source/aseprite/tiles/water_96",
  waterOutput = "assets/generated/tiles/water_96",
  moistSource = "assets/source/aseprite/tiles/moist_earth_96",
  moistOutput = "assets/generated/tiles/moist_earth_96",
  treeSource = "assets/source/aseprite/objects/trees",
  treeOutput = "assets/generated/objects/trees",
  bushSource = "assets/source/aseprite/objects/berry_bushes",
  bushOutput = "assets/generated/objects/berry_bushes",
  naturePreview = "assets/generated/objects/nature_96_composition_preview.png"
}

local tileOrder = {
  "full_01", "full_02", "full_03", "full_04",
  "edge_top", "edge_bottom", "edge_left", "edge_right",
  "outer_corner_tl", "outer_corner_tr", "outer_corner_bl", "outer_corner_br",
  "inner_corner_tl", "inner_corner_tr", "inner_corner_bl", "inner_corner_br",
}

local C = {
  clear = Color{r=0,g=0,b=0,a=0},
  waterDeep = Color{r=38,g=92,b=127,a=255},
  waterMid = Color{r=53,g=132,b=164,a=255},
  waterLight = Color{r=87,g=176,b=202,a=255},
  waterHi = Color{r=174,g=234,b=235,a=255},
  waterFoam = Color{r=210,g=248,b=237,a=210},
  earthDeep = Color{r=63,g=42,b=31,a=255},
  earthDark = Color{r=92,g=61,b=42,a=255},
  earthMid = Color{r=133,g=85,b=50,a=255},
  earthLight = Color{r=188,g=122,b=66,a=255},
  moistDeep = Color{r=39,g=35,b=32,a=255},
  moistDark = Color{r=65,g=55,b=45,a=255},
  moistMid = Color{r=88,g=72,b=54,a=255},
  moistLight = Color{r=123,g=101,b=72,a=255},
  moistBlue = Color{r=82,g=121,b=133,a=255},
  grassDark = Color{r=42,g=87,b=41,a=255},
  grassMid = Color{r=75,g=133,b=56,a=255},
  grassLight = Color{r=129,g=185,b=76,a=255},
  leafDeep = Color{r=24,g=66,b=33,a=255},
  leafDark = Color{r=42,g=103,b=45,a=255},
  leafMid = Color{r=72,g=145,b=58,a=255},
  leafLight = Color{r=134,g=190,b=78,a=255},
  leafHi = Color{r=183,g=222,b=104,a=255},
  trunkDeep = Color{r=68,g=39,b=24,a=255},
  trunkDark = Color{r=99,g=57,b=31,a=255},
  trunkMid = Color{r=141,g=82,b=39,a=255},
  trunkLight = Color{r=190,g=121,b=62,a=255},
  berryDark = Color{r=112,g=36,b=55,a=255},
  berryMid = Color{r=184,g=50,b=76,a=255},
  berryLight = Color{r=239,g=95,b=101,a=255},
  flowerWhite = Color{r=247,g=239,b=210,a=255},
  flowerYellow = Color{r=255,g=204,b=67,a=255},
  stoneDark = Color{r=77,g=82,b=81,a=255},
  stoneMid = Color{r=126,g=132,b=126,a=255},
  stoneLight = Color{r=186,g=188,b=174,a=255},
  clayDark = Color{r=119,g=60,b=43,a=255},
  clayMid = Color{r=190,g=98,b=63,a=255},
  clayLight = Color{r=230,g=135,b=84,a=255}
}

local function pixel(img, x, y, color)
  x = math.floor(x)
  y = math.floor(y)
  if x >= 0 and y >= 0 and x < img.width and y < img.height then
    img:drawPixel(x, y, color)
  end
end

local function rect(img, x, y, w, h, color)
  for yy = math.floor(y), math.floor(y + h - 1) do
    for xx = math.floor(x), math.floor(x + w - 1) do
      pixel(img, xx, yy, color)
    end
  end
end

local function ellipse(img, cx, cy, rx, ry, color)
  if rx <= 0 or ry <= 0 then return end
  for y = math.floor(cy - ry), math.ceil(cy + ry) do
    for x = math.floor(cx - rx), math.ceil(cx + rx) do
      local dx = (x - cx) / rx
      local dy = (y - cy) / ry
      if dx * dx + dy * dy <= 1 then pixel(img, x, y, color) end
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

local function copyImage(source, target, sx, sy, w, h, tx, ty)
  for y = 0, h - 1 do
    for x = 0, w - 1 do
      target:drawPixel(tx + x, ty + y, source:getPixel(sx + x, sy + y))
    end
  end
end

local function copyOpaqueImage(source, target, sx, sy, w, h, tx, ty)
  for y = 0, h - 1 do
    for x = 0, w - 1 do
      local color = source:getPixel(sx + x, sy + y)
      if app.pixelColor.rgbaA(color) > 0 then
        target:drawPixel(tx + x, ty + y, color)
      end
    end
  end
end

local function fillChecker(img, w, h, a, b)
  for y = 0, h - 1 do
    for x = 0, w - 1 do
      local check = (math.floor(x / 16) + math.floor(y / 16)) % 2
      pixel(img, x, y, check == 0 and a or b)
    end
  end
end

local function saveSprite(sprite, sourcePath, outputPath)
  sprite.filename = sourcePath
  app.command.SaveFileAs{filename=sourcePath}
  app.command.SaveFileCopyAs{filename=outputPath}
end

local function speckle(img, ox, oy, seed, density, colors)
  for y = 5, TILE - 6, 3 do
    for x = 5, TILE - 6, 3 do
      if noiseValue(x, y, seed) < density then
        local index = 1 + math.floor(noiseValue(y, x, seed + 7) * #colors)
        rect(img, ox + x, oy + y, 2, 2, colors[index])
      end
    end
  end
end

local function pebble(img, x, y, size)
  ellipse(img, x, y, size, math.max(2, size - 2), C.stoneDark)
  ellipse(img, x, y - 1, size - 1, math.max(1, size - 3), C.stoneMid)
  rect(img, x - 2, y - 3, 3, 2, C.stoneLight)
end

local function drawWaterSurface(img, ox, oy, variant, frame)
  frame = frame or 0
  rect(img, ox, oy, TILE, TILE, C.waterMid)
  for y = 0, TILE - 1 do
    for x = 0, TILE - 1 do
      local n = noiseValue(math.floor((x + frame * 5) / 8), math.floor(y / 7), variant * 31 + frame)
      if n < 0.22 then pixel(img, ox + x, oy + y, C.waterDeep)
      elseif n > 0.86 then pixel(img, ox + x, oy + y, C.waterLight) end
    end
  end
  for i = 1, 8 do
    local y = oy + 12 + ((i * 15 + variant * 11 + frame * 4) % 70)
    local x = ox + 8 + ((i * 23 + variant * 17 + frame * 6) % 76)
    line(img, x, y, x + 14 + (i % 3) * 4, y - 2 + (i % 2), C.waterLight, 2)
    if i % 3 == frame % 3 then line(img, x + 3, y - 2, x + 8, y - 2, C.waterHi, 1) end
  end
  if variant >= 3 then
    rect(img, ox + 20 + frame, oy + 24, 4, 2, C.waterHi)
    rect(img, ox + 65 - frame, oy + 61, 5, 2, C.waterHi)
  end
end

local function drawMoistSurface(img, ox, oy, variant)
  rect(img, ox, oy, TILE, TILE, C.moistMid)
  speckle(img, ox, oy, variant * 37, 0.075, { C.moistDark, C.moistLight, C.moistBlue })
  for i = 1, 5 do
    local x = ox + 14 + ((i * 19 + variant * 13) % 68)
    local y = oy + 18 + ((i * 17 + variant * 23) % 58)
    line(img, x, y, x + 11, y + 3, C.moistDark, 2)
    if i % 2 == 0 then rect(img, x + 4, y - 2, 5, 2, C.moistBlue) end
  end
  if variant == 2 then pebble(img, ox + 30, oy + 55, 5) end
  if variant == 3 then
    ellipse(img, ox + 62, oy + 38, 10, 6, C.moistDark)
    ellipse(img, ox + 62, oy + 36, 7, 3, C.moistBlue)
  end
  if variant == 4 then
    line(img, ox + 21, oy + 70, ox + 42, oy + 66, C.moistLight, 2)
    pebble(img, ox + 67, oy + 61, 4)
  end
end

local function drawTileEdge(img, ox, oy, side, dark, mid, light)
  local jag = { 0, 3, 1, 5, 2, 0, 4, 1, 3, 0, 2, 5 }
  if side == "top" then
    for x = 0, TILE - 1, 8 do
      local h = 8 + jag[(x / 8) % #jag + 1]
      rect(img, ox + x, oy, 8, h, dark)
      rect(img, ox + x + 1, oy + h - 2, 6, 3, light)
    end
  elseif side == "bottom" then
    for x = 0, TILE - 1, 8 do
      local h = 13 + jag[(x / 8) % #jag + 1]
      rect(img, ox + x, oy + TILE - h, 8, h, mid)
      rect(img, ox + x, oy + TILE - 5, 8, 5, dark)
      rect(img, ox + x + 1, oy + TILE - h + 2, 5, 4, light)
    end
  elseif side == "left" then
    for y = 0, TILE - 1, 8 do
      local w = 8 + jag[(y / 8) % #jag + 1]
      rect(img, ox, oy + y, w, 8, dark)
      rect(img, ox + w - 2, oy + y + 1, 3, 6, light)
    end
  elseif side == "right" then
    for y = 0, TILE - 1, 8 do
      local w = 8 + jag[(y / 8) % #jag + 1]
      rect(img, ox + TILE - w, oy + y, w, 8, dark)
      rect(img, ox + TILE - w, oy + y + 1, 3, 6, light)
    end
  end
end

local function drawConcaveCorner(img, ox, oy, tileName, dark, light)
  local left = tileName:find("_tl") or tileName:find("_bl")
  local top = tileName:find("_tl") or tileName:find("_tr")
  local cornerX = left and 0 or TILE - 1
  local cornerY = top and 0 or TILE - 1
  local sx = left and 1 or -1
  local sy = top and 1 or -1
  local seed = (tileName:find("_tl") and 13) or (tileName:find("_tr") and 29) or (tileName:find("_bl") and 43) or 61
  for yy = 0, 34 do
    for xx = 0, 34 do
      local d = math.sqrt(xx * xx + yy * yy)
      local rough = (noiseValue(math.floor(xx / 4), math.floor(yy / 4), seed) - 0.5) * 7
      local x = ox + cornerX + sx * xx
      local y = oy + cornerY + sy * yy
      if d >= 21 + rough and d <= 26 + rough then
        pixel(img, x, y, dark)
      elseif d >= 17 + rough and d < 21 + rough and ((xx + yy + seed) % 3 ~= 0) then
        pixel(img, x, y, light)
      end
    end
  end
end

local function drawWaterTile(img, ox, oy, tileName, variant)
  drawWaterSurface(img, ox, oy, variant, 0)
  if tileName == "edge_top" then drawTileEdge(img, ox, oy, "top", C.waterDeep, C.waterMid, C.waterFoam) end
  if tileName == "edge_bottom" then drawTileEdge(img, ox, oy, "bottom", C.waterDeep, C.waterMid, C.waterFoam) end
  if tileName == "edge_left" then drawTileEdge(img, ox, oy, "left", C.waterDeep, C.waterMid, C.waterFoam) end
  if tileName == "edge_right" then drawTileEdge(img, ox, oy, "right", C.waterDeep, C.waterMid, C.waterFoam) end
  if tileName == "outer_corner_tl" then drawTileEdge(img, ox, oy, "top", C.waterDeep, C.waterMid, C.waterFoam); drawTileEdge(img, ox, oy, "left", C.waterDeep, C.waterMid, C.waterFoam) end
  if tileName == "outer_corner_tr" then drawTileEdge(img, ox, oy, "top", C.waterDeep, C.waterMid, C.waterFoam); drawTileEdge(img, ox, oy, "right", C.waterDeep, C.waterMid, C.waterFoam) end
  if tileName == "outer_corner_bl" then drawTileEdge(img, ox, oy, "bottom", C.waterDeep, C.waterMid, C.waterFoam); drawTileEdge(img, ox, oy, "left", C.waterDeep, C.waterMid, C.waterFoam) end
  if tileName == "outer_corner_br" then drawTileEdge(img, ox, oy, "bottom", C.waterDeep, C.waterMid, C.waterFoam); drawTileEdge(img, ox, oy, "right", C.waterDeep, C.waterMid, C.waterFoam) end
  if tileName:find("inner_corner") then
    drawConcaveCorner(img, ox, oy, tileName, C.waterDeep, C.waterFoam)
  end
end

local function drawMoistTile(img, ox, oy, tileName, variant)
  drawMoistSurface(img, ox, oy, variant)
  if tileName == "edge_top" then drawTileEdge(img, ox, oy, "top", C.moistDeep, C.moistDark, C.moistLight) end
  if tileName == "edge_bottom" then drawTileEdge(img, ox, oy, "bottom", C.moistDeep, C.moistDark, C.moistLight) end
  if tileName == "edge_left" then drawTileEdge(img, ox, oy, "left", C.moistDeep, C.moistDark, C.moistLight) end
  if tileName == "edge_right" then drawTileEdge(img, ox, oy, "right", C.moistDeep, C.moistDark, C.moistLight) end
  if tileName == "outer_corner_tl" then drawTileEdge(img, ox, oy, "top", C.moistDeep, C.moistDark, C.moistLight); drawTileEdge(img, ox, oy, "left", C.moistDeep, C.moistDark, C.moistLight) end
  if tileName == "outer_corner_tr" then drawTileEdge(img, ox, oy, "top", C.moistDeep, C.moistDark, C.moistLight); drawTileEdge(img, ox, oy, "right", C.moistDeep, C.moistDark, C.moistLight) end
  if tileName == "outer_corner_bl" then drawTileEdge(img, ox, oy, "bottom", C.moistDeep, C.moistDark, C.moistLight); drawTileEdge(img, ox, oy, "left", C.moistDeep, C.moistDark, C.moistLight) end
  if tileName == "outer_corner_br" then drawTileEdge(img, ox, oy, "bottom", C.moistDeep, C.moistDark, C.moistLight); drawTileEdge(img, ox, oy, "right", C.moistDeep, C.moistDark, C.moistLight) end
  if tileName:find("inner_corner") then
    drawConcaveCorner(img, ox, oy, tileName, C.moistDeep, C.moistLight)
  end
end

local function drawTransition(img, ox, oy, fromKind, toKind, direction, seed)
  local function tone(kind, level)
    if kind == "water" then return level == "dark" and C.waterDeep or level == "light" and C.waterLight or C.waterMid end
    if kind == "moist" then return level == "dark" and C.moistDark or level == "light" and C.moistLight or C.moistMid end
    if kind == "grass" then return level == "dark" and C.grassDark or level == "light" and C.grassLight or C.grassMid end
    if kind == "stone" then return level == "dark" and C.stoneDark or level == "light" and C.stoneLight or C.stoneMid end
    if kind == "clay" then return level == "dark" and C.clayDark or level == "light" and C.clayLight or C.clayMid end
    return level == "dark" and C.earthDark or level == "light" and C.earthLight or C.earthMid
  end
  local from = tone(fromKind, "mid")
  local to = tone(toKind, "mid")
  local fromDark = tone(fromKind, "dark")
  local toLight = tone(toKind, "light")
  rect(img, ox, oy, TILE, TILE, from)
  for y = 0, TILE - 1 do
    for x = 0, TILE - 1 do
      local t
      if direction == "right" then t = x / (TILE - 1)
      elseif direction == "left" then t = 1 - x / (TILE - 1)
      elseif direction == "bottom" then t = y / (TILE - 1)
      else t = 1 - y / (TILE - 1) end
      local rough = (noiseValue(math.floor(x / 6), math.floor(y / 6), seed) - 0.5) * 0.26
      if t + rough > 0.48 then
        pixel(img, ox + x, oy + y, to)
      elseif t + rough > 0.39 then
        pixel(img, ox + x, oy + y, ((x + y + seed) % 3 == 0) and toLight or fromDark)
      end
    end
  end
  if fromKind == "water" or toKind == "water" then
    for i = 1, 6 do
      local x = ox + 10 + ((i * 19 + seed) % 72)
      local y = oy + 15 + ((i * 23 + seed) % 64)
      line(img, x, y, x + 10, y - 1, C.waterFoam, 1)
    end
  end
end

local function makeTileSheet(name, sourceDir, outputDir, drawTileFn)
  local sprite = Sprite(4 * TILE, 4 * TILE)
  local img = sprite.cels[1].image
  img:clear(C.clear)
  for index, tileName in ipairs(tileOrder) do
    local col = (index - 1) % 4
    local row = math.floor((index - 1) / 4)
    drawTileFn(img, col * TILE, row * TILE, tileName, math.min(index, 4))
  end
  saveSprite(sprite, app.fs.joinPath(sourceDir, name .. ".aseprite"), app.fs.joinPath(outputDir, name .. ".png"))
  local clone = img:clone()
  sprite:close()
  return clone
end

local waterSheet = makeTileSheet("water_tileset_96", paths.waterSource, paths.waterOutput, drawWaterTile)
local moistSheet = makeTileSheet("moist_earth_tileset_96", paths.moistSource, paths.moistOutput, drawMoistTile)

local waterAnim = Sprite(4 * TILE, TILE)
local waterAnimImg = waterAnim.cels[1].image
waterAnimImg:clear(C.clear)
for frame = 0, 3 do drawWaterSurface(waterAnimImg, frame * TILE, 0, frame + 1, frame) end
saveSprite(waterAnim, app.fs.joinPath(paths.waterSource, "water_animation_96.aseprite"), app.fs.joinPath(paths.waterOutput, "water_animation_96.png"))
local waterAnimClone = waterAnimImg:clone()
waterAnim:close()

local waterTransitionPairs = {
  {"water", "earth"},
  {"water", "grass"},
  {"water", "moist"},
  {"water", "stone"},
  {"water", "clay"}
}
local directions = {"right", "left", "bottom", "top"}
local waterTrans = Sprite(4 * TILE, #waterTransitionPairs * TILE)
local waterTransImg = waterTrans.cels[1].image
waterTransImg:clear(C.clear)
for row, pair in ipairs(waterTransitionPairs) do
  for col, dir in ipairs(directions) do
    drawTransition(waterTransImg, (col - 1) * TILE, (row - 1) * TILE, pair[1], pair[2], dir, row * 41 + col)
  end
end
saveSprite(waterTrans, app.fs.joinPath(paths.waterSource, "water_transitions_96.aseprite"), app.fs.joinPath(paths.waterOutput, "water_transitions_96.png"))
local waterTransClone = waterTransImg:clone()
waterTrans:close()

local moistTrans = Sprite(4 * TILE, 2 * TILE)
local moistTransImg = moistTrans.cels[1].image
moistTransImg:clear(C.clear)
local moistPairs = { {"moist", "earth"}, {"moist", "water"} }
for row, pair in ipairs(moistPairs) do
  for col, dir in ipairs(directions) do
    drawTransition(moistTransImg, (col - 1) * TILE, (row - 1) * TILE, pair[1], pair[2], dir, row * 53 + col)
  end
end
saveSprite(moistTrans, app.fs.joinPath(paths.moistSource, "moist_earth_transitions_96.aseprite"), app.fs.joinPath(paths.moistOutput, "moist_earth_transitions_96.png"))
local moistTransClone = moistTransImg:clone()
moistTrans:close()

local function drawLeafCluster(img, x, y, rx, ry, variant)
  ellipse(img, x + 2, y + 4, rx + 2, ry + 2, C.leafDeep)
  ellipse(img, x, y, rx, ry, C.leafDark)
  ellipse(img, x - 2, y - 2, math.max(3, rx - 4), math.max(3, ry - 4), C.leafMid)
  if variant % 2 == 0 then ellipse(img, x - rx * 0.25, y - ry * 0.25, math.max(2, rx * 0.35), math.max(2, ry * 0.25), C.leafLight) end
  if variant % 3 == 0 then rect(img, x + rx * 0.15, y - ry * 0.45, 4, 3, C.leafHi) end
end

local function eraseLeafGaps(img, cx, cy, variant)
  for i = 1, 9 do
    local x = cx - 48 + ((i * 23 + variant * 17) % 96)
    local y = cy - 45 + ((i * 19 + variant * 11) % 72)
    ellipse(img, x, y, 3 + (i % 3), 2 + (i % 2), C.clear)
  end
end

local function drawTree(img, w, h, stage, variant)
  img:clear(C.clear)
  local baseX = math.floor(w / 2)
  local groundY = h - 12
  if stage == "sapling" then
    line(img, baseX, groundY, baseX - 2, groundY - 29, C.trunkDark, 4)
    line(img, baseX + 2, groundY - 11, baseX + 16, groundY - 24, C.leafDark, 3)
    line(img, baseX - 1, groundY - 16, baseX - 14, groundY - 28, C.leafMid, 3)
    ellipse(img, baseX + 15, groundY - 25, 8, 5, C.leafLight)
    ellipse(img, baseX - 15, groundY - 29, 7, 5, C.leafMid)
    rect(img, baseX - 2, groundY - 31, 3, 12, C.trunkLight)
  elseif stage == "young" then
    rect(img, baseX - 5, groundY - 42, 10, 42, C.trunkDark)
    rect(img, baseX - 2, groundY - 42, 4, 36, C.trunkLight)
    drawLeafCluster(img, baseX - 18, groundY - 54, 21, 18, variant)
    drawLeafCluster(img, baseX + 18, groundY - 56, 22, 18, variant + 1)
    drawLeafCluster(img, baseX, groundY - 74, 25, 21, variant + 2)
    eraseLeafGaps(img, baseX, groundY - 57, variant)
  elseif stage == "halfgrown" then
    rect(img, baseX - 7, groundY - 78, 14, 78, C.trunkDark)
    rect(img, baseX - 2, groundY - 76, 5, 62, C.trunkLight)
    line(img, baseX - 2, groundY - 52, baseX - 34, groundY - 91, C.trunkDark, 6)
    line(img, baseX + 3, groundY - 56, baseX + 34, groundY - 95, C.trunkDark, 6)
    drawLeafCluster(img, baseX - 31, groundY - 98, 29, 24, variant)
    drawLeafCluster(img, baseX + 31, groundY - 102, 31, 25, variant + 1)
    drawLeafCluster(img, baseX, groundY - 123, 36, 29, variant + 2)
    drawLeafCluster(img, baseX - 5, groundY - 83, 36, 23, variant + 3)
    eraseLeafGaps(img, baseX, groundY - 99, variant)
  else
    rect(img, baseX - 9, groundY - 99, 18, 99, C.trunkDeep)
    rect(img, baseX - 4, groundY - 99, 8, 86, C.trunkMid)
    rect(img, baseX + 2, groundY - 91, 4, 68, C.trunkLight)
    line(img, baseX - 4, groundY - 69, baseX - 50 - variant * 3, groundY - 118 + variant, C.trunkDark, 8)
    line(img, baseX + 4, groundY - 72, baseX + 47 + variant * 2, groundY - 126, C.trunkDark, 8)
    line(img, baseX, groundY - 89, baseX + (variant % 2 == 0 and 15 or -16), groundY - 148, C.trunkDark, 7)
    local shifts = {
      {-48, -122, 38, 30}, {48, -126, 40, 31}, {-18, -153, 45, 35}, {22, -155, 43, 34},
      {-63, -91, 34, 27}, {63, -96, 35, 27}, {-18, -100, 48, 32}, {27, -112, 43, 30}
    }
    for i, s in ipairs(shifts) do
      drawLeafCluster(img, baseX + s[1] + (variant % 3 - 1) * 3, groundY + s[2] + ((variant + i) % 3 - 1) * 2, s[3], s[4], variant + i)
    end
    eraseLeafGaps(img, baseX, groundY - 123, variant)
    for i = 1, 12 do
      local x = baseX - 70 + ((i * 31 + variant * 13) % 140)
      local y = groundY - 160 + ((i * 29 + variant * 19) % 87)
      rect(img, x, y, 5, 3, (i % 2 == 0) and C.leafHi or C.leafLight)
    end
  end
  ellipse(img, baseX, groundY + 3, math.max(9, w * 0.18), 7, Color{r=0,g=0,b=0,a=46})
end

local treeDefs = {
  { name="tree_sapling_01", w=96, h=96, stage="sapling", variant=1 },
  { name="tree_young_01", w=96, h=96, stage="young", variant=2 },
  { name="tree_halfgrown_01", w=96, h=192, stage="halfgrown", variant=3 },
  { name="tree_mature_01", w=192, h=192, stage="mature", variant=1 },
  { name="tree_mature_02", w=192, h=192, stage="mature", variant=2 },
  { name="tree_mature_03", w=192, h=192, stage="mature", variant=3 },
  { name="tree_mature_04", w=192, h=192, stage="mature", variant=4 },
}

local treeImages = {}
for _, def in ipairs(treeDefs) do
  local sprite = Sprite(def.w, def.h)
  drawTree(sprite.cels[1].image, def.w, def.h, def.stage, def.variant)
  saveSprite(sprite, app.fs.joinPath(paths.treeSource, def.name .. ".aseprite"), app.fs.joinPath(paths.treeOutput, def.name .. ".png"))
  treeImages[def.name] = sprite.cels[1].image:clone()
  sprite:close()
end

local stump = Sprite(96, 96)
local stumpImg = stump.cels[1].image
stumpImg:clear(C.clear)
ellipse(stumpImg, 48, 65, 23, 14, C.trunkDeep)
ellipse(stumpImg, 48, 60, 22, 13, C.trunkMid)
ellipse(stumpImg, 48, 59, 13, 8, C.trunkLight)
ellipse(stumpImg, 48, 59, 7, 4, C.trunkDark)
rect(stumpImg, 30, 60, 36, 15, C.trunkDark)
rect(stumpImg, 34, 59, 28, 11, C.trunkMid)
ellipse(stumpImg, 48, 77, 25, 6, Color{r=0,g=0,b=0,a=40})
saveSprite(stump, app.fs.joinPath(paths.treeSource, "tree_stump_01.aseprite"), app.fs.joinPath(paths.treeOutput, "tree_stump_01.png"))
treeImages.tree_stump_01 = stumpImg:clone()
stump:close()

local function drawBerryBush(img, w, h, stage, variant, ripe)
  img:clear(C.clear)
  local cx = math.floor(w / 2)
  local baseY = h - 17
  ellipse(img, cx, baseY + 3, 28 + variant * 2, 7, Color{r=0,g=0,b=0,a=38})
  local scale = stage == "small" and 0.56 or stage == "growing" and 0.78 or 1
  for i = 1, 8 do
    local angle = (i / 8) * 6.283
    local x = cx + math.cos(angle) * (22 * scale + (variant % 2) * 4)
    local y = baseY - 18 * scale + math.sin(angle) * (12 * scale)
    line(img, cx, baseY - 4, x, y, C.trunkDark, 3)
  end
  local clusters = {
    {-23, -20, 19, 13}, {0, -29, 24, 16}, {24, -20, 20, 13},
    {-10, -12, 22, 14}, {13, -9, 21, 13}
  }
  for i, s in ipairs(clusters) do
    drawLeafCluster(img, cx + s[1] * scale, baseY + s[2] * scale, s[3] * scale, s[4] * scale, variant + i)
  end
  eraseLeafGaps(img, cx, baseY - 20, variant + 3)
  if stage ~= "small" then
    local berryCount = ripe and (8 + variant) or 4
    for i = 1, berryCount do
      local x = cx - 25 * scale + ((i * 17 + variant * 11) % math.floor(50 * scale + 1))
      local y = baseY - 39 * scale + ((i * 13 + variant * 7) % math.floor(34 * scale + 1))
      local color = ripe and ((i % 3 == 0) and C.berryLight or C.berryMid) or C.berryDark
      ellipse(img, x, y, ripe and 4 or 3, ripe and 4 or 3, C.berryDark)
      ellipse(img, x - 1, y - 1, ripe and 3 or 2, ripe and 3 or 2, color)
      if ripe then rect(img, x - 1, y - 2, 2, 1, C.flowerWhite) end
    end
  end
end

local bushDefs = {
  { name="berry_bush_small_01", stage="small", variant=1, ripe=false },
  { name="berry_bush_growing_01", stage="growing", variant=2, ripe=false },
  { name="berry_bush_unripe_01", stage="mature", variant=1, ripe=false },
  { name="berry_bush_unripe_02", stage="mature", variant=3, ripe=false },
  { name="berry_bush_ripe_01", stage="mature", variant=1, ripe=true },
  { name="berry_bush_ripe_02", stage="mature", variant=2, ripe=true },
  { name="berry_bush_ripe_03", stage="mature", variant=3, ripe=true },
  { name="berry_bush_ripe_04", stage="mature", variant=4, ripe=true },
}

local bushImages = {}
for _, def in ipairs(bushDefs) do
  local sprite = Sprite(96, 96)
  drawBerryBush(sprite.cels[1].image, 96, 96, def.stage, def.variant, def.ripe)
  saveSprite(sprite, app.fs.joinPath(paths.bushSource, def.name .. ".aseprite"), app.fs.joinPath(paths.bushOutput, def.name .. ".png"))
  bushImages[def.name] = sprite.cels[1].image:clone()
  sprite:close()
end

local function makePreviewFromSheet(sheet, path, width, height)
  local sprite = Sprite(width, height)
  local img = sprite.cels[1].image
  img:clear(C.clear)
  copyImage(sheet, img, 0, 0, math.min(width, sheet.width), math.min(height, sheet.height), 0, 0)
  app.command.SaveFileCopyAs{filename=path}
  sprite:close()
end

makePreviewFromSheet(waterSheet, app.fs.joinPath(paths.waterOutput, "water_96_preview.png"), 384, 384)
makePreviewFromSheet(waterAnimClone, app.fs.joinPath(paths.waterOutput, "water_96_animation_preview.png"), 384, 96)
makePreviewFromSheet(waterTransClone, app.fs.joinPath(paths.waterOutput, "water_96_transitions_preview.png"), 384, #waterTransitionPairs * 96)
makePreviewFromSheet(moistSheet, app.fs.joinPath(paths.moistOutput, "moist_earth_96_preview.png"), 384, 384)
makePreviewFromSheet(moistTransClone, app.fs.joinPath(paths.moistOutput, "moist_earth_96_transitions_preview.png"), 384, 192)

local treePreview = Sprite(768, 320)
local treePreviewImg = treePreview.cels[1].image
fillChecker(treePreviewImg, 768, 320, C.grassMid, C.grassDark)
copyOpaqueImage(treeImages.tree_sapling_01, treePreviewImg, 0, 0, 96, 96, 0, 206)
copyOpaqueImage(treeImages.tree_young_01, treePreviewImg, 0, 0, 96, 96, 105, 206)
copyOpaqueImage(treeImages.tree_halfgrown_01, treePreviewImg, 0, 0, 96, 192, 210, 110)
copyOpaqueImage(treeImages.tree_mature_01, treePreviewImg, 0, 0, 192, 192, 320, 110)
copyOpaqueImage(treeImages.tree_mature_02, treePreviewImg, 0, 0, 192, 192, 480, 110)
copyOpaqueImage(treeImages.tree_stump_01, treePreviewImg, 0, 0, 96, 96, 672, 206)
app.command.SaveFileCopyAs{filename=app.fs.joinPath(paths.treeOutput, "tree_set_preview.png")}
treePreview:close()

local bushPreview = Sprite(8 * 96, 96)
local bushPreviewImg = bushPreview.cels[1].image
fillChecker(bushPreviewImg, 8 * 96, 96, C.grassMid, C.grassDark)
for index, def in ipairs(bushDefs) do
  copyOpaqueImage(bushImages[def.name], bushPreviewImg, 0, 0, 96, 96, (index - 1) * 96, 0)
end
app.command.SaveFileCopyAs{filename=app.fs.joinPath(paths.bushOutput, "berry_bush_set_preview.png")}
bushPreview:close()

local nature = Sprite(8 * 96, 5 * 96)
local natureImg = nature.cels[1].image
natureImg:clear(C.clear)
for row = 0, 4 do
  for col = 0, 7 do
    if row >= 3 and col >= 0 and col <= 2 then
      copyImage(waterSheet, natureImg, ((col + row) % 4) * TILE, 0, TILE, TILE, col * TILE, row * TILE)
    elseif row == 2 and col <= 2 then
      drawTransition(natureImg, col * TILE, row * TILE, "grass", "water", "bottom", 210 + col)
    elseif row == 3 and col == 3 then
      drawTransition(natureImg, col * TILE, row * TILE, "moist", "water", "left", 221)
    else
      rect(natureImg, col * TILE, row * TILE, TILE, TILE, C.grassMid)
      speckle(natureImg, col * TILE, row * TILE, row * 17 + col, 0.04, { C.grassDark, C.grassLight })
    end
  end
end
copyImage(moistSheet, natureImg, 0, 0, TILE, TILE, 3 * TILE, 3 * TILE)
copyImage(moistSheet, natureImg, TILE, 0, TILE, TILE, 4 * TILE, 3 * TILE)
copyOpaqueImage(treeImages.tree_mature_03, natureImg, 0, 0, 192, 192, 4 * TILE, 0)
copyOpaqueImage(treeImages.tree_mature_04, natureImg, 0, 0, 192, 192, 6 * TILE - 20, 1 * TILE)
copyOpaqueImage(treeImages.tree_young_01, natureImg, 0, 0, 96, 96, 3 * TILE, 1 * TILE + 36)
copyOpaqueImage(bushImages.berry_bush_ripe_02, natureImg, 0, 0, 96, 96, 1 * TILE, 1 * TILE)
copyOpaqueImage(bushImages.berry_bush_unripe_02, natureImg, 0, 0, 96, 96, 2 * TILE, 1 * TILE + 28)
copyOpaqueImage(bushImages.berry_bush_ripe_04, natureImg, 0, 0, 96, 96, 5 * TILE, 3 * TILE)
copyOpaqueImage(treeImages.tree_stump_01, natureImg, 0, 0, 96, 96, 6 * TILE, 3 * TILE)
app.command.SaveFileCopyAs{filename=paths.naturePreview}
nature:close()
