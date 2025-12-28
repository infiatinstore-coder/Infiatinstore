# WAL ARCHIVING SETUP - Point-In-Time Recovery

## Overview
Mengaktifkan WAL (Write-Ahead Logging) archiving untuk PostgreSQL agar bisa restore ke timestamp tertentu.

## Prerequisites
- PostgreSQL 14+
- Disk space untuk WAL files (minimal 10GB)

## Step 1: Edit postgresql.conf

Lokasi file (Windows): `C:\Program Files\PostgreSQL\14\data\postgresql.conf`

Tambahkan/ubah konfigurasi berikut:

```conf
# WAL Settings
wal_level = replica                  # Minimal level untuk archiving
archive_mode = on                    # Enable archiving
archive_command = 'copy "%p" "E:\\THOLIB\\Projek\\infiya-store\\wal_archive\\%f"'  # Windows
# archive_command = 'test ! -f /path/to/archive/%f && cp %p /path/to/archive/%f'  # Linux

# WAL Sender/Receiver
max_wal_senders = 10
wal_keep_size = 1GB                  # Keep at least 1GB WAL files
```

## Step 2: Create WAL Archive Directory

```powershell
# Windows
New-Item -ItemType Directory -Path "E:\THOLIB\Projek\infiya-store\wal_archive" -Force
```

```bash
# Linux
mkdir -p /var/lib/postgresql/wal_archive
chown postgres:postgres /var/lib/postgresql/wal_archive
chmod 700 /var/lib/postgresql/wal_archive
```

## Step 3: Restart PostgreSQL

```powershell
# Windows (PowerShell as Admin)
Restart-Service postgresql-x64-14
```

```bash
# Linux
sudo systemctl restart postgresql
```

## Step 4: Verify WAL Archiving

```sql
-- Check archiving status
SELECT name, setting FROM pg_settings WHERE name LIKE 'archive%';

-- Force a WAL switch to test
SELECT pg_switch_wal();

-- Check if WAL files are being archived
```

Cek folder `wal_archive`, seharusnya ada file-file WAL.

## Step 5: Create Base Backup (Required for PITR)

```bash
# Stop application (to ensure consistency)
# Then create base backup

pg_basebackup -h localhost -U postgres -D E:\THOLIB\Projek\infiya-store\basebackup -Fp -Xs -P
```

## Point-In-Time Recovery Procedure

### 1. Stop PostgreSQL
```powershell
Stop-Service postgresql-x64-14
```

### 2. Backup Current Data (Safety)
```powershell
Rename-Item "C:\Program Files\PostgreSQL\14\data" "C:\Program Files\PostgreSQL\14\data_old"
```

### 3. Restore Base Backup
```powershell
Copy-Item -Recurse "E:\THOLIB\Projek\infiya-store\basebackup" "C:\Program Files\PostgreSQL\14\data"
```

### 4. Create recovery.conf
Create file: `C:\Program Files\PostgreSQL\14\data\recovery.signal` (empty file)

Create file: `C:\Program Files\PostgreSQL\14\data\postgresql.auto.conf`:
```conf
restore_command = 'copy "E:\\THOLIB\\Projek\\infiya-store\\wal_archive\\%f" "%p"'
recovery_target_time = '2025-12-23 14:30:00'  # Target restore time
recovery_target_action = 'promote'
```

### 5. Start PostgreSQL
```powershell
Start-Service postgresql-x64-14
```

PostgreSQL will replay WAL logs until target time.

## Automated WAL Cleanup (Optional)

File: `scripts/cleanup-old-wals.ps1`

```powershell
# Delete WAL files older than 7 days
$WAL_DIR = "E:\THOLIB\Projek\infiya-store\wal_archive"
$RETENTION_DAYS = 7
$CutoffDate = (Get-Date).AddDays(-$RETENTION_DAYS)

Get-ChildItem -Path $WAL_DIR | 
    Where-Object { $_.LastWriteTime -lt $CutoffDate } | 
    Remove-Item -Force

Write-Host "Old WAL files cleaned up"
```

## Monitoring

```sql
-- Check archive queue
SELECT COUNT(*) FROM pg_stat_archiver;

-- Check last archived WAL
SELECT archived_count, last_archived_wal, last_archived_time 
FROM pg_stat_archiver;
```

## Important Notes

1. **Disk Space**: WAL files grow quickly. Monitor disk usage.
2. **Base Backup**: Create new base backup weekly (automate with cron/Task Scheduler).
3. **Testing**: Test PITR restore quarterly.
4. **Retention**: Keep WAL files for at least 7 days.

## Status Check

```sql
-- Verify archiving is working
SHOW archive_mode;
SHOW archive_command;

-- Check archiver stats
SELECT * FROM pg_stat_archiver;
```

Expected: `archive_mode = on`, no failed archives.

---

**WARNING**: WAL archiving memerlukan monitoring. Pastikan disk tidak penuh!
