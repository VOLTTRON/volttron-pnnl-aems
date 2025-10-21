param (
    [string]$mode = "set"
)

Get-Content ".env.secrets" | ForEach-Object {
    $name, $value = $_.split('=')
    if ($mode -eq "set" -and ![string]::IsNullOrWhiteSpace($name) -and !$name.Contains('#')) {
        [Environment]::SetEnvironmentVariable($name, $value, [System.EnvironmentVariableTarget]::User)
        Write-Output "Set User Environment Variable: $name"
    }
    elseif ($mode -ne "set" -and !$name.Contains('#')) {
        [Environment]::SetEnvironmentVariable($name, $null, [System.EnvironmentVariableTarget]::User)
        Write-Output "Unset User Environment Variable: $name"
    }
}