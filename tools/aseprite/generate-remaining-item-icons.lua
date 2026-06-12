local repoRoot = "C:/Codex/One-Block"
local sourceDir = repoRoot .. "/assets/source/aseprite/icons/inventory_96"
local outputDir = repoRoot .. "/assets/generated/icons/inventory_96"
local size = 96

local function color(hex, alpha)
  hex = hex:gsub("#", "")
  return Color{
    r = tonumber(hex:sub(1, 2), 16),
    g = tonumber(hex:sub(3, 4), 16),
    b = tonumber(hex:sub(5, 6), 16),
    a = alpha or 255
  }
end

local C = {
  outline = color("#2b1a11"),
  dark = color("#3a2418"),
  shadow = color("#1b120d", 58),
  woodDark = color("#5b331c"),
  wood = color("#8a5a35"),
  woodLight = color("#c18445"),
  woodGold = color("#d59a55"),
  leafDark = color("#2f6f35"),
  leaf = color("#4f9e42"),
  leafLight = color("#8ccd5f"),
  clayRawDark = color("#5f5048"),
  clayRaw = color("#8d7568"),
  clayRawLight = color("#b39a88"),
  clayDark = color("#7a432b"),
  clay = color("#b8673b"),
  clayLight = color("#de9859"),
  stoneDark = color("#4f5358"),
  stone = color("#7d8588"),
  stoneLight = color("#b9c0c1"),
  waterDark = color("#1f6f9c"),
  water = color("#3fa7d9"),
  waterLight = color("#b9f7ff"),
  redDark = color("#8f2441"),
  red = color("#c93757"),
  redLight = color("#f07a7b"),
  meatDark = color("#84332d"),
  meat = color("#b94a42"),
  meatLight = color("#f0b08a"),
  fireDark = color("#c43e23"),
  fire = color("#f05a28"),
  fireLight = color("#ffd966"),
  cloth = color("#ead9b8"),
  straw = color("#c99a42"),
  strawLight = color("#e8c66a"),
  rope = color("#a8793e"),
  greenGlow = color("#c7ff8a", 120),
  blueGlow = color("#93e7ff", 90)
}

local function put(img, x, y, c)
  x = math.floor(x)
  y = math.floor(y)
  if x >= 0 and x < size and y >= 0 and y < size then
    img:drawPixel(x, y, c)
  end
end

local function rect(img, x, y, w, h, c)
  for yy = y, y + h - 1 do
    for xx = x, x + w - 1 do
      put(img, xx, yy, c)
    end
  end
end

local function ellipse(img, cx, cy, rx, ry, c)
  for y = math.floor(cy - ry), math.ceil(cy + ry) do
    for x = math.floor(cx - rx), math.ceil(cx + rx) do
      local dx = (x - cx) / rx
      local dy = (y - cy) / ry
      if dx * dx + dy * dy <= 1 then put(img, x, y, c) end
    end
  end
end

local function line(img, x1, y1, x2, y2, thickness, c)
  local dx = x2 - x1
  local dy = y2 - y1
  local steps = math.max(math.abs(dx), math.abs(dy), 1)
  local r = math.floor(thickness / 2)
  for i = 0, steps do
    local x = math.floor(x1 + dx * i / steps + 0.5)
    local y = math.floor(y1 + dy * i / steps + 0.5)
    rect(img, x - r, y - r, thickness, thickness, c)
  end
end

