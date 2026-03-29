import { auth } from '@/lib/auth'
import { backupService } from '@/services/backup.service'
import { success, error } from '@/lib/response'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const userRole = session.user.role
    if (userRole !== 'ADMIN') {
      return error({ status: 403, message: 'Access denied. Admin only.' })
    }

    const result = await backupService.createBackup()

    if (result.success) {
      return success({ 
        message: 'Backup created successfully',
        filename: result.filename 
      })
    } else {
      return error({ status: 500, message: result.error || 'Backup failed' })
    }
  } catch (err) {
    console.error('Error creating backup:', err)
    return error(err)
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const userRole = session.user.role
    if (userRole !== 'ADMIN') {
      return error({ status: 403, message: 'Access denied. Admin only.' })
    }

    const backups = await backupService.listBackups()

    return success({ backups })
  } catch (err) {
    console.error('Error listing backups:', err)
    return error(err)
  }
}
