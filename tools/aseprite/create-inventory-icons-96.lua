local sourceDir = "assets/source/aseprite/icons/inventory_96"
local previewPath = "assets/generated/icons/inventory_96/inventory_icons_96_preview.png"
local uiPreviewPath = "assets/generated/icons/inventory_96/inventory_icons_96_ui_preview.png"

local icons = {
  "grass_block",
  "raw_wood_log",
  "grass_seeds",
  "stone",
  "clay",
  "workbench",
  "wooden_pickaxe",
  "wooden_spear",
  "wooden_slingshot",
  "wooden_bow",
  "wooden_arrows",
  "plant_fiber_rope",
  "grass_tuft",
  "small_rock",
  "yellow_ore_or_clay_lump",
}

local C = {
  clear = Color{r=0, g=0, b=0, a=0},
  shadow = Color{r=20, g=14, b=10, a=72},
  outline = Color{r=41, g=27, b=18, a=255},
  outline2 = Color{r=69, g=44, b=26, a=255},
  slot = Color{r=55, g=36, b=22, a=255},
  slot2 = Color{r=92, g=58, b=32, a=255},
  slotHi = Color{r=173, g=119, b=65, a=255},
  woodDeep = Color{r=72, g=39, b=22, a=255},
  woodDark = Color{r=100, g=55, b=27, a=255},
  wood = Color{r=143, g=82, b=39, a=255},
  woodLight = Color{r=198, g=125, b=59, a=255},
  woodHi = Color{r=234, g=171, b=89, a=255},
  dirtDark = Color{r=73, g=48, b=30, a=255},
  dirt = Color{r=118, g=73, b=42, a=255},
  dirtLight = Color{r=164, g=103, b=56, a=255},
  grassDeep = Color{r=35, g=76, b=34, a=255},
  grassDark = Color{r=53, g=101, b=41, a=255},
  grass = Color{r=86, g=148, b=55, a=255},
  grassLight = Color{r=137, g=197, b=72, a=255},
  grassHi = Color{r=181, g=232, b=96, a=255},
  leafDark = Color{r=31, g=87, b=32, a=255},
  leaf = Color{r=62, g=150, b=50, a=255},
  leafLight = Color{r=126, g=211, b=76, a=255},
  leafHi = Color{r=181, g=241, b=104, a=255},
  stoneDeep = Color{r=58, g=59, b=55, a=255},
  stoneDark = Color{r=83, g=84, b=78, a=255},
  stone = Color{r=130, g=130, b=119, a=255},
  stoneLight = Color{r=183, g=179, b=163, a=255},
  stoneHi = Color{r=221, g=216, b=197, a=255},
  clayDeep = Color{r=89, g=45, b=33, a=255},
  clayDark = Color{r=126, g=62, b=42, a=255},
  clay = Color{r=178, g=86, b=55, a=255},
  clayLight = Color{r=220, g=127, b=79, a=255},
  clayHi = Color{r=241, g=165, b=108, a=255},
  oreDeep = Color{r=111, g=72, b=25, a=255},
  oreDark = Color{r=151, g=98, b=31, a=255},
  ore = Color{r=202, g=135, b=42, a=255},
  oreLight = Color{r=238, g=184, b=72, a=255},
  oreHi = Color{r=255, g=219, b=111, a=255},
  ropeDeep = Color{r=33, g=86, b=27, a=255},
  ropeDark = Color{r=49, g=119, b=32, a=255},
  rope = Color{r=86, g=165, b=46, a=255},
  ropeLight = Color{r=146, g=216, b=82, a=255},
  ropeHi = Color{r=193, g=243, b=112, a=255},
  string = Color{r=229, g=205, b=155, a=255},
  stringDark = Color{r=155, g=116, b=74, a=255},
  metalDark = Color{r=88, g=91, b=88, a=255},
  metal = Color{r=166, g=169, b=161, a=255},
  metalLight = Color{r=229, g=229, b=214, a=255},
  feather = Color{r=241, g=228, b=197, a=255},
  featherShade = Color{r=185, g=147, b=96, a=255},
  band = Color{r=82, g=48, b=29, a=255},
}

local function pixel(img, x, y, color)
  x = math.floor(x)
  y = math.floor(y)
  if x >= 0 and x < img.width and y >= 0 and y < img.height then
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
    if e2 >= dy then
      err = err + dy
      x0 = x0 + sx
    end
    if e2 <= dx then
      err = err + dx
      y0 = y0 + sy
    end
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

