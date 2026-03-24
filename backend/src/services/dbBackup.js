const cron = require('node-cron');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const BACKUP_DIR = path.join(__dirname, '../../../backups');

function getDbConfig() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error('Could not parse DATABASE_URL');
  return { user: match[1], password: match[2], host: match[3], port: match[4], db: match[5] };
}

async function runBackup() {
  logger.info('[DBBackup] Starting backup...');
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const { user, password, host, port, db } = getDbConfig();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `chapteros-${timestamp}.sql.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    const cmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} ${db} | gzip > ${filepath}`;
    execSync(cmd, { stdio: 'pipe' });

    const stats = fs.statSync(filepath);
    logger.info(`[DBBackup] Backup complete: ${filename} (${(stats.size / 1024).toFixed(1)}KB)`);

    // Keep only last 7 backups
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql.gz'))
      .sort()
      .reverse();
    if (files.length > 7) {
      files.slice(7).forEach(f => {
        fs.unlinkSync(path.join(BACKUP_DIR, f));
        logger.info(`[DBBackup] Pruned old backup: ${f}`);
      });
    }

    return { success: true, filename, size: stats.size };
  } catch (err) {
    logger.error('[DBBackup] Backup failed', { error: err.message });
    return { success: false, error: err.message };
  }
}

function startBackupCron() {
  // Daily at 3 AM ET
  cron.schedule('0 3 * * *', runBackup, { timezone: 'America/New_York' });
  logger.info('[DBBackup] Cron scheduled — daily at 3 AM ET');
}

module.exports = { startBackupCron, runBackup };
