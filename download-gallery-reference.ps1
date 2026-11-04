<#
.SYNOPSIS
Download the five Tasik Kayangan gallery WebPs into a local-only QA folder.
.DESCRIPTION
Requires explicit confirmation that you have the right to make and use these
copies. Files are never uploaded or committed by this script. The destination
is excluded from Git by .gitignore.
.EXAMPLE
powershell -ExecutionPolicy Bypass -File .\download-gallery-reference.ps1 -IHaveRights
#>
[CmdletBinding()]
param([switch]$IHaveRights)
$ErrorActionPreference = 'Stop'
if (-not $IHaveRights) {
  throw 'The reference photographs are third-party content. Run with -IHaveRights only if you have permission to download and use them.'
}

$source = 'https://undangankahwin.com/images/concierge/couples/'
$files = @(
  'moody.webp',
  'moody-bride.webp',
  'moody-groom.webp',
  'moody-garden.webp',
  'moody-lake.webp'
)
$destination = Join-Path $PSScriptRoot 'assets\gallery\reference'
New-Item -ItemType Directory -Path $destination -Force | Out-Null

function Test-ValidWebP([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  return $bytes.Length -gt 64 -and
    [Text.Encoding]::ASCII.GetString($bytes,0,4) -eq 'RIFF' -and
    [Text.Encoding]::ASCII.GetString($bytes,8,4) -eq 'WEBP'
}

foreach ($name in $files) {
  $target = Join-Path $destination $name
  if (Test-ValidWebP $target) {
    Write-Host "Verified existing: $name"
    continue
  }
  $temp = $target + '.download'
  Write-Host "Downloading $name into local-only gallery reference folder..."
  try {
    Invoke-WebRequest -Uri ($source + $name) -OutFile $temp -MaximumRedirection 5
    if (-not (Test-ValidWebP $temp)) {
      throw "Downloaded file is not a valid WebP: $name"
    }
    Move-Item -LiteralPath $temp -Destination $target -Force
  }
  finally {
    if (Test-Path -LiteralPath $temp) {
      Remove-Item -LiteralPath $temp -Force
    }
  }
}
Write-Host 'Local Gallery comparison WebPs verified (5/5).' -ForegroundColor Green
Write-Host 'Open: http://localhost:8000/ (the five downloaded WebPs auto-load in the local preview)' -ForegroundColor Cyan
Write-Host 'Optional strict comparison: http://localhost:8000/?galleryReference=1'
Write-Host 'These files are ignored by Git. Do not publish third-party photos without appropriate permission.'
