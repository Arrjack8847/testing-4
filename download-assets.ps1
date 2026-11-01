# Fetch the original artwork only where its owner's license permits use.
# All files stay on the local machine; this script never republishes them.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$root = 'https://undangankahwin.com/images/concierge/packs/tasik-kayangan/'
$files = @(Get-Content (Join-Path $PSScriptRoot 'ASSET-MANIFEST.txt') |
  Where-Object { $_ -match '^[a-z0-9_]+\.webp$' })
if ($files.Count -ne 25) { throw "Expected 25 artwork files; found $($files.Count)." }

function Test-ValidWebP([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  return $bytes.Length -gt 64 -and
    [Text.Encoding]::ASCII.GetString($bytes,0,4) -eq 'RIFF' -and
    [Text.Encoding]::ASCII.GetString($bytes,8,4) -eq 'WEBP'
}

$destination = Join-Path $PSScriptRoot 'assets'
New-Item -Path $destination -ItemType Directory -Force | Out-Null
foreach ($file in $files) {
  $target = Join-Path $destination $file
  if (Test-ValidWebP $target) {
    Write-Host "Verified: $file"
    continue
  }
  Write-Host "Downloading or repairing: $file"
  $temporary = $target + '.download'
  try {
    Invoke-WebRequest -Uri ($root + $file) -OutFile $temporary -MaximumRedirection 5
    if (-not (Test-ValidWebP $temporary)) {
      throw "Invalid WebP downloaded from source: $file"
    }
    Move-Item -LiteralPath $temporary -Destination $target -Force
  } finally {
    if (Test-Path -LiteralPath $temporary) {
      Remove-Item -LiteralPath $temporary -Force
    }
  }
}
Write-Host "All $($files.Count) WebP files verified in $destination." -ForegroundColor Green
