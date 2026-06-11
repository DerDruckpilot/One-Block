local sourceDir = "assets/source/aseprite/objects/crystal"
local outputDir = "assets/generated/objects/crystal"

local WIDTH = 96
local HEIGHT = 144

local C = {
  clear = Color{r=0,g=0,b=0,a=0},
  shadow = Color{r=31,g=26,b=31,a=160},
  stoneDeep = Color{r=53,g=48,b=55,a=255},
  stoneDark = Color{r=82,g=76,b=84,a=255},
  stoneMid = Color{r=116,g=108,b=113,a=255},
  stoneLight = Color{r=171,g=160,b=151,a=255},
  mossDark = Color{r=50,g=91,b=45,a=255},
  mossLight = Color{r=122,g=174,b=76,a=255},
  rune = Color{r=220,g=176,b=255,a=255},
  glow = Color{r=177,g=82,b=255,a=84},
  crystalDeep = Color{r=48,g=24,b=125,a=255},
  crystalDark = Color{r=87,g=34,b=173,a=255},
  crystalMid = Color{r=147,g=61,b=225,a=255},
  crystalLight = Color{r=214,g=128,b=255,a=255},
  crystalHi = Color{r=255,g=225,b=255,a=255},
  shard = Color{r=190,g=92,b=255,a=235}
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

local function diamond(img, cx, cy, rw, rh, color, outline)
  if outline then
    polygon(img, {{cx, cy - rh - 2}, {cx + rw + 2, cy}, {cx, cy + rh + 2}, {cx - rw - 2, cy}}, outline)
  end
  polygon(img, {{cx, cy - rh}, {cx + rw, cy}, {cx, cy + rh}, {cx - rw, cy}}, color)
end

local function drawStone(img, cx, cy, rx, ry, lightOffset)
  ellipse(img, cx + 1, cy + 3, rx + 1, ry + 1, C.stoneDeep)
  ellipse(img, cx, cy, rx, ry, C.stoneDark)
  ellipse(img, cx - 1, cy - 1, math.max(2, rx - 2), math.max(2, ry - 2), C.stoneMid)
  rect(img, cx - lightOffset, cy - ry + 2, math.max(3, rx), 2, C.stoneLight)
end

local function drawCrystalAsset(img)
  ellipse(img, 48, 122, 36, 14, C.shadow)
  ellipse(img, 48, 118, 34, 13, C.stoneDeep)
  ellipse(img, 48, 115, 30, 10, C.stoneDark)
  ellipse(img, 48, 113, 24, 7, C.stoneMid)
  ellipse(img, 48, 113, 16, 4, C.stoneLight)
  ellipse(img, 48, 113, 11, 3, C.rune)
  ellipse(img, 48, 113, 7, 2, C.stoneDark)

  drawStone(img, 18, 112, 8, 9, 3)
  drawStone(img, 30, 126, 9, 8, 4)
  drawStone(img, 48, 132, 10, 7, 4)
  drawStone(img, 66, 126, 9, 8, 4)
  drawStone(img, 78, 112, 8, 9, 3)
  rect(img, 24, 111, 8, 3, C.mossDark)
  rect(img, 26, 109, 7, 3, C.mossLight)
  rect(img, 65, 116, 9, 3, C.mossDark)
  rect(img, 63, 114, 7, 3, C.mossLight)

  ellipse(img, 48, 62, 31, 47, C.glow)
  polygon(img, {{48, 11}, {70, 42}, {61, 87}, {48, 105}, {34, 88}, {26, 43}}, C.crystalDeep)
  polygon(img, {{48, 15}, {65, 43}, {56, 84}, {48, 98}, {39, 84}, {31, 43}}, C.crystalDark)
  polygon(img, {{48, 15}, {55, 42}, {51, 95}, {40, 84}, {32, 43}}, C.crystalMid)
  polygon(img, {{49, 15}, {65, 43}, {56, 84}, {51, 95}, {55, 42}}, C.crystalLight)
  polygon(img, {{48, 20}, {54, 43}, {49, 57}, {42, 45}}, C.crystalHi)
  polygon(img, {{41, 51}, {49, 61}, {47, 86}, {39, 78}}, C.crystalLight)
  polygon(img, {{55, 50}, {62, 44}, {58, 76}, {51, 88}}, C.crystalMid)
  line(img, 48, 16, 48, 101, C.crystalHi, 1)
  line(img, 32, 43, 64, 43, C.crystalDeep, 2)
  line(img, 38, 84, 58, 84, C.crystalDeep, 2)
  rect(img, 44, 27, 4, 14, C.crystalHi)
  rect(img, 39, 59, 3, 8, C.crystalHi)
  rect(img, 53, 36, 3, 7, C.crystalHi)

  diamond(img, 21, 50, 5, 8, C.shard, C.crystalDeep)
  diamond(img, 76, 58, 4, 7, C.shard, C.crystalDeep)
  diamond(img, 28, 86, 3, 5, C.crystalLight, C.crystalDeep)
  diamond(img, 72, 88, 3, 5, C.crystalLight, C.crystalDeep)
  rect(img, 18, 39, 2, 2, C.crystalHi)
  rect(img, 78, 74, 2, 2, C.crystalHi)
end

local sprite = Sprite(WIDTH, HEIGHT)
sprite.filename = app.fs.joinPath(sourceDir, "crystal_core_96.aseprite")
local img = sprite.cels[1].image
img:clear(C.clear)
drawCrystalAsset(img)
app.command.SaveFileAs{filename=sprite.filename}
app.command.SaveFileCopyAs{filename=app.fs.joinPath(outputDir, "crystal_core_96.png")}
app.command.SaveFileCopyAs{filename=app.fs.joinPath(outputDir, "crystal_core_96_preview.png")}
sprite:close()
