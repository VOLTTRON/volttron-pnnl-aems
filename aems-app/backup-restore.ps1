# backup-restore.ps1 - Windows wrapper around backup-restore.sh.
#
# Invokes the cross-platform bash implementation via Git Bash (bash.exe on
# PATH). All arguments are passed through. Omit -Archive / -Identity to use
# the bash script's interactive discovery menus.
#
# Usage:
#   .\backup-restore.ps1                         # fully interactive
#   .\backup-restore.ps1 -Archive <path-or-s3-url> [-Identity <file>]
#                        [-GpgKeyFile <file>] [-Components <csv>]
#                        [-Only <csv>] [-Force] [-DryRun]

[CmdletBinding()]
param(
    [string]$Archive,
    [string]$Identity,
    [string]$GpgKeyFile,
    [string]$Components,
    [string]$Only,
    [switch]$Force,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptDir
try {
    # Prefer Git Bash over the Windows WSL stub (C:\Windows\System32\bash.exe),
    # which fails with "execvpe(/bin/bash): No such file or directory" when no
    # WSL distro is installed.
    $bashPath = $null
    $candidates = @(
        "$env:ProgramFiles\Git\bin\bash.exe",
        "$env:ProgramFiles\Git\usr\bin\bash.exe",
        "${env:ProgramFiles(x86)}\Git\bin\bash.exe",
        "$env:LOCALAPPDATA\Programs\Git\bin\bash.exe"
    )
    foreach ($c in $candidates) {
        if ($c -and (Test-Path $c)) { $bashPath = $c; break }
    }
    if (-not $bashPath) {
        # Fall back to PATH, but skip the System32 WSL stub.
        $found = Get-Command bash -All -ErrorAction SilentlyContinue |
                 Where-Object { $_.Source -notmatch '\\System32\\bash\.exe$' } |
                 Select-Object -First 1
        if ($found) { $bashPath = $found.Source }
    }
    if (-not $bashPath) {
        Write-Host "Git Bash not found." -ForegroundColor Red
        Write-Host "Install Git for Windows from https://git-scm.com/download/win" -ForegroundColor Yellow
        Write-Host "(the WSL stub at C:\Windows\System32\bash.exe cannot run this script)." -ForegroundColor Yellow
        exit 1
    }

    $bashArgs = @('./backup-restore.sh')
    if ($Archive)    { $bashArgs += @('--archive', $Archive) }
    if ($Identity)   { $bashArgs += @('--identity', $Identity) }
    if ($GpgKeyFile) { $bashArgs += @('--gpg-key-file', $GpgKeyFile) }
    if ($Components) { $bashArgs += @('--components', $Components) }
    if ($Only)       { $bashArgs += @('--only', $Only) }
    if ($Force)      { $bashArgs += '--force' }
    if ($DryRun)     { $bashArgs += '--dry-run' }

    & $bashPath @bashArgs
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
