param(
  [switch]$SkipBrowserInstall,
  [switch]$IncludeMotionAudit
)

# Run Section 10's four-phone browser tests locally without GitHub Actions.
# Use an independent Section 10 worktree, not a checkout with merge conflicts.
$ErrorActionPreference = 'Stop'
$server = $null
Push-Location $PSScriptRoot
try {
  if (-not (Test-Path -LiteralPath '.\section-ten.js')) {
    throw 'Run this script from a testing-4 checkout that contains Section 10.'
  }
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is required.'
  }
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm is required.'
  }
  if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw 'npx is required.'
  }

  $pythonExe = $null
  $pythonArgs = @()
  if (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonExe = 'py'
    $pythonArgs = @('-B', 'tools/dev-server.py')
  } elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonExe = 'python'
    $pythonArgs = @('-B', 'tools/dev-server.py')
  } else {
    throw 'Python is required to run the local preview server.'
  }

  # Running against another worker's server gives false results.
  # Refuse to reuse occupied port 8000, rather than testing wrong code.
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8000/' -TimeoutSec 2 -ErrorAction Stop
    throw 'Port 8000 already has a server. Stop that server before testing this worktree.'
  } catch {
    if ($_.Exception.Message -like 'Port 8000 already*') { throw }
  }

  # Existing uploaded WebP source is staged only in the ignored local folder.
  if (-not (Test-Path -LiteralPath '.\assets\reference-dev\scene.webp')) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File '.\stage-section10-art.ps1'
    if ($LASTEXITCODE -ne 0) { throw 'Could not stage the local Section 10 reference scene.' }
  }

  if (-not (Test-Path -LiteralPath '.\node_modules\@playwright\test')) {
    Write-Host 'Installing project development dependencies...' -ForegroundColor Cyan
    & npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
  }
  if (-not $SkipBrowserInstall) {
    & npx playwright install chromium
    if ($LASTEXITCODE -ne 0) { throw 'Playwright Chromium installation failed.' }
  }

  # The project's general Playwright configuration expects localhost:8000.
  # Starting our own process guarantees tests read this worktree.
  $server = Start-Process -FilePath $pythonExe -ArgumentList $pythonArgs -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Hidden
  $ready = $false
  for ($i=0; $i -lt 35; $i++) {
    if ($server.HasExited) { throw 'Local Python server exited unexpectedly.' }
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8000/' -TimeoutSec 2 -ErrorAction Stop
      if ($response.StatusCode -eq 200) { $ready=$true; break }
    } catch {}
    Start-Sleep -Milliseconds 250
  }
  if (-not $ready) { throw 'Local Section 10 preview did not start at port 8000.' }

  Write-Host 'Running Section 10 checks at 320, 360, 390 and 430px...' -ForegroundColor Green
  & npx playwright test tests/section-ten.spec.mjs --workers=2
  if ($LASTEXITCODE -ne 0) { throw 'One or more Section 10 browser tests failed.' }
  Write-Host 'Section 10 browser tests passed on this local checkout.' -ForegroundColor Green
  if ($IncludeMotionAudit) {
    # The motion script owns its own Python server; release our port first.
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    $server = $null
    Write-Host 'Recording local vs live reference motion at 39 checkpoints...' -ForegroundColor Cyan
    & node tools/section10-motion-reference.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Section 10 source/local motion audit failed.' }
    Write-Host 'Motion evidence is in .\section10-motion-evidence\motion.json.' -ForegroundColor Green
  }
} finally {
  if ($null -ne $server) {
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  }
  Pop-Location
}
