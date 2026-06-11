local sourceIconDir = "assets/source/aseprite/icons/inventory_96"
local generatedIconDir = "assets/generated/icons/inventory_96"
local sourceAnimalDir = "assets/source/aseprite/objects/animals"
local generatedAnimalDir = "assets/generated/objects/animals"

local function rgba(r, g, b, a)
  return Color{ r = r, g = g, b = b, a = a or 255 }.rgbaPixel
end

local colors = {
  transparent = rgba(0, 0, 0, 0),
  outline = rgba(48, 31, 25, 255),
  dark = rgba(79, 48, 32, 255),
  wood = rgba(126, 76, 39, 255),
  woodLight = rgba(181, 111, 54, 255),
  leather = rgba(116, 69, 45, 255),
  leatherLight = rgba(183, 116, 67, 255),
  cloth = rgba(230, 211, 164, 255),
  clothShade = rgba(157, 119, 74, 255),
  wool = rgba(239, 231, 206, 255),
  woolShade = rgba(188, 172, 145, 255),
  metal = rgba(122, 125, 124, 255),
  meat = rgba(171, 65, 58, 255),
  meatLight = rgba(235, 143, 119, 255),
  egg = rgba(246, 232, 188, 255),
  eggShade = rgba(199, 164, 108, 255),
  grass = rgba(87, 150, 55, 255),
  berry = rgba(148, 43, 62, 255)
}

local function drawRect(image, x, y, w, h, color)
  for py = y, y + h - 1 do
    for px = x, x + w - 1 do
      if px >= 0 and px < image.width and py >= 0 and py < image.height then
        image:putPixel(px, py, color)
      end
    end
  end
end

local function drawDiamond(image, cx, cy, rx, ry, color)
  for y = -ry, ry do
    local span = math.floor(rx * (1 - math.abs(y) / (ry + 1)))
    drawRect(image, cx - span, cy + y, span * 2 + 1, 1, color)
  end
end

