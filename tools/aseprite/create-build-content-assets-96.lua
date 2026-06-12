local sourceIconDir = "assets/source/aseprite/icons/inventory_96"
local generatedIconDir = "assets/generated/icons/inventory_96"
local sourceObjectDir = "assets/source/aseprite/objects/building"
local generatedObjectDir = "assets/generated/objects/building"
local sourceFloorDir = "assets/source/aseprite/tiles/floors_96"
local generatedFloorDir = "assets/generated/tiles/floors_96"

local function rgba(r, g, b, a)
  return Color{ r = r, g = g, b = b, a = a or 255 }.rgbaPixel
end

local c = {
  clear = rgba(0, 0, 0, 0),
  outline = rgba(47, 30, 22, 255),
  shadow = rgba(38, 25, 20, 180),
  woodDark = rgba(83, 47, 27, 255),
  wood = rgba(132, 78, 39, 255),
  woodLight = rgba(190, 119, 57, 255),
  woodHi = rgba(223, 156, 84, 255),
  stoneDark = rgba(77, 75, 70, 255),
  stone = rgba(117, 114, 105, 255),
  stoneLight = rgba(157, 153, 141, 255),
  glass = rgba(122, 196, 206, 230),
  glassHi = rgba(229, 255, 244, 255),
  red = rgba(142, 62, 55, 255),
  redLight = rgba(207, 117, 79, 255),
  clay = rgba(158, 82, 50, 255),
  clayLight = rgba(213, 122, 69, 255),
  leaf = rgba(74, 139, 55, 255),
  leafLight = rgba(123, 187, 71, 255),
  glow = rgba(255, 211, 105, 255),
  glowHi = rgba(255, 246, 180, 255),
  cloth = rgba(205, 132, 82, 255),
  clothDark = rgba(127, 58, 52, 255)
}

local function newImage()
  local image = Image(96, 96, ColorMode.RGB)
  image:clear(c.clear)
  return image
end

local function rect(image, x, y, w, h, color)
  for py = y, y + h - 1 do
    for px = x, x + w - 1 do
      if px >= 0 and px < image.width and py >= 0 and py < image.height then
        image:putPixel(px, py, color)
      end
    end
  end
end

local function line(image, x0, y0, x1, y1, color, thickness)
  local dx = math.abs(x1 - x0)
  local sx = x0 < x1 and 1 or -1
  local dy = -math.abs(y1 - y0)
  local sy = y0 < y1 and 1 or -1
  local err = dx + dy
  thickness = thickness or 1
  while true do
    rect(image, x0 - math.floor(thickness / 2), y0 - math.floor(thickness / 2), thickness, thickness, color)
    if x0 == x1 and y0 == y1 then break end
    local e2 = 2 * err
    if e2 >= dy then err = err + dy; x0 = x0 + sx end
    if e2 <= dx then err = err + dx; y0 = y0 + sy end
  end
end

