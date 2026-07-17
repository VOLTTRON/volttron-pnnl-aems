# Build the AEMS Software Deployment Guide .docx from Markdown source.
# Run from the repository root.

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
Set-Location $RepoRoot

$Src     = 'docs/proposed/aems-deployment-guide/aems-deployment-guide.md'
$Ref     = 'docs/proposed/aems-deployment-guide/pandoc/aems-pnnl-reference.docx'
$Figures = 'docs/proposed/aems-deployment-guide/figures'
$Out     = "AEMS Software Deployment Guide ($(Get-Date -Format 'yyyy-MM-dd')).docx"

if (-not (Get-Command pandoc -ErrorAction SilentlyContinue)) {
    Write-Error @'
pandoc not found on PATH. Install pandoc and re-run.
  Windows:    winget install --id JohnMacFarlane.Pandoc
  Or from:    https://pandoc.org/installing.html
'@
}

$RefArgs = @()
if (Test-Path $Ref) {
    $RefArgs = @('--reference-doc', $Ref)
} else {
    Write-Warning "Reference doc $Ref not found; using pandoc defaults."
    Write-Warning 'The .docx will not match PNNL house style until the reference doc is generated.'
}

pandoc `
  $Src `
  @RefArgs `
  --toc --toc-depth=3 `
  --number-sections `
  --resource-path=$Figures `
  -o $Out

Write-Host "Wrote: $Out"
