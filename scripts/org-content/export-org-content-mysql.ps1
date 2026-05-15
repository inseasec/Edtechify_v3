# mysqldump organization-related tables from SOURCE database.

param(
    [string]$SourceDb = "fundamental_db2",
    [string]$MySqlHost = "localhost",
    [string]$User = "root",
    [string]$Password = "root",
    [string]$MySqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin",
    [string]$OutFile = "F:\Drive\EdtekifyProjects\FundamentalProject\edukify\scripts\org-content\exported\org-content-mysql.sql"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $OutFile) {
    $OutFile = Join-Path $scriptDir "exported\org-content-mysql.sql"
}

$mysqldump = if ($MySqlBin) { Join-Path $MySqlBin "mysqldump.exe" } else { "mysqldump" }
if ($MySqlBin -and -not (Test-Path $mysqldump)) {
    Write-Error "mysqldump not found: $mysqldump"
}

$tables = @(
    "organization_detail",
    "organization_addresses",
    "org_about_us",
    "about_image_template",
    "org_director_detail",
    "org_director_detail_owner_images",
    "org_parent_company",
    "org_achievement",
    "achievement_images",
    "org_gallery",
    "gallery_images",
    "org_team_gallery",
    "team_gallery_images",
    "home_page",
    "home_image",
    "home_video"
)

$outDir = Split-Path -Parent $OutFile
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

# Write directly to file; avoids pipeline issues with native stderr (password warning).
$mysqlArgs = @(
    "-h", $MySqlHost, "-u", $User, "-p$Password",
    "--no-create-info", "--complete-insert", "--hex-blob",
    "--result-file=$OutFile",
    $SourceDb
) + $tables

Write-Host "Dumping from $SourceDb -> $OutFile"

$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
    & $mysqldump @mysqlArgs 2>&1 | ForEach-Object {
        if ($_ -is [System.Management.Automation.ErrorRecord]) {
            Write-Warning $_.ToString()
        } elseif ($_ -and "$_".Trim()) {
            Write-Host $_
        }
    }
    $exitCode = $LASTEXITCODE
}
finally {
    $ErrorActionPreference = $prevEap
}

if ($exitCode -ne 0) {
    Write-Error "mysqldump failed (exit $exitCode). Check -MySqlBin, credentials, and table names in $SourceDb."
}
if (-not (Test-Path $OutFile) -or (Get-Item $OutFile).Length -lt 10) {
    Write-Error "Dump file missing or empty: $OutFile"
}

Write-Host "Saved: $OutFile ($((Get-Item $OutFile).Length) bytes)"
