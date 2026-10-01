#Requires -Version 5.1
<#
    Runs a reach script against this repository. Written here by /reach:adopt; commit it.

      pwsh Scripts/reach.ps1 gate            the blocking gate      0 clean, 1 blocking, 2 refused
      pwsh Scripts/reach.ps1 all             gate + every tier      0 pass, 1 fail, 3 something skipped
      pwsh Scripts/reach.ps1 lane <verb>     seed | sync | status | remove
      pwsh Scripts/reach.ps1 land -Lane ...  land a lane onto the integration branch, then publish
      pwsh Scripts/reach.ps1 publish         push the refs that carry the process, after one failed
      pwsh Scripts/reach.ps1 run <lane>      run a lane unattended
      pwsh Scripts/reach.ps1 audit           what this repo is missing, against the installed version
      pwsh Scripts/reach.ps1 prove           the plugin's own negative controls, gate and lanes

    Anything after the verb is passed straight through:

      pwsh Scripts/reach.ps1 gate -List
      pwsh Scripts/reach.ps1 gate -Check DocumentCaps
      pwsh Scripts/reach.ps1 all -Tier A

    This file has NO param() block on purpose. A param() block rejects any named argument it does not
    declare, so `-List` would fail here rather than reaching the script it is meant for. $args takes
    everything, and only the verb is read.

    The plugin's scripts live inside its install directory, and that path carries the plugin's
    version -- so it moves on every update and nothing may hard-code it. Three ways it is found, in
    order: $env:REACH_ROOT if you set one (a checkout of the plugin repository works, which is how you
    run a change before publishing it), then $env:CLAUDE_PLUGIN_ROOT which Claude Code sets for its own
    hooks and commands, then the installed_plugins.json manifest, newest installed version.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$verbs = @{
    'gate'  = 'Verify-Gate.ps1'
    'all'   = 'Verify-All.ps1'
    'lane'  = 'Lane.ps1'
    'land'  = 'Land.ps1'
    'publish' = 'Publish.ps1'
    'run'   = 'Run-Lane.ps1'
    'audit' = 'Audit.ps1'
    'prove' = 'Prove-Gate.ps1'
}

$what = if ($args.Count -gt 0) { [string]$args[0] } else { '' }
if (-not $verbs.Contains($what)) {
    Write-Host ("REFUSED: say which -- {0}." -f (($verbs.Keys | Sort-Object) -join ', ')) -ForegroundColor Red
    exit 2
}

$rest = @()
if ($args.Count -gt 1) { $rest = $args[1..($args.Count - 1)] }

function Get-ReachRoot {
    foreach ($name in @('REACH_ROOT', 'CLAUDE_PLUGIN_ROOT')) {
        $value = [Environment]::GetEnvironmentVariable($name)
        if ($value -and (Test-Path -LiteralPath (Join-Path $value 'scripts/Verify-Gate.ps1'))) {
            return $value
        }
    }

    $manifest = Join-Path $HOME '.claude/plugins/installed_plugins.json'
    if (-not (Test-Path -LiteralPath $manifest)) { return $null }

    $json = [System.IO.File]::ReadAllText($manifest, (New-Object System.Text.UTF8Encoding($false))) | ConvertFrom-Json
    if (-not $json.PSObject.Properties.Match('plugins').Count) { return $null }

    foreach ($property in $json.plugins.PSObject.Properties) {
        if ($property.Name -notlike 'reach@*') { continue }

        # A plugin can be installed at more than one scope. Newest version wins, and a scope whose
        # files are gone is skipped rather than chosen and then failing to launch.
        $candidates = @($property.Value) | Where-Object {
            $_.PSObject.Properties.Match('installPath').Count -and
            (Test-Path -LiteralPath (Join-Path $_.installPath 'scripts/Verify-Gate.ps1'))
        }
        if (-not $candidates) { continue }

        $best = $candidates | Sort-Object -Property @{ Expression = {
            $parsed = $null
            if ($_.PSObject.Properties.Match('version').Count -and [version]::TryParse([string]$_.version, [ref]$parsed)) { $parsed }
            else { [version]'0.0.0' }
        }} -Descending | Select-Object -First 1

        return $best.installPath
    }
    return $null
}

$root = Get-ReachRoot
if (-not $root) {
    Write-Host "REFUSED: reach is not installed, and neither REACH_ROOT nor CLAUDE_PLUGIN_ROOT points at a copy." -ForegroundColor Red
    Write-Host "  claude plugin marketplace add SpoiledInk13/Reach" -ForegroundColor DarkGray
    Write-Host "  claude plugin install reach@reach" -ForegroundColor DarkGray
    exit 2
}

$target = Join-Path $root ('scripts/' + $verbs[$what])

# -Root is named explicitly and never folded into the splat. Array splatting binds the tail
# correctly but takes the leading "-Root" as a positional VALUE, so the gate would run against a
# repository called "-Root" -- which reports refused, not wrong, but from the wrong cause.
if ($what -eq 'prove') {
    # Both suites, and the worse exit code wins. Running only the gate's controls and calling the
    # result "proven" would leave the landing guards -- the most dangerous code here -- unchecked.
    & $target @rest
    $gateCode = $LASTEXITCODE
    & (Join-Path $root 'scripts/Prove-Lanes.ps1') @rest
    $laneCode = $LASTEXITCODE
    exit ([Math]::Max($gateCode, $laneCode))
}

& $target -Root (Split-Path -Parent $PSScriptRoot) @rest
exit $LASTEXITCODE
