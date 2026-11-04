# Repair Section 9 reference art in LOCAL development only.
# Vendor WebP files are Git-ignored and must not be published with the project.
# Run from start.ps1; downloading occurs only when an asset is absent/invalid.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$folder = Join-Path $root 'assets\reference-dev\section9'
New-Item -ItemType Directory -Force -Path $folder | Out-Null

function Test-Section9WebP([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
    $stream = [System.IO.File]::OpenRead($Path)
    try {
        if ($stream.Length -le 64) { return $false }
        $header = New-Object byte[] 12
        [void]$stream.Read($header, 0, 12)
        $riff = [Text.Encoding]::ASCII.GetString($header, 0, 4)
        $webp = [Text.Encoding]::ASCII.GetString($header, 8, 4)
        return $riff -eq 'RIFF' -and $webp -eq 'WEBP'
    }
    finally { $stream.Dispose() }
}

$artwork = @(
    @{
        Name = 'paper.webp'
        Url  = 'https://undangankahwin.com/images/concierge/packs/tasik-kayangan/paper.webp'
    },
    @{
        Name = 'bfly_1.webp'
        Url  = 'https://undangankahwin.com/images/concierge/packs/serambi-ungu/bfly_1.webp'
    }
)

$missing = @()
foreach ($asset in $artwork) {
    $target = Join-Path $folder $asset.Name
    if (Test-Section9WebP $target) {
        Write-Host "Section 9 artwork OK: $($asset.Name)" -ForegroundColor Green
        continue
    }

    Write-Host "Repairing local Section 9 artwork: $($asset.Name)" -ForegroundColor Yellow
    $temp = Join-Path $folder ($asset.Name + '.' + $PID + '.tmp')
    try {
        Invoke-WebRequest -Uri $asset.Url -OutFile $temp -TimeoutSec 30 -ErrorAction Stop -Headers @{ 'User-Agent' = 'Mozilla/5.0' }
        if (-not (Test-Section9WebP $temp)) {
            throw "Downloaded file is not valid WebP: $($asset.Name)"
        }
        Move-Item -LiteralPath $temp -Destination $target -Force
        Write-Host "Section 9 artwork recovered: $($asset.Name)" -ForegroundColor Green
    }
    catch {
        Write-Warning "Could not recover $($asset.Name): $($_.Exception.Message)"
    }
    finally {
        if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force }
    }
    if (-not (Test-Section9WebP $target)) { $missing += $asset.Name }
}

if ($missing.Count -gt 0) {
    Write-Warning ('Section 9 original artwork still missing: ' + ($missing -join ', ') + '. The invitation will show independent CSS placeholder artwork until these local research files are available.')
}