local function outlinePolygon(img, points, color, thickness)
  for i = 1, #points do
    local n = i == #points and 1 or i + 1
    line(img, points[i][1], points[i][2], points[n][1], points[n][2], color, thickness)
  end
end

local function polyline(img, points, color, thickness)
  for i = 1, #points - 1 do
    line(img, points[i][1], points[i][2], points[i + 1][1], points[i + 1][2], color, thickness)
  end
end

local function addShadow(img, cx, cy, rx, ry)
  ellipse(img, cx or 48, cy or 78, rx or 31, ry or 8, C.shadow)
end

local function grassSprig(img, x, y, scale)
  scale = scale or 1
  line(img, x, y, x - 4 * scale, y - 10 * scale, C.grassDeep, 2)
  line(img, x, y, x + 1 * scale, y - 13 * scale, C.grassDark, 2)
  line(img, x, y, x + 7 * scale, y - 8 * scale, C.grassDeep, 2)
  pixel(img, x + 1, y - 12 * scale, C.grassHi)
end

local function drawGrassBlock(img)
  addShadow(img, 48, 78, 33, 8)
  local top = {{17,24},{58,14},{78,29},{36,44}}
  local left = {{17,25},{36,44},{36,77},{17,60}}
  local right = {{36,44},{78,29},{78,60},{36,77}}
  outlinePolygon(img, left, C.outline, 4)
  outlinePolygon(img, right, C.outline, 4)
  polygon(img, left, C.dirt)
  polygon(img, right, C.dirtDark)
  polygon(img, {{22,31},{36,44},{36,72},{22,58}}, C.dirtLight)
  polygon(img, {{50,40},{76,31},{76,58},{50,68}}, C.dirt)
  for _, d in ipairs({{25,50,5,4},{30,62,4,5},{41,55,6,4},{58,46,4,5},{63,58,5,4}}) do
    rect(img, d[1], d[2], d[3], d[4], d[1] < 45 and C.dirtDark or C.dirtLight)
  end
  outlinePolygon(img, top, C.outline, 4)
  polygon(img, top, C.grass)
  polygon(img, {{20,25},{56,17},{72,29},{37,39}}, C.grassLight)
  polygon(img, {{17,31},{36,44},{78,29},{78,36},{38,51}}, C.grassDark)
  for x = 23, 69, 8 do
    grassSprig(img, x, 28 + ((x % 3) * 2), 0.7)
  end
  pixel(img, 51, 21, C.grassHi)
  pixel(img, 60, 25, C.grassHi)
  pixel(img, 33, 29, C.grassHi)
end

local function drawRawWoodLog(img)
  addShadow(img, 49, 76, 31, 7)
  line(img, 31, 60, 70, 32, C.outline, 16)
  line(img, 31, 60, 70, 32, C.woodDeep, 12)
  line(img, 34, 56, 70, 30, C.wood, 8)
  line(img, 36, 51, 67, 30, C.woodLight, 3)
  line(img, 42, 62, 74, 39, C.woodDark, 3)
  ellipse(img, 29, 61, 17, 17, C.outline)
  ellipse(img, 29, 61, 14, 14, C.woodGold or C.woodHi)
  ellipse(img, 29, 61, 10, 10, C.woodLight)
  ellipse(img, 29, 61, 6, 6, C.wood)
  ellipse(img, 29, 61, 2, 2, C.woodDeep)
  line(img, 17, 58, 26, 51, C.woodHi, 2)
  line(img, 34, 54, 41, 62, C.outline2, 2)
  line(img, 51, 42, 66, 31, C.woodHi, 2)
  line(img, 50, 56, 70, 43, C.outline2, 2)
end

local function drawGrassSeeds(img)
  addShadow(img, 48, 77, 23, 6)
  local leaves = {
    {45,49,27,28,11,7}, {51,48,69,27,11,7}, {39,58,22,58,11,7},
    {57,58,74,58,11,7}, {48,54,48,27,10,7}, {43,64,31,73,9,5}, {54,64,67,73,9,5},
  }
  for _, l in ipairs(leaves) do
    line(img, l[1], l[2], l[3], l[4], C.outline, l[5])
    line(img, l[1], l[2], l[3], l[4], C.leafDark, l[5] - 3)
    line(img, l[1], l[2] - 1, l[3], l[4] - 1, C.leafLight, 2)
    pixel(img, l[3], l[4], C.leafHi)
  end
  ellipse(img, 48, 55, 8, 9, C.outline)
  ellipse(img, 48, 55, 5, 7, C.woodHi)
  rect(img, 45, 56, 7, 12, C.outline)
  rect(img, 46, 56, 5, 10, C.woodLight)
