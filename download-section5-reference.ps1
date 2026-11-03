# Section 5 developer-only artwork staging.
# Reuse of third-party assets is subject to the copyright owner's permission.
# This never commits, uploads, or redistributes the downloaded files.
param([switch]$IHavePermission)
$ErrorActionPreference='Stop'

if (-not $IHavePermission) {
  throw 'Only use this script when you have permission to download/use the reference artwork. Pass -IHavePermission after checking your rights.'
}

$root = $PSScriptRoot
$destination = Join-Path $root 'assets\reference-dev'
New-Item -ItemType Directory -Force -Path $destination | Out-Null

$assets = @(
  @{ Name='band_plum.webp'; URL='https://undangankahwin.com/images/concierge/packs/tasik-kayangan/band_plum.webp' },
  @{ Name='bfly_blush.webp'; URL='https://undangankahwin.com/images/concierge/packs/anggerik-nirmala/bfly_blush.webp' }
)

function Test-ValidWebP([string]$File) {
  if (-not (Test-Path -LiteralPath $File -PathType Leaf)) { return $false }
  $bytes=[System.IO.File]::ReadAllBytes($File)
  return $bytes.Length -gt 64 -and
    [Text.Encoding]::ASCII.GetString($bytes,0,4) -eq 'RIFF' -and
    [Text.Encoding]::ASCII.GetString($bytes,8,4) -eq 'WEBP'
}

foreach($asset in $assets) {
  $target=Join-Path $destination $asset.Name
  if(Test-ValidWebP $target){
    Write-Host ('Verified local WebP: ' + $asset.Name)
    continue
  }
  $temp=$target+'.download'
  try {
    Write-Host ('Downloading for local comparison: '+ $asset.Name)
    Invoke-WebRequest -Uri $asset.URL -OutFile $temp -MaximumRedirection 5 -TimeoutSec 60
    if(-not (Test-ValidWebP $temp)){
      throw ('Invalid WebP response for '+$asset.Name)
    }
    Move-Item -LiteralPath $temp -Destination $target -Force
  } finally {
    if(Test-Path -LiteralPath $temp){Remove-Item -LiteralPath $temp -Force}
  }
}
Write-Host 'Section 5 reference WebPs ready locally (never push these files to public GitHub).' -ForegroundColor Green
Write-Host 'Open: http://localhost:8000/?orderReference=1'
