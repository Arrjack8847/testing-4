# Mobile scene preview. Requires Python (py or python).
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$required = @('scene.webp','sky.webp','palace.webp','reeds.webp','arch.webp','tree_l.webp','tree_r.webp','drape.webp','peacock.webp')
$missing = @($required | Where-Object { -not (Test-Path (Join-Path $PSScriptRoot ("assets\\" + $_))) })
if ($missing.Count -gt 0) {
  Write-Host 'Some reference images are missing; downloading artwork...' -ForegroundColor Yellow
  & (Join-Path $PSScriptRoot 'download-assets.ps1')
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
