# Section 6 Dress Code: safe worktree-only artwork check.
# Read-only. This script never merges, resets, checks out branches or changes files.
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "Section 6 local artwork verification" -ForegroundColor Cyan
Write-Host "Root: $root"

$unmerged = @(git ls-files -u)
if ($LASTEXITCODE -ne 0) { throw "Not a valid Git working tree." }
if ($unmerged.Count -gt 0) {
  throw "This folder has unresolved Git conflicts. Open a separate Section 6 worktree; no files changed."
}

$expected = @(
  @{ File = 'assets/section6/paper.webp'; Sha256 = '1a6beba7a3ded69a651d4efcb9e69a706d58a1e4f9cffacaa26c39313b757006'; Bytes = 74096 },
  @{ File = 'assets/section6/bfly_1.webp'; Sha256 = '685b727e858b04507a2aeb658a30e0bde98cde976dc37b8be0f771bbbb77add4'; Bytes = 21458 }
)

foreach ($item in $expected) {
  $path = Join-Path $root $item.File
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    throw "Missing `"$($item.File)`". The Section 6 branch is not yet checked out in this folder."
  }
  $file = Get-Item -LiteralPath $path
  $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($file.Length -ne $item.Bytes -or $hash -ne $item.Sha256) {
    throw "Asset mismatch: $($item.File). Expected $($item.Bytes) bytes and sha256 $($item.Sha256); actual $($file.Length) bytes and sha256 $hash"
  }
  Write-Host "PASS  $($item.File)  ($($file.Length) bytes, SHA256 verified)" -ForegroundColor Green
}

$js = Get-Content -LiteralPath (Join-Path $root 'dress-code.js') -Raw
$css = Get-Content -LiteralPath (Join-Path $root 'dress-code.css') -Raw
if (-not $js.Contains("./assets/section6/paper.webp")) { throw "dress-code.js is not using the local paper WebP." }
if (-not $css.Contains("./assets/section6/bfly_1.webp")) { throw "dress-code.css is not using the local butterfly WebP." }
if ($js.Contains('https://undangankahwin.com/images')) { throw "Unexpected hotlink remains in Dress Code JS." }

Write-Host "PASS  Section 6 loads both local WebP paths (no runtime hotlinks)" -ForegroundColor Green
Write-Host "PASS  Git worktree has no unresolved merge conflicts" -ForegroundColor Green
Write-Host ""
Write-Host "Section 6 assets verified. To preview, run:" -ForegroundColor Cyan
Write-Host "  cd `"$root`""
Write-Host "  python -m http.server 8001"
Write-Host "  Then open http://localhost:8001, open the invitation, and scroll to Dress Code."
