# Import org-content-mysql.sql into TARGET database (run export first).

param(
    [string]$TargetDb = "fundamental_db_temp",
    [string]$MySqlHost = "localhost",
    [string]$User = "root",
    [string]$Password = "root",
    [string]$MySqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin",
    [string]$InFile = "F:\Drive\EdtekifyProjects\FundamentalProject\edukify\scripts\org-content\exported\org-content-mysql.sql",
    [switch]$SkipClear
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $InFile) {
    $InFile = Join-Path $scriptDir "exported\org-content-mysql.sql"
}

if (-not (Test-Path $InFile)) {
    Write-Error "Missing $InFile - run export-org-content-mysql.ps1 -SourceDb fundamental_db2 first."
}

$mysql = if ($MySqlBin) { Join-Path $MySqlBin "mysql.exe" } else { "mysql" }
if ($MySqlBin -and -not (Test-Path $mysql)) {
    Write-Error "mysql not found: $mysql"
}

# Connection args as separate tokens (avoids -h$var parsing issues in functions).
$mysqlConnArgs = @(
    "-h", $MySqlHost,
    "-u", $User,
    "-p$Password",
    "--default-character-set=utf8mb4",
    $TargetDb
)

$tables = @(
    "home_image",
    "home_video",
    "about_image_template",
    "org_director_detail_owner_images",
    "achievement_images",
    "gallery_images",
    "team_gallery_images",
    "organization_addresses",
    "org_about_us",
    "org_director_detail",
    "org_parent_company",
    "org_achievement",
    "org_gallery",
    "org_team_gallery",
    "home_page",
    "organization_detail"
)

function Invoke-MySqlText {
    param(
        [string]$SqlText,
        [string[]]$ExtraArgs = @()
    )
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $allArgs = $mysqlConnArgs + $ExtraArgs
        $SqlText | & $mysql @allArgs 2>&1 | ForEach-Object {
            if ($_ -is [System.Management.Automation.ErrorRecord]) {
                Write-Warning $_.ToString()
            } elseif ($_ -and "$_".Trim()) {
                Write-Host $_
            }
        }
        return $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $prevEap
    }
}

$fileBytes = (Get-Item -LiteralPath $InFile).Length
Write-Host "Target database: $TargetDb on $MySqlHost"
Write-Host "SQL file: $InFile ($fileBytes bytes)"
Write-Host "Tip: start admin backend once on $TargetDb so Hibernate creates tables."

if (-not $SkipClear) {
    Write-Host "Clearing existing organization rows..."
    $truncateLines = foreach ($t in $tables) { "TRUNCATE TABLE ``$t``;" }
    $truncateSql = @(
        "SET FOREIGN_KEY_CHECKS=0;",
        "SET UNIQUE_CHECKS=0;",
        $truncateLines,
        "SET FOREIGN_KEY_CHECKS=1;"
    ) -join "`n"

    $clearExit = Invoke-MySqlText -SqlText $truncateSql
    if ($clearExit -ne 0) {
        Write-Warning "Clear step exited with $clearExit (tables may not exist yet - start backend once, then re-run)."
    }
}

Write-Host "Importing data..."

$dump = Get-Content -LiteralPath $InFile -Raw -Encoding UTF8
$importSql = @(
    "SET NAMES utf8mb4;",
    "SET FOREIGN_KEY_CHECKS=0;",
    "SET UNIQUE_CHECKS=0;",
    $dump,
    "SET FOREIGN_KEY_CHECKS=1;",
    "SET UNIQUE_CHECKS=1;"
) -join "`n"

$importExit = Invoke-MySqlText -SqlText $importSql
if ($importExit -ne 0) {
    Write-Error "mysql import failed (exit $importExit). Check errors above."
}

$checkSql = "SELECT COUNT(*) FROM organization_detail;"
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$checkArgs = $mysqlConnArgs + @("-N")
$checkOut = ($checkSql | & $mysql @checkArgs 2>$null)
$ErrorActionPreference = $prevEap

$rowCount = if ($checkOut) { "$checkOut".Trim() } else { "?" }
if ($rowCount -eq "0") {
    Write-Warning "Import finished but organization_detail is still empty - verify table names match export."
} else {
    Write-Host "Import finished into $TargetDb (organization_detail rows: $rowCount)."
}