local function poly(img, points, c)
  local minY, maxY = points[1][2], points[1][2]
  for _, p in ipairs(points) do
    minY = math.min(minY, p[2])
    maxY = math.max(maxY, p[2])
  end
  for y = math.floor(minY), math.ceil(maxY) do
    local xs = {}
    for i = 1, #points do
      local a = points[i]
      local b = points[(i % #points) + 1]
      if (a[2] < y and b[2] >= y) or (b[2] < y and a[2] >= y) then
        table.insert(xs, a[1] + (y - a[2]) / (b[2] - a[2]) * (b[1] - a[1]))
      end
    end
    table.sort(xs)
    for i = 1, #xs, 2 do
      if xs[i + 1] then
        for x = math.floor(xs[i]), math.ceil(xs[i + 1]) do put(img, x, y, c) end
      end
    end
  end
end

local function ring(img, cx, cy, rx, ry, thick, c)
  ellipse(img, cx, cy, rx, ry, c)
  ellipse(img, cx, cy, math.max(1, rx - thick), math.max(1, ry - thick), Color{r = 0, g = 0, b = 0, a = 0})
end

local function sparkle(img, x, y, c)
  rect(img, x, y - 3, 1, 7, c)
  rect(img, x - 3, y, 7, 1, c)
  put(img, x - 1, y - 1, c)
  put(img, x + 1, y + 1, c)
end

local function shadow(img)
  ellipse(img, 48, 76, 28, 7, C.shadow)
end

local function brick(img)
  shadow(img)
  rect(img, 20, 34, 56, 32, C.outline)
  rect(img, 24, 30, 48, 36, C.clayDark)
  rect(img, 26, 32, 44, 30, C.clay)
  rect(img, 28, 34, 40, 7, C.clayLight)
  rect(img, 28, 47, 40, 3, C.clayDark)
  rect(img, 44, 34, 3, 28, C.clayDark)
  rect(img, 26, 61, 44, 4, C.dark)
end

local function bowl(img, fired)
  shadow(img)
  local dark = fired and C.clayDark or C.clayRawDark
  local mid = fired and C.clay or C.clayRaw
  local light = fired and C.clayLight or C.clayRawLight
  ellipse(img, 48, 52, 30, 16, C.outline)
  ellipse(img, 48, 49, 27, 13, dark)
  ellipse(img, 48, 46, 22, 8, mid)
  rect(img, 26, 48, 44, 14, mid)
  rect(img, 30, 59, 36, 6, dark)
  line(img, 34, 43, 60, 40, 3, light)
  if fired then rect(img, 36, 55, 22, 3, C.clayLight) end
end

local function jug(img, fired)
  shadow(img)
  local dark = fired and C.clayDark or C.clayRawDark
  local mid = fired and C.clay or C.clayRaw
  local light = fired and C.clayLight or C.clayRawLight
  rect(img, 40, 22, 17, 13, C.outline)
  rect(img, 43, 20, 11, 15, mid)
  ellipse(img, 48, 52, 20, 27, C.outline)
  ellipse(img, 47, 51, 16, 24, mid)
  ellipse(img, 47, 39, 12, 8, light)
  line(img, 59, 42, 72, 45, 5, C.outline)
  line(img, 70, 45, 66, 62, 5, C.outline)
  line(img, 59, 42, 69, 46, 3, mid)
  line(img, 68, 47, 63, 60, 3, mid)
  if fired then rect(img, 37, 59, 22, 4, C.clayLight) end
end

local function springDrop(img)
  ellipse(img, 48, 53, 29, 34, C.blueGlow)
  poly(img, {{48,15},{68,46},{59,75},{37,75},{28,46}}, C.outline)
  poly(img, {{48,18},{64,47},{57,70},{39,70},{32,47}}, C.water)
  poly(img, {{48,22},{56,49},{50,66},{39,61},{35,47}}, C.waterLight)
  rect(img, 55, 50, 5, 13, C.waterDark)
  sparkle(img, 25, 32, C.waterLight)
  sparkle(img, 73, 31, C.waterLight)
end

local function treeSeed(img)
  shadow(img)
  ellipse(img, 45, 55, 15, 20, C.outline)
  ellipse(img, 45, 57, 12, 17, C.straw)
  rect(img, 34, 42, 22, 9, C.woodDark)
  rect(img, 36, 43, 18, 4, C.woodLight)
  poly(img, {{52,35},{72,27},{66,44}}, C.leafDark)
  poly(img, {{54,35},{69,29},{64,41}}, C.leafLight)
  line(img, 48, 45, 59, 35, 3, C.leaf)
end

local function berries(img, roasted)
  shadow(img)
  if roasted then
    bowl(img, true)
    ellipse(img, 38, 42, 7, 6, C.redDark)
    ellipse(img, 50, 40, 8, 7, C.red)
    ellipse(img, 61, 44, 7, 6, C.redLight)
    line(img, 36, 26, 35, 18, 2, color("#efe0bd", 180))
    line(img, 49, 25, 50, 16, 2, color("#efe0bd", 180))
    return
  end
  ellipse(img, 36, 54, 10, 10, C.outline)
  ellipse(img, 51, 50, 12, 11, C.outline)
  ellipse(img, 60, 61, 10, 9, C.outline)
  ellipse(img, 36, 54, 7, 7, C.red)
  ellipse(img, 51, 50, 9, 8, C.redLight)
  ellipse(img, 60, 61, 7, 6, C.redDark)
  poly(img, {{44,34},{62,27},{58,44}}, C.leafDark)
  poly(img, {{46,35},{59,29},{56,41}}, C.leafLight)
  line(img, 45, 43, 56, 33, 3, C.leaf)
end

local function steak(img)
  shadow(img)
  ellipse(img, 48, 52, 29, 20, C.outline)
  ellipse(img, 48, 52, 25, 17, C.meat)
  ellipse(img, 39, 46, 10, 7, C.meatLight)
  line(img, 31, 58, 62, 40, 3, C.meatDark)
  line(img, 39, 65, 70, 47, 3, C.meatDark)
  rect(img, 57, 56, 8, 5, C.meatLight)
end

local function axe(img)
  shadow(img)
  line(img, 29, 75, 61, 31, 8, C.outline)
  line(img, 31, 73, 60, 33, 5, C.wood)
  poly(img, {{54,24},{78,31},{72,52},{56,45}}, C.outline)
  poly(img, {{57,27},{74,32},{68,47},{57,42}}, C.stoneLight)
  rect(img, 54, 38, 7, 9, C.stoneDark)
end

local function scythe(img)
  shadow(img)
  line(img, 31, 76, 60, 28, 7, C.outline)
  line(img, 33, 74, 58, 31, 4, C.wood)
  line(img, 58, 28, 79, 42, 5, C.outline)
  line(img, 60, 29, 77, 39, 3, C.stoneLight)
  line(img, 77, 39, 64, 51, 4, C.outline)
  line(img, 75, 40, 64, 49, 2, C.stone)
end

local function lasso(img)
  shadow(img)
  ring(img, 47, 45, 24, 18, 5, C.outline)
  ring(img, 47, 45, 20, 14, 4, C.rope)
  line(img, 55, 60, 68, 77, 6, C.outline)
  line(img, 55, 60, 67, 76, 3, C.rope)
  line(img, 32, 56, 51, 61, 5, C.rope)
end

local function torch(img)
  shadow(img)
  line(img, 49, 75, 49, 38, 8, C.outline)
  line(img, 49, 75, 49, 40, 4, C.wood)
  poly(img, {{48,14},{63,37},{48,51},{35,38}}, C.outline)
  poly(img, {{49,17},{59,37},{48,47},{38,38}}, C.fire)
  poly(img, {{49,22},{55,38},{49,43},{43,37}}, C.fireLight)
  rect(img, 39, 39, 20, 6, C.rope)
end

local function campfire(img)
  shadow(img)
  line(img, 27, 67, 69, 48, 9, C.outline)
  line(img, 29, 66, 67, 49, 5, C.wood)
  line(img, 68, 67, 28, 48, 9, C.outline)
  line(img, 66, 66, 30, 49, 5, C.woodLight)
  poly(img, {{47,20},{65,51},{48,67},{31,51}}, C.outline)
  poly(img, {{48,24},{60,51},{48,63},{36,51}}, C.fire)
  poly(img, {{49,31},{55,51},{48,58},{42,50}}, C.fireLight)
end

local function furnace(img)
  shadow(img)
  rect(img, 23, 24, 50, 49, C.outline)
  rect(img, 27, 20, 42, 53, C.stoneDark)
  rect(img, 31, 24, 34, 12, C.stoneLight)
  rect(img, 31, 39, 34, 25, C.outline)
  rect(img, 35, 43, 26, 18, C.dark)
  rect(img, 40, 50, 16, 9, C.fire)
  rect(img, 44, 45, 8, 10, C.fireLight)
  rect(img, 31, 64, 34, 5, C.stone)
end

local function woodWall(img)
  shadow(img)
  rect(img, 21, 25, 54, 46, C.outline)
  rect(img, 25, 27, 46, 40, C.wood)
  for x = 28, 66, 10 do
    rect(img, x, 28, 4, 38, C.woodDark)
    rect(img, x + 2, 29, 2, 34, C.woodLight)
  end
  rect(img, 25, 42, 46, 4, C.rope)
end

local function door(img)
  shadow(img)
  rect(img, 29, 18, 38, 58, C.outline)
  rect(img, 33, 22, 30, 52, C.wood)
  rect(img, 38, 26, 20, 18, C.woodDark)
  rect(img, 38, 49, 20, 18, C.woodDark)
  rect(img, 57, 47, 4, 4, C.fireLight)
  rect(img, 33, 22, 5, 52, C.woodLight)
end

local function fence(img, gate)
  shadow(img)
  for x = 25, 67, 20 do
    rect(img, x, 24, 9, 47, C.outline)
    rect(img, x + 2, 27, 5, 40, C.wood)
    poly(img, {{x,24},{x+4,15},{x+9,24}}, C.outline)
    poly(img, {{x+2,25},{x+4,19},{x+7,25}}, C.woodLight)
  end
  rect(img, 19, 38, 58, 8, C.outline)
  rect(img, 21, 40, 54, 4, C.woodLight)
  rect(img, 19, 56, 58, 8, C.outline)
  rect(img, 21, 58, 54, 4, C.wood)
  if gate then
    line(img, 32, 64, 62, 36, 4, C.rope)
    rect(img, 47, 47, 6, 6, C.fireLight)
  end
end

local function bed(img)
  shadow(img)
  rect(img, 20, 35, 58, 34, C.outline)
  rect(img, 24, 30, 50, 36, C.wood)
  rect(img, 28, 34, 42, 16, color("#7b4b8f"))
  rect(img, 30, 36, 17, 11, color("#d9c7ff"))
  rect(img, 28, 51, 42, 12, C.cloth)
  rect(img, 22, 66, 8, 8, C.woodDark)
  rect(img, 68, 66, 8, 8, C.woodDark)
end

local function nest(img)
  shadow(img)
  ellipse(img, 48, 57, 29, 17, C.outline)
  ring(img, 48, 56, 25, 13, 7, C.straw)
  ellipse(img, 42, 49, 8, 11, color("#fff3cd"))
  ellipse(img, 55, 49, 8, 11, color("#f1dfad"))
  line(img, 28, 58, 69, 49, 3, C.rope)
  line(img, 31, 64, 63, 54, 3, C.strawLight)
end

local function trough(img, water)
  shadow(img)
  rect(img, 20, 42, 58, 25, C.outline)
  rect(img, 25, 38, 48, 25, C.wood)
  rect(img, 29, 42, 40, 12, water and C.water or C.straw)
  rect(img, 25, 56, 48, 7, C.woodDark)
  rect(img, 24, 64, 8, 8, C.woodDark)
  rect(img, 66, 64, 8, 8, C.woodDark)
  if water then line(img, 32, 46, 65, 44, 2, C.waterLight) end
end

local function tableIcon(img)
  shadow(img)
  rect(img, 20, 34, 58, 24, C.outline)
  rect(img, 24, 30, 50, 25, C.wood)
  rect(img, 27, 33, 44, 6, C.woodLight)
  rect(img, 27, 56, 7, 21, C.outline)
  rect(img, 63, 56, 7, 21, C.outline)
  rect(img, 29, 56, 3, 17, C.woodDark)
  rect(img, 65, 56, 3, 17, C.woodDark)
end

local function chair(img)
  shadow(img)
  rect(img, 34, 22, 28, 30, C.outline)
  rect(img, 38, 25, 20, 25, C.wood)
  rect(img, 31, 49, 34, 20, C.outline)
  rect(img, 35, 50, 26, 16, C.woodLight)
  rect(img, 35, 66, 6, 12, C.woodDark)
  rect(img, 55, 66, 6, 12, C.woodDark)
end

local icons = {
  { "clay_brick", brick },
  { "unfired_bowl", function(img) bowl(img, false) end },
  { "bowl", function(img) bowl(img, true) end },
  { "unfired_jug", function(img) jug(img, false) end },
  { "jug", function(img) jug(img, true) end },
  { "spring_drop", springDrop },
  { "tree_seed", treeSeed },
  { "berry", function(img) berries(img, false) end },
  { "roasted_berries", function(img) berries(img, true) end },
  { "cooked_steak", steak },
  { "axe", axe },
  { "scythe", scythe },
  { "lasso", lasso },
  { "torch", torch },
  { "campfire", campfire },
  { "furnace", furnace },
  { "wood_wall", woodWall },
  { "door", door },
  { "fence", function(img) fence(img, false) end },
  { "gate", function(img) fence(img, true) end },
  { "bed", bed },
  { "chicken_nest", nest },
  { "feed_trough", function(img) trough(img, false) end },
  { "water_trough", function(img) trough(img, true) end },
  { "table", tableIcon },
  { "chair", chair }
}

local rendered = {}

for _, entry in ipairs(icons) do
  local name = entry[1]
  local sprite = Sprite(size, size)
  local layer = sprite.layers[1]
  local image = Image(sprite.spec)
  image:clear()
  entry[2](image)
  sprite:newCel(layer, 1, image, Point(0, 0))
  sprite:saveAs(sourceDir .. "/" .. name .. ".aseprite")
  sprite:saveCopyAs(outputDir .. "/" .. name .. ".png")
  table.insert(rendered, { name = name, image = image })
  sprite:close()
end

local cols = 7
local cell = 112
local previewWidth = cols * cell
local previewHeight = math.ceil(#rendered / cols) * cell
local preview = Sprite(previewWidth, previewHeight)
local previewImage = Image(preview.spec)
previewImage:clear()

for index, entry in ipairs(rendered) do
  local col = (index - 1) % cols
  local row = math.floor((index - 1) / cols)
  local ox = col * cell + 8
  local oy = row * cell + 8
  for y = 0, size - 1 do
    for x = 0, size - 1 do
      local pixel = entry.image:getPixel(x, y)
      previewImage:drawPixel(ox + x, oy + y, pixel)
    end
  end
end

preview:newCel(preview.layers[1], 1, previewImage, Point(0, 0))
preview:saveAs(sourceDir .. "/remaining_item_icons_preview.aseprite")
preview:saveCopyAs(outputDir .. "/remaining_item_icons_preview.png")
preview:close()
