local repoRoot = "C:/Codex/One-Block"
local sourceDir = repoRoot .. "/assets/source/aseprite/objects/placeables_96"
local outputDir = repoRoot .. "/assets/generated/objects/placeables_96"
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
  shadow = color("#1b120d", 55),
  woodDark = color("#4a2918"),
  wood = color("#87512c"),
  woodMid = color("#a86837"),
  woodLight = color("#d09350"),
  rope = color("#c68a42"),
  ropeDark = color("#6b4327"),
  stoneDark = color("#42464b"),
  stone = color("#747b80"),
  stoneLight = color("#b0b7b9"),
  clayDark = color("#5b3325"),
  clay = color("#9f5b35"),
  clayLight = color("#d08a4f"),
  strawDark = color("#8b692d"),
  straw = color("#c69b43"),
  strawLight = color("#ead36a"),
  clothDark = color("#7e4933"),
  cloth = color("#ead9b8"),
  clothLight = color("#fff0c9"),
  waterDark = color("#1f6f9c"),
  water = color("#3fa7d9"),
  waterLight = color("#b9f7ff"),
  leafDark = color("#2f6f35"),
  leaf = color("#559943"),
  leafLight = color("#91cf63"),
  fireDark = color("#b63b22"),
  fire = color("#f05a28"),
  fireLight = color("#ffd966")
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
    for xx = x, x + w - 1 do put(img, xx, yy, c) end
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

local function createSprite(name, drawFn)
  local sprite = Sprite(size, size, ColorMode.RGB)
  sprite.filename = sourceDir .. "/" .. name .. ".aseprite"
  local img = sprite.cels[1].image
  drawFn(img)
  sprite:saveAs(sprite.filename)
  sprite:saveCopyAs(outputDir .. "/" .. name .. ".png")
  sprite:close()
end

local function drawShadow(img, cx, cy, rx, ry)
  ellipse(img, cx, cy, rx, ry, C.shadow)
end

local function drawWoodPlank(img, x, y, w, h)
  rect(img, x - 2, y - 2, w + 4, h + 4, C.outline)
  rect(img, x, y, w, h, C.wood)
  rect(img, x + 2, y + 2, w - 4, 3, C.woodLight)
  rect(img, x + 4, y + h - 5, w - 8, 2, C.woodDark)
end

local function drawWorkbench(img)
  drawShadow(img, 48, 72, 26, 10)
  drawWoodPlank(img, 23, 33, 50, 18)
  rect(img, 27, 51, 10, 25, C.woodDark)
  rect(img, 59, 51, 10, 25, C.woodDark)
  rect(img, 33, 40, 8, 5, C.rope)
  rect(img, 53, 40, 8, 5, C.rope)
  rect(img, 18, 50, 60, 10, C.outline)
  rect(img, 20, 50, 56, 7, C.woodMid)
end

local function drawTorch(img)
  drawShadow(img, 48, 73, 11, 5)
  rect(img, 43, 42, 10, 32, C.outline)
  rect(img, 45, 43, 6, 30, C.woodDark)
  line(img, 42, 47, 54, 38, 3, C.rope)
  ellipse(img, 48, 31, 13, 18, C.fireDark)
  ellipse(img, 48, 27, 9, 15, C.fire)
  ellipse(img, 49, 23, 5, 11, C.fireLight)
end

local function drawCampfire(img)
  drawShadow(img, 48, 72, 27, 9)
  line(img, 27, 65, 68, 48, 8, C.woodDark)
  line(img, 68, 65, 28, 48, 8, C.wood)
  line(img, 31, 67, 69, 67, 7, C.woodMid)
  ellipse(img, 48, 47, 17, 24, C.fireDark)
  ellipse(img, 48, 41, 12, 20, C.fire)
  ellipse(img, 50, 34, 7, 14, C.fireLight)
  rect(img, 27, 67, 41, 5, C.outline)
end