end

local function drawStoneBase(img, colors)
  addShadow(img, 48, 77, 30, 7)
  ellipse(img, 48, 54, 31, 23, C.outline)
  polygon(img, {{19,52},{35,35},{58,34},{76,49},{70,67},{46,75},{25,67}}, colors.mid)
  polygon(img, {{23,50},{37,38},{56,37},{68,47},{48,52}}, colors.light)
  polygon(img, {{47,55},{76,50},{69,67},{46,75},{26,67}}, colors.dark)
  polygon(img, {{30,63},{45,57},{59,62},{47,71}}, colors.deep)
  line(img, 33, 43, 46, 52, C.outline2, 2)
  line(img, 57, 38, 69, 48, C.outline2, 2)
  line(img, 31, 65, 46, 73, C.outline2, 2)
  rect(img, 37, 42, 6, 3, colors.hi)
  rect(img, 51, 39, 8, 3, colors.hi)
end

local function drawStone(img)
  drawStoneBase(img, {deep=C.stoneDeep, dark=C.stoneDark, mid=C.stone, light=C.stoneLight, hi=C.stoneHi})
end

local function drawClay(img)
  drawStoneBase(img, {deep=C.clayDeep, dark=C.clayDark, mid=C.clay, light=C.clayLight, hi=C.clayHi})
  ellipse(img, 34, 58, 4, 3, C.clayHi)
  line(img, 53, 47, 66, 51, C.clayDeep, 2)
end

local function drawWorkbench(img)
  addShadow(img, 49, 79, 32, 7)
  rect(img, 22, 33, 54, 12, C.outline)
  rect(img, 24, 31, 50, 12, C.woodLight)
  rect(img, 22, 44, 54, 13, C.outline)
  rect(img, 25, 45, 48, 10, C.wood)
  for x = 30, 69, 13 do
    line(img, x, 31, x - 4, 56, C.outline2, 2)
    line(img, x + 3, 32, x - 1, 54, C.woodHi, 1)
  end
  rect(img, 29, 56, 12, 29, C.outline)
  rect(img, 58, 56, 12, 29, C.outline)
  rect(img, 32, 56, 8, 26, C.woodDark)
  rect(img, 58, 56, 8, 26, C.woodDeep)
  rect(img, 25, 61, 50, 10, C.outline)
  rect(img, 28, 61, 44, 7, C.woodDark)
  rect(img, 32, 33, 6, 5, C.woodHi)
  rect(img, 55, 34, 10, 3, C.woodHi)
  pixel(img, 67, 52, C.metalLight)
  pixel(img, 68, 53, C.metal)
end

local function drawWoodenPickaxe(img)
  addShadow(img, 51, 79, 29, 6)
  line(img, 28, 76, 62, 31, C.outline, 10)
  line(img, 28, 76, 62, 31, C.woodDeep, 7)
  line(img, 30, 73, 61, 32, C.wood, 5)
  line(img, 34, 68, 61, 32, C.woodLight, 2)
  polyline(img, {{27,38},{39,28},{60,27},{75,35}}, C.outline, 10)
  polyline(img, {{29,38},{41,31},{60,30},{73,36}}, C.woodDeep, 7)
  polyline(img, {{33,36},{43,31},{59,30},{69,34}}, C.woodLight, 3)
  line(img, 55, 34, 62, 31, C.band, 5)
  line(img, 55, 36, 63, 32, C.string, 2)
end

local function drawWoodenSpear(img)
  addShadow(img, 49, 78, 31, 6)
  line(img, 25, 75, 63, 36, C.outline, 9)
  line(img, 25, 75, 63, 36, C.woodDeep, 6)
  line(img, 28, 71, 62, 37, C.woodLight, 2)
  polygon(img, {{62,34},{80,15},{75,43}}, C.outline)
  polygon(img, {{66,34},{78,19},{73,39}}, C.metalLight)
  polygon(img, {{66,36},{76,24},{73,40}}, C.metal)
  line(img, 66, 35, 77, 21, C.stoneHi, 1)
  rect(img, 57, 39, 12, 10, C.outline)
  rect(img, 59, 39, 8, 8, C.string)
  line(img, 58, 46, 68, 38, C.stringDark, 2)
end

