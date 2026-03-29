import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const BACKUP_DIR = process.env.BACKUP_DIR || './backups'
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '7')

export class BackupService {
  async createBackup(): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
      if (!existsSync(BACKUP_DIR)) {
        mkdirSync(BACKUP_DIR, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `backup-${timestamp}.sql`
      const filepath = join(BACKUP_DIR, filename)

      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        return { success: false, error: 'DATABASE_URL not configured' }
      }

      const pgUrl = new URL(databaseUrl)
      const dbName = pgUrl.pathname.replace('/', '')
      const pgUser = pgUrl.username
      const pgPassword = pgUrl.password
      const pgHost = pgUrl.hostname
      const pgPort = pgUrl.port || '5432'

      const command = `PGPASSWORD="${pgPassword}" pg_dump -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${dbName} -f "${filepath}"`

      execSync(command, {
        env: { ...process.env, PGPASSWORD: pgPassword },
      })

      await this.cleanOldBackups()

      return { success: true, filename }
    } catch (error) {
      console.error('Backup failed:', error)
      return { success: false, error: String(error) }
    }
  }

  async listBackups(): Promise<Array<{ filename: string; size: number; createdAt: Date }>> {
    try {
      if (!existsSync(BACKUP_DIR)) {
        return []
      }

      const files = readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.sql'))
        .map(f => {
          const filepath = join(BACKUP_DIR, f)
          const stats = statSync(filepath)
          return {
            filename: f,
            size: stats.size,
            createdAt: stats.birthtime,
          }
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      return files
    } catch (error) {
      console.error('Error listing backups:', error)
      return []
    }
  }

  async restoreBackup(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      const filepath = join(BACKUP_DIR, filename)
      
      if (!existsSync(filepath)) {
        return { success: false, error: 'Backup file not found' }
      }

      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        return { success: false, error: 'DATABASE_URL not configured' }
      }

      const pgUrl = new URL(databaseUrl)
      const dbName = pgUrl.pathname.replace('/', '')
      const pgUser = pgUrl.username
      const pgPassword = pgUrl.password
      const pgHost = pgUrl.hostname
      const pgPort = pgUrl.port || '5432'

      const dropCommand = `PGPASSWORD="${pgPassword}" psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${dbName} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`
      const restoreCommand = `PGPASSWORD="${pgPassword}" psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${dbName} -f "${filepath}"`

      execSync(dropCommand, {
        env: { ...process.env, PGPASSWORD: pgPassword },
      })

      execSync(restoreCommand, {
        env: { ...process.env, PGPASSWORD: pgPassword },
      })

      return { success: true }
    } catch (error) {
      console.error('Restore failed:', error)
      return { success: false, error: String(error) }
    }
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups()
      
      if (backups.length > MAX_BACKUPS) {
        const toDelete = backups.slice(MAX_BACKUPS)
        for (const backup of toDelete) {
          const filepath = join(BACKUP_DIR, backup.filename)
          if (existsSync(filepath)) {
            unlinkSync(filepath)
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error)
    }
  }
}

export const backupService = new BackupService()