local function drawFurnace(img)
  drawShadow(img, 48, 76, 27, 10)
  rect(img, 25, 28, 46, 45, C.outline)
  rect(img, 28, 31, 40, 39, C.stone)
  rect(img, 33, 36, 11, 10, C.stoneLight)
  rect(img, 48, 36, 13, 11, C.stoneDark)
  rect(img, 35, 51, 26, 18, C.outline)
  rect(img, 39, 54, 18, 12, C.fireDark)
  rect(img, 43, 53, 10, 9, C.fireLight)
end

local function drawBed(img)
  drawShadow(img, 48, 73, 32, 10)
  rect(img, 20, 31, 57, 35, C.outline)
  rect(img, 24, 35, 49, 27, C.woodDark)
  rect(img, 28, 38, 41, 20, C.cloth)
  rect(img, 28, 38, 15, 12, C.clothLight)
  rect(img, 26, 58, 47, 9, C.wood)
  rect(img, 19, 64, 8, 13, C.woodDark)
  rect(img, 70, 64, 8, 13, C.woodDark)
end

local function drawNest(img)
  drawShadow(img, 48, 71, 25, 8)
  ellipse(img, 48, 58, 28, 17, C.outline)
  ellipse(img, 48, 57, 24, 13, C.strawDark)
  ellipse(img, 48, 55, 17, 8, C.straw)
  line(img, 28, 54, 66, 64, 3, C.strawLight)
  line(img, 30, 64, 64, 51, 3, C.rope)
  ellipse(img, 43, 51, 6, 8, C.clothLight)
  ellipse(img, 54, 52, 6, 8, C.cloth)
end

local function drawTrough(img, filled, isWater)
  drawShadow(img, 48, 72, 28, 8)
  rect(img, 20, 48, 57, 18, C.outline)
  rect(img, 24, 50, 49, 12, C.woodDark)
  rect(img, 27, 51, 43, 8, C.wood)
  if filled then
    if isWater then
      rect(img, 30, 50, 37, 6, C.water)
      rect(img, 35, 51, 13, 2, C.waterLight)
    else
      rect(img, 29, 49, 38, 8, C.straw)
      rect(img, 35, 47, 7, 4, C.strawLight)
      rect(img, 52, 48, 8, 4, C.strawLight)
    end
  end
  rect(img, 23, 64, 9, 10, C.woodDark)
  rect(img, 64, 64, 9, 10, C.woodDark)
end

local function drawTable(img)
  drawShadow(img, 48, 73, 27, 8)
  drawWoodPlank(img, 22, 36, 52, 15)
  rect(img, 27, 51, 9, 24, C.woodDark)
  rect(img, 61, 51, 9, 24, C.woodDark)
  rect(img, 30, 41, 36, 3, C.woodLight)
end

local function drawChair(img)
  drawShadow(img, 48, 72, 20, 7)
  rect(img, 30, 25, 36, 31, C.outline)
  rect(img, 34, 29, 28, 22, C.woodDark)
  rect(img, 37, 33, 22, 5, C.woodLight)
  drawWoodPlank(img, 28, 52, 40, 12)
  rect(img, 34, 63, 7, 13, C.woodDark)
  rect(img, 56, 63, 7, 13, C.woodDark)
end

local variants = {
  "single", "horizontal", "vertical",
  "corner-up-left", "corner-up-right", "corner-down-left", "corner-down-right",
  "tee-up", "tee-right", "tee-down", "tee-left",
  "cross", "end-up", "end-right", "end-down", "end-left"
}

local variantConnections = {
  single = {},
  horizontal = { left = true, right = true },
  vertical = { up = true, down = true },
  ["corner-up-left"] = { up = true, left = true },
  ["corner-up-right"] = { up = true, right = true },
  ["corner-down-left"] = { down = true, left = true },
  ["corner-down-right"] = { down = true, right = true },
  ["tee-up"] = { left = true, right = true, down = true },
  ["tee-right"] = { up = true, down = true, left = true },
  ["tee-down"] = { left = true, right = true, up = true },
  ["tee-left"] = { up = true, down = true, right = true },
  cross = { up = true, down = true, left = true, right = true },
  ["end-up"] = { up = true },
  ["end-right"] = { right = true },
  ["end-down"] = { down = true },
  ["end-left"] = { left = true }
}

