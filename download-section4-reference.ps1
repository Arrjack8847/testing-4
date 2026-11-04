# Stage exact Section 4 reference artwork for locally authorized development only.
# Neither this script nor the repository includes vendor artwork.
# Original source images remain third-party copyrighted assets.
param(
  [switch]$IHavePermission,
  [switch]$VerifyOnly
)
$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$destination = Join-Path $root 'assets\reference-dev'
$assets = @(
  @{
    Name = 'paper.webp'
    Url = 'https://undangankahwin.com/images/concierge/packs/tasik-kayangan/paper.webp'
    Format = 'WebP'
  },
  @{
    Name = 'arch_event.svg'
    Url = 'https://undangankahwin.com/images/concierge/packs/tasik-kayangan/arch_event.svg'
    Format = 'SVG'
  },
  @{
    Name = 'bfly_white.webp'
    Url = 'https://undangankahwin.com/images/concierge/packs/anggerik-nirmala/bfly_white.webp'
    Format = 'WebP'
  }
)

function Test-ReferenceAsset([string]$Path, [string]$Format) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
  if ($Format -eq 'WebP') {
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    if ($bytes.Length -le 64) { return $false }
    return [System.Text.Encoding]::ASCII.GetString($bytes,0,4) -eq 'RIFF' -and
      [System.Text.Encoding]::ASCII.GetString($bytes,8,4) -eq 'WEBP'
  }
  try {
    [xml]$svg = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    return $svg.DocumentElement.LocalName -eq 'svg'
  } catch {
    return $false
  }
}

if (-not $VerifyOnly -and -not $IHavePermission) {
  throw 'Only download/use the source-owned artwork if you have permission. Pass -IHavePermission, or use -VerifyOnly to inspect files already present.'
}

if (-not $VerifyOnly) {
  New-Item -ItemType Directory -Force -Path $destination | Out-Null
}

$failed = 0
foreach ($asset in $assets) {
  $target = Join-Path $destination $asset.Name
  if ($VerifyOnly) {
    if (-not (Test-ReferenceAsset $target $asset.Format)) {
      Write-Host ('MISSING/INVALID: ' + $asset.Name) -ForegroundColor Yellow
      $failed++
      continue
    }
  } else {
    # Refresh from the exact source URL rather than trusting a same-named local file.
    $temp = $target + '.download'
    try {
      Write-Host ('Fetching exact source asset: ' + $asset.Name)
      Invoke-WebRequest -Uri $asset.Url -OutFile $temp -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 60
      if (-not (Test-ReferenceAsset $temp $asset.Format)) {
        throw ('Source response was not a valid ' + $asset.Format + ': ' + $asset.Name)
      }
      Move-Item -LiteralPath $temp -Destination $target -Force
    } catch {
      $failed++
      Write-Warning ('Could not stage ' + $asset.Name + ': ' + $_.Exception.Message)
    } finally {
      if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force }
    }
  }
  if (Test-ReferenceAsset $target $asset.Format) {
    $hash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    $size = (Get-Item -LiteralPath $target).Length
    Write-Host ('VALID: {0} ({1} bytes, SHA256 {2})' -f $asset.Name,$size,$hash) -ForegroundColor Green
  }
}
if ($failed -gt 0) { throw ('Section 4 source asset verification failed for ' + $failed + ' file(s).') }
Write-Host 'Three identified Section 4 source assets are ready in assets/reference-dev (gitignored).' -ForegroundColor Green
Write-Host 'This confirms file formats, not 1:1 visual parity or commercial usage rights.'