local function drawWoodenSlingshot(img)
  addShadow(img, 48, 79, 25, 6)
  line(img, 48, 77, 48, 49, C.outline, 13)
  line(img, 48, 77, 48, 49, C.woodDeep, 9)
  line(img, 50, 75, 50, 50, C.wood, 6)
  line(img, 48, 49, 29, 25, C.outline, 11)
  line(img, 48, 49, 29, 25, C.woodDeep, 7)
  line(img, 48, 49, 67, 25, C.outline, 11)
  line(img, 48, 49, 67, 25, C.woodDeep, 7)
  line(img, 52, 45, 66, 27, C.woodLight, 2)
  line(img, 48, 30, 31, 27, C.outline, 3)
  line(img, 48, 30, 65, 27, C.outline, 3)
  line(img, 49, 30, 32, 27, C.string, 1)
  line(img, 49, 30, 64, 27, C.string, 1)
  rect(img, 43, 27, 11, 8, C.outline)
  rect(img, 45, 28, 7, 6, C.band)
  line(img, 42, 69, 49, 52, C.woodLight, 2)
end

local function drawWoodenBow(img)
  addShadow(img, 50, 79, 24, 6)
  polyline(img, {{61,18},{72,32},{73,50},{66,70},{57,82}}, C.outline, 11)
  polyline(img, {{61,20},{69,34},{70,50},{64,68},{58,80}}, C.woodDeep, 7)
  polyline(img, {{63,22},{68,36},{69,49},{63,66},{59,76}}, C.woodLight, 2)
  polyline(img, {{61,18},{42,48},{57,82}}, C.outline, 3)
  polyline(img, {{61,20},{44,48},{57,80}}, C.string, 1)
  line(img, 66, 33, 70, 41, C.woodHi, 2)
  line(img, 65, 62, 59, 77, C.woodHi, 2)
end

local function arrow(img, x0, y0, x1, y1)
  line(img, x0, y0, x1, y1, C.outline, 6)
  line(img, x0, y0, x1, y1, C.woodDeep, 4)
  line(img, x0 + 2, y0 - 2, x1, y1, C.woodLight, 1)
  polygon(img, {{x1,y1},{x1+8,y1-13},{x1+4,y1+6}}, C.outline)
  polygon(img, {{x1+2,y1},{x1+7,y1-9},{x1+4,y1+4}}, C.metalLight)
  polygon(img, {{x0,y0},{x0-10,y0+2},{x0-1,y0-11}}, C.outline)
  polygon(img, {{x0+1,y0},{x0-7,y0+1},{x0,y0-8}}, C.feather)
end

local function drawWoodenArrows(img)
  addShadow(img, 48, 79, 31, 6)
  arrow(img, 21, 72, 58, 32)
  arrow(img, 33, 79, 70, 39)
  arrow(img, 14, 66, 49, 26)
  line(img, 17, 67, 26, 73, C.featherShade, 2)
  line(img, 29, 77, 38, 82, C.featherShade, 2)
end

local function drawPlantFiberRope(img)
  addShadow(img, 48, 79, 32, 7)
  ellipse(img, 48, 54, 31, 24, C.outline)
  ellipse(img, 48, 54, 26, 20, C.ropeDark)
  ellipse(img, 48, 54, 18, 13, C.outline)
  ellipse(img, 48, 54, 12, 8, C.clear)
  ellipse(img, 48, 54, 6, 4, C.clear)
  for _, p in ipairs({{23,52,39,35},{30,70,67,34},{55,75,76,55},{20,61,63,31}}) do
    line(img, p[1], p[2], p[3], p[4], C.ropeDeep, 4)
    line(img, p[1] + 1, p[2] - 1, p[3], p[4] - 1, C.ropeLight, 2)
  end
  line(img, 25, 43, 38, 34, C.ropeHi, 2)
  line(img, 66, 65, 76, 76, C.ropeDeep, 5)
end

local function drawGrassTuft(img)
  addShadow(img, 48, 80, 31, 6)
  local blades = {
    {45,80,45,31,9}, {37,80,25,43,8}, {55,80,70,41,8}, {49,80,58,27,8},
    {42,82,35,33,7}, {54,82,52,37,7}, {31,82,13,60,7}, {65,82,81,57,7},
    {47,81,31,56,6}, {50,81,66,58,6},
  }
  for _, b in ipairs(blades) do
    line(img, b[1], b[2], b[3], b[4], C.outline, b[5])
    line(img, b[1], b[2], b[3], b[4], C.grassDark, b[5] - 3)
    line(img, b[1] + 1, b[2] - 1, b[3], b[4], C.grassLight, 2)
  end
  rect(img, 21, 77, 54, 9, C.grassDeep)
  rect(img, 27, 73, 42, 8, C.grass)
  for x = 30, 66, 9 do
    pixel(img, x, 72, C.grassHi)
  end