local function has(c, key) return c[key] == true end

local function drawWallBase(img, variant, doorState)
  local c = variantConnections[variant] or {}
  local any = has(c, "up") or has(c, "down") or has(c, "left") or has(c, "right")
  drawShadow(img, 48, 69, 31, 7)
  if not any or has(c, "left") or has(c, "right") then
    local full = has(c, "left") or has(c, "right")
    rect(img, has(c, "left") and 0 or 16, 30, full and 96 or 64, 34, C.outline)
    rect(img, has(c, "left") and 0 or 18, 33, full and 96 or 60, 26, C.woodDark)
    rect(img, has(c, "left") and 0 or 20, 37, full and 96 or 56, 5, C.woodLight)
    rect(img, has(c, "left") and 0 or 20, 49, full and 96 or 56, 3, C.wood)
  end
  if has(c, "up") or has(c, "down") or (not any) then
    local full = has(c, "up") or has(c, "down")
    rect(img, 38, has(c, "up") and 0 or 20, 20, full and 96 or 58, C.outline)
    rect(img, 41, has(c, "up") and 0 or 23, 14, full and 96 or 52, C.woodDark)
    rect(img, 44, has(c, "up") and 0 or 27, 4, full and 92 or 44, C.woodLight)
  end
  rect(img, 35, 29, 26, 36, C.outline)
  rect(img, 39, 33, 18, 28, C.wood)
  if doorState == "closed" then
    rect(img, 35, 28, 26, 42, C.outline)
    rect(img, 39, 31, 18, 35, C.woodMid)
    rect(img, 42, 34, 12, 5, C.woodLight)
    rect(img, 52, 48, 3, 4, C.rope)
  elseif doorState == "open" then
    poly(img, { { 39, 31 }, { 62, 39 }, { 62, 68 }, { 39, 62 } }, C.outline)
    poly(img, { { 42, 34 }, { 58, 40 }, { 58, 63 }, { 42, 59 } }, C.woodMid)
  end
end

local function drawFenceBase(img, variant, gateState)
  local c = variantConnections[variant] or {}
  local any = has(c, "up") or has(c, "down") or has(c, "left") or has(c, "right")
  drawShadow(img, 48, 70, 30, 7)
  local function post(px, py)
    rect(img, px - 5, py - 17, 10, 35, C.outline)
    rect(img, px - 3, py - 15, 6, 31, C.woodDark)
    rect(img, px - 2, py - 14, 2, 25, C.woodLight)
  end
  if not any or has(c, "left") or has(c, "right") then
    line(img, has(c, "left") and 0 or 24, 48, has(c, "right") and 96 or 72, 48, 8, C.outline)
    line(img, has(c, "left") and 0 or 24, 48, has(c, "right") and 96 or 72, 48, 4, C.wood)
    line(img, has(c, "left") and 0 or 24, 61, has(c, "right") and 96 or 72, 61, 8, C.outline)
    line(img, has(c, "left") and 0 or 24, 61, has(c, "right") and 96 or 72, 61, 4, C.woodMid)
    post(24, 58)
    post(72, 58)
  end
  if has(c, "up") or has(c, "down") or (not any) then
    line(img, 48, has(c, "up") and 0 or 25, 48, has(c, "down") and 96 or 72, 8, C.outline)
    line(img, 48, has(c, "up") and 0 or 25, 48, has(c, "down") and 96 or 72, 4, C.wood)
    line(img, 59, has(c, "up") and 0 or 25, 59, has(c, "down") and 96 or 72, 7, C.outline)
    line(img, 59, has(c, "up") and 0 or 25, 59, has(c, "down") and 96 or 72, 3, C.woodMid)
    post(48, 58)
  end
  if gateState == "closed" then
    rect(img, 31, 42, 34, 26, C.outline)
    line(img, 35, 47, 61, 62, 5, C.woodLight)
    line(img, 35, 62, 61, 47, 5, C.wood)
  elseif gateState == "open" then
    poly(img, { { 32, 43 }, { 63, 31 }, { 68, 43 }, { 37, 65 } }, C.outline)
    line(img, 37, 48, 63, 38, 4, C.woodLight)
    line(img, 39, 60, 65, 43, 4, C.wood)
  end
