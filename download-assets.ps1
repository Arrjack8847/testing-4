# Downloads the 25 original WebP images with the project owner's stated permission.
$ErrorActionPreference = 'Stop'
$root = 'https://undangankahwin.com/images/concierge/packs/tasik-kayangan/'
$files = @(
  'scene.webp','sky.webp','palace.webp','reeds.webp','arch.webp',
  'tree_l.webp','tree_r.webp','drape.webp',
  'hang_1.webp','hang_2.webp','hang_3.webp','hang_4.webp',
  'spike_3.webp','spike_4.webp','spike_5.webp','stem_1.webp','stem_2.webp',
  'leaf_4.webp','leaf_5.webp','leaf_6.webp',
  'bloom_1.webp','bloom_2.webp','bloom_5.webp','bloom_6.webp','peacock.webp'
)
$destination = Join-Path $PSScriptRoot 'assets'
New-Item -Path $destination -ItemType Directory -Force | Out-Null
foreach ($file in $files) {
  $target = Join-Path $destination $file
  if ((Test-Path $target) -and (Get-Item $target).Length -gt 64) {
    Write-Host "Already present: $file"
    continue
  }
  Write-Host "Downloading: $file"
  Invoke-WebRequest -Uri ($root + $file) -OutFile $target -MaximumRedirection 5
  $bytes = [System.IO.File]::ReadAllBytes($target)
  if ($bytes.Length -lt 16 -or
      [Text.Encoding]::ASCII.GetString($bytes,0,4) -ne 'RIFF' -or
      [Text.Encoding]::ASCII.GetString($bytes,8,4) -ne 'WEBP') {
    Remove-Item $target -Force
    throw "Invalid WebP from source: $file"
  }
}
Write-Host "All 25 WebP files verified in $destination." -ForegroundColor Green
