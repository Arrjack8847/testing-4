param(
  [switch]$AllReferenceLayers
)

# Stage artwork ALREADY uploaded to the owner's GitHub repository.
# This never downloads from the reference vendor's website or commits binaries.
# The destination is Git-ignored and intended for permission-cleared local review.
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  $sourceBranch = 'assets/shared-artwork-20261104'
  $sourceRef = 'origin/' + $sourceBranch
  $fetchRefspec = '+refs/heads/' + $sourceBranch + ':refs/remotes/origin/' + $sourceBranch

  Write-Host 'Fetching the existing GitHub artwork branch...'
  & git fetch origin $fetchRefspec
  if ($LASTEXITCODE -ne 0) { throw 'Could not fetch the shared-artwork branch from origin.' }

  $names = @('scene.webp')
  if ($AllReferenceLayers) {
    $names = @(
      Get-Content -LiteralPath './ASSET-MANIFEST.txt' |
      Where-Object { $_ -match '^[a-z0-9_]+\.webp$' }
    )
    if ($names.Count -ne 25) { throw "Expected 25 files in ASSET-MANIFEST.txt; found $($names.Count)." }
  }

  $destination = Join-Path $PSScriptRoot 'assets\reference-dev'
  New-Item -ItemType Directory -Force -Path $destination | Out-Null

  foreach ($name in $names) {
    if ($name -notmatch '^[a-z0-9_]+\.webp$') { throw "Invalid artwork filename: $name" }
    $blobRef = $sourceRef + ':assets/' + $name
    & git cat-file -e $blobRef
    if ($LASTEXITCODE -ne 0) { throw "Not found in shared artwork branch: assets/$name" }

    # Windows PowerShell 5.1 pipelines are text-based and can corrupt binary WebPs.
    # Redirect Git's stdout with cmd.exe so the original WebP bytes remain intact.
    $command = 'git show "' + $blobRef + '" > "assets\reference-dev\' + $name + '"'
    & cmd.exe /d /c $command
    if ($LASTEXITCODE -ne 0) { throw "Could not stage $name" }

    $path = Join-Path $destination $name
    $bytes = [System.IO.File]::ReadAllBytes($path)
    if ($bytes.Length -lt 12 -or
        [System.Text.Encoding]::ASCII.GetString($bytes,0,4) -ne 'RIFF' -or
        [System.Text.Encoding]::ASCII.GetString($bytes,8,4) -ne 'WEBP') {
      Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
      throw "Staged file is not a valid WebP: $name"
    }
    Write-Host "Staged $name ($($bytes.Length) bytes) -> assets/reference-dev/$name"
  }

  & git check-ignore 'assets/reference-dev/scene.webp' | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'The reference-dev path is not Git-ignored. Stop before committing.' }

  Write-Host ''
  Write-Host 'Section 10 can now load the staged scene automatically on http://localhost:8000/'
  Write-Host 'These files are not committed; confirm image-use rights before public deployment.'
}
finally {
  Pop-Location
}