end

createSprite("workbench_96", drawWorkbench)
createSprite("torch_96", drawTorch)
createSprite("campfire_96", drawCampfire)
createSprite("furnace_96", drawFurnace)
createSprite("bed_96", drawBed)
createSprite("chicken_nest_96", drawNest)
createSprite("feed_trough_empty_96", function(img) drawTrough(img, false, false) end)
createSprite("feed_trough_full_96", function(img) drawTrough(img, true, false) end)
createSprite("water_trough_empty_96", function(img) drawTrough(img, false, true) end)
createSprite("water_trough_full_96", function(img) drawTrough(img, true, true) end)
createSprite("table_96", drawTable)
createSprite("chair_96", drawChair)

for _, variant in ipairs(variants) do
  createSprite("wood_wall_" .. variant .. "_96", function(img) drawWallBase(img, variant, nil) end)
  createSprite("door_closed_" .. variant .. "_96", function(img) drawWallBase(img, variant, "closed") end)
  createSprite("door_open_" .. variant .. "_96", function(img) drawWallBase(img, variant, "open") end)
  createSprite("fence_" .. variant .. "_96", function(img) drawFenceBase(img, variant, nil) end)
  createSprite("gate_closed_" .. variant .. "_96", function(img) drawFenceBase(img, variant, "closed") end)
  createSprite("gate_open_" .. variant .. "_96", function(img) drawFenceBase(img, variant, "open") end)
end

local function paste(dest, sourcePath, ox, oy)
  local sprite = Sprite{ fromFile = sourcePath }
  local src = sprite.cels[1].image
  for y = 0, size - 1 do
    for x = 0, size - 1 do
      local pixel = src:getPixel(x, y)
      if app.pixelColor.rgbaA(pixel) > 0 then
        dest:drawPixel(ox + x, oy + y, pixel)
      end
    end
  end
  sprite:close()
end

local function makePreview()
  local names = {
    "workbench_96", "torch_96", "campfire_96", "furnace_96", "bed_96", "chicken_nest_96",
    "feed_trough_full_96", "water_trough_full_96", "table_96", "chair_96"
  }
  local preview = Sprite(5 * size, 2 * size, ColorMode.RGB)
  local img = preview.cels[1].image
  for i, name in ipairs(names) do
    local col = (i - 1) % 5
    local row = math.floor((i - 1) / 5)
    paste(img, outputDir .. "/" .. name .. ".png", col * size, row * size)
  end
  preview:saveAs(sourceDir .. "/placeable_world_objects_preview.aseprite")
  preview:saveCopyAs(outputDir .. "/placeable_world_objects_preview.png")
  preview:close()
end

local function makeBarrierPreview()
  local names = {
    "wood_wall_corner-down-right_96", "wood_wall_horizontal_96", "door_closed_horizontal_96", "door_open_horizontal_96",
    "fence_corner-down-right_96", "fence_horizontal_96", "gate_closed_horizontal_96", "gate_open_horizontal_96"
  }
  local preview = Sprite(4 * size, 2 * size, ColorMode.RGB)
  local img = preview.cels[1].image
  for i, name in ipairs(names) do
    local col = (i - 1) % 4
    local row = math.floor((i - 1) / 4)
    paste(img, outputDir .. "/" .. name .. ".png", col * size, row * size)
  end
  preview:saveAs(sourceDir .. "/connected_barriers_preview.aseprite")
  preview:saveCopyAs(outputDir .. "/connected_barriers_preview.png")
  preview:close()
end

makePreview()
makeBarrierPreview()
