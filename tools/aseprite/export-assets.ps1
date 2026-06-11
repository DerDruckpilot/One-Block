param(
  [string]$SourceDir,
  [string]$OutputDir,
  [string]$AsepriteCommand = "aseprite"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")

if (-not $SourceDir) {
  $SourceDir = Join-Path $repoRoot "assets/source/aseprite"
}

if (-not $OutputDir) {
  $OutputDir = Join-Path $repoRoot "assets/generated"
}

$sourceRoot = Resolve-Path $SourceDir
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$outputRoot = Resolve-Path $OutputDir

$aseprite = Get-Command $AsepriteCommand -ErrorAction SilentlyContinue
if (-not $aseprite) {
  throw "Aseprite wurde nicht gefunden. Installiere Aseprite oder stelle sicher, dass '$AsepriteCommand' im PATH erreichbar ist."
}

$sourceFiles = Get-ChildItem -Path $sourceRoot -Recurse -File |
  Where-Object { $_.Extension -in ".ase", ".aseprite" }

if (-not $sourceFiles) {
  Write-Host "Keine Aseprite-Quelldateien in '$sourceRoot' gefunden."
  exit 0
}

foreach ($sourceFile in $sourceFiles) {
  $sourceRootPath = $sourceRoot.Path.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
  $relativePath = $sourceFile.FullName.Substring($sourceRootPath.Length).TrimStart([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
  $relativeOutput = [System.IO.Path]::ChangeExtension($relativePath, ".png")
  $outputPath = Join-Path $outputRoot $relativeOutput
  $outputDirectory = Split-Path $outputPath -Parent

  New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

  Write-Host "Exportiere $relativePath -> $relativeOutput"
  & $aseprite.Source --batch $sourceFile.FullName --save-as $outputPath
}
