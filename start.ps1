# Mobile scene preview. Requires Python (py or python).
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Test-ValidWebP([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  return $bytes.Length -gt 64 -and
    [Text.Encoding]::ASCII.GetString($bytes,0,4) -eq 'RIFF' -and
    [Text.Encoding]::ASCII.GetString($bytes,8,4) -eq 'WEBP'
}

$manifest = Join-Path $PSScriptRoot 'ASSET-MANIFEST.txt'
if (-not (Test-Path $manifest)) { throw 'ASSET-MANIFEST.txt not found.' }
$required = @(Get-Content $manifest | Where-Object { $_ -match '^[a-z0-9_]+\.webp$' })
if ($required.Count -ne 25) { throw "Expected 25 WebP artwork files; manifest lists $($required.Count)." }

$missing = @($required | Where-Object {
  -not (Test-ValidWebP (Join-Path $PSScriptRoot ("assets\" + $_)))
})
if ($missing.Count -gt 0) {
  Write-Host "Repairing $($missing.Count) missing or invalid artwork files..." -ForegroundColor Yellow
  & (Join-Path $PSScriptRoot 'download-assets.ps1')
}
$stillMissing = @($required | Where-Object {
  -not (Test-ValidWebP (Join-Path $PSScriptRoot ("assets\" + $_)))
})
if ($stillMissing.Count -gt 0) {
  throw "Artwork incomplete after download: $($stillMissing -join ', ')"
}

$py = Get-Command py -ErrorAction SilentlyContinue
if ($null -ne $py) {
  Write-Host 'Visit http://localhost:8000 (or http://localhost:8000/?debug=1).' -ForegroundColor Green
  & py -m http.server 8000 --bind 0.0.0.0
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  Write-Host 'Visit http://localhost:8000 (or http://localhost:8000/?debug=1).' -ForegroundColor Green
  & python -m http.server 8000 --bind 0.0.0.0
} else {
  throw 'Python not found. Install Python or serve this directory with a different static web server.'
}
