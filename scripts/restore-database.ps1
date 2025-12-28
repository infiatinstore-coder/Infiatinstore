# ================================================================
# DATABASE RESTORE SCRIPT
# Project: infiya.store
# Purpose: Restore PostgreSQL database from backup
# ================================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile
)

# Configuration
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "infiya_store"
$DB_USER = "postgres"
$LOG_FILE = "E:\THOLIB\Projek\infiya-store\backups\restore.log"

# Log function
function Write-Log {
    param($Message)
    $LogMessage = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message"
    Write-Host $LogMessage
    Add-Content -Path $LOG_FILE -Value $LogMessage
}

Write-Log "=== STARTING RESTORE ==="
Write-Log "Backup file: $BackupFile"

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Log "ERROR: Backup file not found: $BackupFile"
    exit 1
}

# Decompress if .gz
$WorkingFile = $BackupFile
if ($BackupFile -match "\.gz$") {
    Write-Log "Decompressing backup..."
    $WorkingFile = $BackupFile -replace "\.gz$", ""
    
    if (Get-Command "7z" -ErrorAction SilentlyContinue) {
        & "7z" x $BackupFile -o"$(Split-Path $BackupFile)" -y | Out-Null
        Write-Log "Decompressed to: $WorkingFile"
    }
    else {
        Write-Log "ERROR: 7-Zip not found, cannot decompress"
        exit 1
    }
}

# Confirm restore
Write-Host ""
Write-Host "WARNING: This will REPLACE all data in database: $DB_NAME" -ForegroundColor Yellow
Write-Host "Backup file: $WorkingFile" -ForegroundColor Yellow
$Confirm = Read-Host "Type 'YES' to continue"

if ($Confirm -ne "YES") {
    Write-Log "Restore cancelled by user"
    exit 0
}

# Drop and recreate database
try {
    Write-Log "Dropping existing database..."
    & "psql" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>&1 | Out-Null
    
    Write-Log "Creating new database..."
    & "psql" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1 | Out-Null
    
    Write-Log "Restoring from backup..."
    & "psql" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $WorkingFile 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "SUCCESS: Database restored successfully"
    }
    else {
        Write-Log "ERROR: Restore failed with exit code $LASTEXITCODE"
        exit 1
    }
    
}
catch {
    Write-Log "ERROR: Restore failed - $($_.Exception.Message)"
    exit 1
}

# Cleanup decompressed file if it was created
if ($WorkingFile -ne $BackupFile -and (Test-Path $WorkingFile)) {
    Remove-Item $WorkingFile
    Write-Log "Cleaned up temporary file"
}

Write-Log "=== RESTORE COMPLETED ==="

exit 0
