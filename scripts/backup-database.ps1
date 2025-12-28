# ================================================================
# AUTOMATED DATABASE BACKUP SCRIPT
# Project: infiya.store
# Purpose: Daily PostgreSQL backup with retention
# ================================================================

# Configuration
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "infiya_store"
$DB_USER = "postgres"
$BACKUP_DIR = "E:\THOLIB\Projek\infiya-store\backups"
$RETENTION_DAYS = 30
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\infiya_store_$TIMESTAMP.sql"
$LOG_FILE = "$BACKUP_DIR\backup.log"

# Create backup directory if not exists
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# Log function
function Write-Log {
    param($Message)
    $LogMessage = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message"
    Write-Host $LogMessage
    Add-Content -Path $LOG_FILE -Value $LogMessage
}

Write-Log "=== STARTING BACKUP ==="

# Execute pg_dump
try {
    Write-Log "Backing up database: $DB_NAME"
    
    # Use pg_dump to create backup
    & "pg_dump" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -b -v -f $BACKUP_FILE 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        $FileSize = (Get-Item $BACKUP_FILE).Length / 1MB
        Write-Log "SUCCESS: Backup created - $BACKUP_FILE (Size: $([math]::Round($FileSize, 2)) MB)"
        
        # Compress backup
        $CompressedFile = "$BACKUP_FILE.gz"
        Write-Log "Compressing backup..."
        
        # Using 7-Zip if available, otherwise skip compression
        if (Get-Command "7z" -ErrorAction SilentlyContinue) {
            & "7z" a -tgzip $CompressedFile $BACKUP_FILE | Out-Null
            Remove-Item $BACKUP_FILE
            Write-Log "Compressed to: $CompressedFile"
        } else {
            Write-Log "7-Zip not found, skipping compression"
        }
        
    } else {
        Write-Log "ERROR: Backup failed with exit code $LASTEXITCODE"
        exit 1
    }
    
} catch {
    Write-Log "ERROR: Backup failed - $($_.Exception.Message)"
    exit 1
}

# Cleanup old backups (retention policy)
Write-Log "Cleaning up old backups (retention: $RETENTION_DAYS days)"
$CutoffDate = (Get-Date).AddDays(-$RETENTION_DAYS)
Get-ChildItem -Path $BACKUP_DIR -Filter "infiya_store_*.sql*" | 
    Where-Object { $_.LastWriteTime -lt $CutoffDate } | 
    ForEach-Object {
        Write-Log "Deleting old backup: $($_.Name)"
        Remove-Item $_.FullName
    }

Write-Log "=== BACKUP COMPLETED ==="
Write-Log ""

# Return success
exit 0
