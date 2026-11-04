# Reference-only photo retrieval for the Section 8 local comparison.
# Requires permission to download/use the third-party reference photographs.
# Files remain gitignored and are never committed by this script.
param(
  [switch] $IHavePermission
)
$ErrorActionPreference='Stop'
if (-not $IHavePermission) {
  throw 'Artwork rights confirmation required. Re-run with -IHavePermission only if authorized.'
}
Set-Location $PSScriptRoot
$targetFolder=Join-Path $PSScriptRoot 'assets\reference-dev'
New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null

$files=@(
  @{
    Name='gift-rice-cooker.jpg'
    Uri='https://down-my.img.susercontent.com/file/3ec07fce7759a329a17cd0dc411fef2a_tn'
  },
  @{
    Name='gift-kettle.webp'
    Uri='https://img.lazcdn.com/g/p/99683b91c2b2cfcd5ce838a7a7a0d711.jpg_200x200q80.jpg_.webp'
  }
)
function Test-ImageBytes([byte[]]$data){
  if($null -eq $data -or $data.Length -lt 300){return $false}
  $webp=$data.Length -ge 12 -and
     [Text.Encoding]::ASCII.GetString($data,0,4) -eq 'RIFF' -and
     [Text.Encoding]::ASCII.GetString($data,8,4) -eq 'WEBP'
  $jpeg=$data[0] -eq 255 -and $data[1] -eq 216 -and $data[2] -eq 255
  $png=$data[0] -eq 137 -and $data[1] -eq 80 -and $data[2] -eq 78 -and $data[3] -eq 71
  return $webp -or $jpeg -or $png
}
foreach($file in $files){
  $dest=Join-Path $targetFolder $file.Name
  if(Test-Path -LiteralPath $dest){
    $current=[IO.File]::ReadAllBytes($dest)
    if(Test-ImageBytes $current){
      Write-Host ('Already valid: '+$file.Name) -ForegroundColor Green
      continue
    }
  }
  $temp=$dest+'.partial'
  try{
    Invoke-WebRequest -Uri $file.Uri -OutFile $temp -MaximumRedirection 5 -Headers @{
      'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
    $data=[IO.File]::ReadAllBytes($temp)
    if(-not (Test-ImageBytes $data)){
      throw ('Invalid downloaded image: '+$file.Name)
    }
    Move-Item -LiteralPath $temp -Destination $dest -Force
    Write-Host ('Downloaded '+$file.Name+' ('+$data.Length+' bytes)') -ForegroundColor Green
  } finally {
    if(Test-Path -LiteralPath $temp){Remove-Item -LiteralPath $temp -Force}
  }
}
Write-Host 'Section 8 licensed reference thumbnails available for local preview.' -ForegroundColor Cyan