end

local function drawSmallRock(img)
  addShadow(img, 48, 78, 23, 5)
  ellipse(img, 48, 60, 24, 15, C.outline)
  polygon(img, {{24,58},{39,45},{61,46},{73,60},{64,72},{39,74}}, C.stone)
  polygon(img, {{28,56},{41,47},{60,48},{49,58}}, C.stoneLight)
  polygon(img, {{48,61},{73,60},{64,72},{39,74}}, C.stoneDark)
  polygon(img, {{37,68},{49,63},{60,69},{48,73}}, C.stoneDeep)
  line(img, 33, 65, 47, 73, C.outline2, 2)
  rect(img, 42, 50, 8, 3, C.stoneHi)
end

local function drawYellowOreOrClayLump(img)
  drawStoneBase(img, {deep=C.oreDeep, dark=C.oreDark, mid=C.ore, light=C.oreLight, hi=C.oreHi})
  rect(img, 42, 43, 12, 4, C.oreHi)
  rect(img, 56, 52, 8, 4, C.oreLight)
  line(img, 28, 61, 45, 70, C.oreDeep, 2)
end

local draw = {
  grass_block = drawGrassBlock,
  raw_wood_log = drawRawWoodLog,
  grass_seeds = drawGrassSeeds,
  stone = drawStone,
  clay = drawClay,
  workbench = drawWorkbench,
  wooden_pickaxe = drawWoodenPickaxe,
  wooden_spear = drawWoodenSpear,
  wooden_slingshot = drawWoodenSlingshot,
  wooden_bow = drawWoodenBow,
  wooden_arrows = drawWoodenArrows,
  plant_fiber_rope = drawPlantFiberRope,
  grass_tuft = drawGrassTuft,
  small_rock = drawSmallRock,
  yellow_ore_or_clay_lump = drawYellowOreOrClayLump,
}

local rendered = {}

for _, name in ipairs(icons) do
  local sprite = Sprite(96, 96)
  sprite.filename = app.fs.joinPath(sourceDir, name .. ".aseprite")
  local img = sprite.cels[1].image
  img:clear(C.clear)
  draw[name](img)
  app.command.SaveFileAs{filename=sprite.filename}
  rendered[name] = img:clone()
  sprite:close()
end

local preview = Sprite(#icons * 96, 96)
preview.filename = previewPath
local previewImg = preview.cels[1].image
previewImg:clear(C.clear)
for index, name in ipairs(icons) do
  local sourceImg = rendered[name]
  local offsetX = (index - 1) * 96
  for y = 0, 95 do
    for x = 0, 95 do
      previewImg:drawPixel(offsetX + x, y, sourceImg:getPixel(x, y))
    end
  end
end
app.command.SaveFileCopyAs{filename=preview.filename}
preview:close()

local cols, rows = 5, 3
local slotSize, iconSize = 64, 48
local uiPreview = Sprite(cols * slotSize, rows * slotSize)
uiPreview.filename = uiPreviewPath
local uiImg = uiPreview.cels[1].image
uiImg:clear(C.clear)
for index, name in ipairs(icons) do
  local col = (index - 1) % cols
  local row = math.floor((index - 1) / cols)
  local sx = col * slotSize
  local sy = row * slotSize
  rect(uiImg, sx + 4, sy + 4, slotSize - 8, slotSize - 8, C.outline)
  rect(uiImg, sx + 7, sy + 7, slotSize - 14, slotSize - 14, C.slot)
  rect(uiImg, sx + 7, sy + 7, slotSize - 14, 3, C.slotHi)
  rect(uiImg, sx + 7, sy + slotSize - 10, slotSize - 14, 3, C.slot2)
  local sourceImg = rendered[name]
  local ox = sx + math.floor((slotSize - iconSize) / 2)
  local oy = sy + math.floor((slotSize - iconSize) / 2)
  for y = 0, iconSize - 1 do
    for x = 0, iconSize - 1 do
      local px = sourceImg:getPixel(x * 2, y * 2)
      uiImg:drawPixel(ox + x, oy + y, px)
    end
  end
end
app.command.SaveFileCopyAs{filename=uiPreview.filename}
uiPreview:close()