local function drawEllipse(image, cx, cy, rx, ry, color)
  for y = -ry, ry do
    for x = -rx, rx do
      if (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1 then
        image:putPixel(cx + x, cy + y, color)
      end
    end
  end
end

local function drawLine(image, x0, y0, x1, y1, color, thickness)
  local dx = math.abs(x1 - x0)
  local sx = x0 < x1 and 1 or -1
  local dy = -math.abs(y1 - y0)
  local sy = y0 < y1 and 1 or -1
  local err = dx + dy
  thickness = thickness or 1
  while true do
    drawRect(image, x0 - math.floor(thickness / 2), y0 - math.floor(thickness / 2), thickness, thickness, color)
    if x0 == x1 and y0 == y1 then break end
    local e2 = 2 * err
    if e2 >= dy then err = err + dy; x0 = x0 + sx end
    if e2 <= dx then err = err + dx; y0 = y0 + sy end
  end
end

local function addDither(image, x, y, w, h, color, step)
  for py = y, y + h - 1, step do
    for px = x + ((py + step) % (step * 2)), x + w - 1, step * 2 do
      image:putPixel(px, py, color)
    end
  end
end

local function saveSprite(name, image, sourceDir, generatedDir)
  local sprite = Sprite(96, 96, ColorMode.RGB)
  sprite.filename = sourceDir .. "/" .. name .. ".aseprite"
  sprite:newCel(sprite.layers[1], 1, image, Point(0, 0))
  sprite:saveAs(sourceDir .. "/" .. name .. ".aseprite")
  sprite:saveCopyAs(generatedDir .. "/" .. name .. ".png")
  sprite:close()
end

local function newImage()
  local image = Image(96, 96, ColorMode.RGB)
  image:clear(colors.transparent)
  return image
end

local iconDrawers = {
  egg = function(image)
    drawEllipse(image, 49, 49, 22, 28, colors.outline)
    drawEllipse(image, 48, 48, 19, 25, colors.egg)
    drawEllipse(image, 40, 39, 7, 11, rgba(255, 247, 213, 255))
    drawRect(image, 58, 61, 8, 5, colors.eggShade)
  end,
  fried_egg = function(image)
    drawEllipse(image, 48, 55, 30, 21, colors.outline)
    drawEllipse(image, 48, 54, 27, 18, rgba(255, 246, 220, 255))
    drawEllipse(image, 48, 53, 11, 10, rgba(238, 164, 50, 255))
    drawRect(image, 51, 50, 5, 3, rgba(255, 205, 77, 255))
  end,
  raw_meat = function(image)
    drawEllipse(image, 47, 51, 27, 22, colors.outline)
    drawEllipse(image, 47, 50, 24, 19, colors.meat)
    drawEllipse(image, 38, 42, 8, 5, colors.meatLight)
    drawLine(image, 35, 60, 63, 43, rgba(116, 39, 45, 255), 4)
    drawEllipse(image, 60, 59, 8, 6, rgba(245, 199, 156, 255))
  end,
  wool = function(image)
    drawEllipse(image, 35, 47, 17, 16, colors.outline)
    drawEllipse(image, 53, 43, 18, 17, colors.outline)
    drawEllipse(image, 59, 60, 18, 16, colors.outline)
    drawEllipse(image, 39, 62, 19, 15, colors.outline)
    drawEllipse(image, 35, 47, 14, 13, colors.wool)
    drawEllipse(image, 53, 43, 15, 14, colors.wool)
    drawEllipse(image, 59, 60, 15, 13, colors.wool)
    drawEllipse(image, 39, 62, 16, 12, colors.wool)
    addDither(image, 27, 36, 46, 35, colors.woolShade, 5)
  end,
  ammo_pouch = function(image)
    drawEllipse(image, 48, 55, 25, 27, colors.outline)
    drawEllipse(image, 48, 56, 21, 23, colors.leather)
    drawRect(image, 31, 32, 34, 14, colors.outline)
    drawRect(image, 34, 34, 28, 10, colors.leatherLight)
    drawLine(image, 36, 47, 60, 47, colors.dark, 3)
    drawRect(image, 45, 50, 7, 7, colors.woodLight)
    addDither(image, 33, 48, 31, 26, rgba(91, 52, 33, 255), 6)
  end,
  quiver = function(image)
    drawLine(image, 37, 76, 61, 25, colors.outline, 18)
    drawLine(image, 37, 76, 61, 25, colors.leather, 13)
    drawLine(image, 44, 72, 66, 29, colors.leatherLight, 3)
    for i = 0, 3 do
      drawLine(image, 45 + i * 4, 30, 31 + i * 5, 12, colors.wood, 2)
      drawDiamond(image, 31 + i * 5, 12, 4, 7, rgba(235, 232, 211, 255))
    end
    drawLine(image, 32, 64, 59, 15, colors.dark, 3)
  end,
  linen_tunic = function(image)
    drawRect(image, 33, 28, 30, 49, colors.outline)
    drawLine(image, 33, 31, 19, 45, colors.outline, 11)
    drawLine(image, 63, 31, 77, 45, colors.outline, 11)
    drawRect(image, 36, 30, 24, 44, colors.cloth)
    drawLine(image, 35, 33, 24, 44, colors.cloth, 8)
    drawLine(image, 61, 33, 72, 44, colors.cloth, 8)
    drawDiamond(image, 48, 31, 10, 9, colors.outline)
    drawDiamond(image, 48, 29, 7, 7, rgba(97, 60, 43, 255))
    drawLine(image, 41, 54, 56, 54, colors.clothShade, 2)
    drawLine(image, 44, 35, 38, 70, rgba(247, 231, 184, 255), 2)
  end,
  travel_boots = function(image)
    drawRect(image, 27, 34, 17, 34, colors.outline)
    drawRect(image, 52, 34, 17, 34, colors.outline)
    drawRect(image, 25, 62, 24, 12, colors.outline)
    drawRect(image, 50, 62, 24, 12, colors.outline)
    drawRect(image, 30, 37, 11, 28, colors.leather)
    drawRect(image, 55, 37, 11, 28, colors.leather)
    drawRect(image, 28, 64, 19, 7, colors.leatherLight)
    drawRect(image, 53, 64, 19, 7, colors.leatherLight)
    drawLine(image, 31, 48, 42, 48, colors.dark, 2)
    drawLine(image, 56, 48, 67, 48, colors.dark, 2)
  end
}

local animalDrawers = {
  chicken_96 = function(image)
    drawEllipse(image, 44, 57, 21, 18, colors.outline)
    drawEllipse(image, 44, 56, 18, 15, rgba(246, 230, 187, 255))
    drawEllipse(image, 58, 43, 13, 12, colors.outline)
    drawEllipse(image, 58, 43, 10, 9, rgba(255, 247, 218, 255))
    drawDiamond(image, 70, 45, 9, 6, rgba(215, 117, 38, 255))
    drawRect(image, 59, 40, 3, 3, colors.outline)
    drawLine(image, 37, 70, 35, 80, rgba(198, 112, 40, 255), 3)
    drawLine(image, 50, 70, 52, 80, rgba(198, 112, 40, 255), 3)
    drawDiamond(image, 53, 25, 9, 8, rgba(210, 60, 49, 255))
  end,
  sheep_96 = function(image)
    for _, p in ipairs({{33,48},{47,41},{61,49},{42,60},{58,62}}) do
      drawEllipse(image, p[1], p[2], 18, 16, colors.outline)
      drawEllipse(image, p[1], p[2], 15, 13, colors.wool)
    end
    drawEllipse(image, 67, 49, 13, 12, colors.outline)
    drawEllipse(image, 67, 49, 10, 9, rgba(114, 80, 55, 255))
    drawRect(image, 69, 47, 3, 3, rgba(33, 23, 19, 255))
    drawLine(image, 33, 66, 31, 80, rgba(86, 56, 39, 255), 4)
    drawLine(image, 54, 66, 55, 80, rgba(86, 56, 39, 255), 4)
    addDither(image, 25, 35, 46, 33, colors.woolShade, 6)
  end
}

for name, drawer in pairs(iconDrawers) do
  local image = newImage()
  drawer(image)
  saveSprite(name, image, sourceIconDir, generatedIconDir)
end

for name, drawer in pairs(animalDrawers) do
  local image = newImage()
  drawer(image)
  saveSprite(name, image, sourceAnimalDir, generatedAnimalDir)
end