local function ellipse(image, cx, cy, rx, ry, color)
  for y = -ry, ry do
    for x = -rx, rx do
      if (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1 then
        image:putPixel(cx + x, cy + y, color)
      end
    end
  end
end

local function save(name, image, sourceDir, generatedDir)
  local sprite = Sprite(96, 96, ColorMode.RGB)
  sprite:newCel(sprite.layers[1], 1, image, Point(0, 0))
  sprite:saveAs(sourceDir .. "/" .. name .. ".aseprite")
  sprite:saveCopyAs(generatedDir .. "/" .. name .. ".png")
  sprite:close()
end

local function drawWoodFloor(image)
  rect(image, 5, 8, 86, 76, c.outline)
  rect(image, 7, 10, 82, 72, c.wood)
  for y = 18, 74, 16 do
    rect(image, 8, y, 80, 3, c.woodDark)
    rect(image, 8, y + 3, 80, 2, c.woodLight)
  end
  for y = 12, 76, 16 do
    line(image, 18, y, 27, y + 8, c.woodDark, 2)
    line(image, 55, y + 5, 66, y + 1, c.woodHi, 2)
    rect(image, 39, y + 2, 3, 3, c.woodDark)
  end
end

local function drawStoneFloor(image)
  rect(image, 6, 8, 84, 76, c.outline)
  rect(image, 8, 10, 80, 72, c.stone)
  rect(image, 10, 12, 36, 22, c.stoneLight)
  rect(image, 49, 12, 37, 22, c.stone)
  rect(image, 10, 37, 24, 22, c.stone)
  rect(image, 37, 37, 49, 22, c.stoneLight)
  rect(image, 10, 62, 76, 17, c.stone)
  rect(image, 46, 12, 3, 67, c.stoneDark)
  rect(image, 10, 34, 76, 3, c.stoneDark)
  rect(image, 34, 37, 3, 22, c.stoneDark)
  rect(image, 10, 59, 76, 3, c.stoneDark)
  line(image, 56, 45, 72, 52, c.stoneDark, 2)
end

local function drawWindow(image)
  rect(image, 18, 18, 60, 58, c.outline)
  rect(image, 22, 21, 52, 52, c.wood)
  rect(image, 28, 28, 40, 30, c.outline)
  rect(image, 31, 31, 16, 24, c.glass)
  rect(image, 50, 31, 15, 24, c.glass)
  rect(image, 47, 29, 3, 29, c.woodDark)
  rect(image, 30, 43, 36, 3, c.woodDark)
  rect(image, 34, 33, 5, 9, c.glassHi)
  rect(image, 53, 33, 5, 9, c.glassHi)
  rect(image, 25, 64, 46, 5, c.woodDark)
end

local function drawRug(image)
  rect(image, 16, 29, 64, 39, c.outline)
  rect(image, 19, 32, 58, 33, c.clothDark)
  rect(image, 25, 37, 46, 23, c.cloth)
  rect(image, 31, 42, 34, 13, c.redLight)
  rect(image, 19, 32, 58, 4, c.redLight)
  rect(image, 19, 61, 58, 4, c.redLight)
end

local function drawPlantPot(image)
  ellipse(image, 48, 67, 22, 9, c.outline)
  rect(image, 30, 47, 36, 22, c.outline)
  rect(image, 34, 49, 28, 18, c.clay)
  rect(image, 34, 50, 28, 5, c.clayLight)
  line(image, 48, 47, 39, 27, c.leaf, 6)
  line(image, 48, 47, 58, 25, c.leaf, 6)
  line(image, 47, 48, 48, 21, c.leaf, 5)
  ellipse(image, 38, 30, 9, 6, c.leafLight)
  ellipse(image, 58, 28, 9, 6, c.leafLight)
  ellipse(image, 49, 22, 7, 8, c.leafLight)
end

local function drawShelf(image)
  rect(image, 24, 18, 48, 60, c.outline)
  rect(image, 28, 22, 40, 52, c.wood)
  rect(image, 31, 34, 34, 4, c.woodDark)
  rect(image, 31, 52, 34, 4, c.woodDark)
  rect(image, 34, 27, 7, 7, c.redLight)
  rect(image, 45, 26, 5, 8, c.glow)
  rect(image, 54, 27, 8, 7, c.stoneLight)
  rect(image, 35, 43, 18, 7, c.woodHi)
  rect(image, 56, 43, 6, 7, c.leafLight)
  rect(image, 34, 61, 28, 8, c.woodDark)
end

local function drawLantern(image)
  rect(image, 43, 18, 10, 16, c.outline)
  rect(image, 46, 21, 4, 13, c.woodDark)
  rect(image, 35, 35, 26, 35, c.outline)
  rect(image, 39, 38, 18, 27, c.wood)
  rect(image, 42, 42, 12, 17, c.glow)
  rect(image, 45, 45, 6, 10, c.glowHi)
  rect(image, 38, 66, 20, 5, c.woodDark)
end

local assets = {
  wood_floor = drawWoodFloor,
  stone_floor = drawStoneFloor,
  window = drawWindow,
  rug = drawRug,
  plant_pot = drawPlantPot,
  shelf = drawShelf,
  floor_lantern = drawLantern
}

for name, drawer in pairs(assets) do
  local image = newImage()
  drawer(image)
  save(name, image, sourceIconDir, generatedIconDir)
end

local objectAssets = {
  window_96 = drawWindow,
  rug_96 = drawRug,
  plant_pot_96 = drawPlantPot,
  shelf_96 = drawShelf,
  floor_lantern_96 = drawLantern
}

for name, drawer in pairs(objectAssets) do
  local image = newImage()
  drawer(image)
  save(name, image, sourceObjectDir, generatedObjectDir)
end

local floorAssets = {
  wood_floor_96 = drawWoodFloor,
  stone_floor_96 = drawStoneFloor
}

for name, drawer in pairs(floorAssets) do
  local image = newImage()
  drawer(image)
  save(name, image, sourceFloorDir, generatedFloorDir)
end
