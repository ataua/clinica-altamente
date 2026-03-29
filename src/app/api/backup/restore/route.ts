import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { backupService } from '@/services/backup.service'
import { success, error } from '@/lib/response'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const userRole = session.user.role
    if (userRole !== 'ADMIN') {
      return error({ status: 403, message: 'Access denied. Admin only.' })
    }

    const body = await request.json()
    const { filename } = body

    if (!filename) {
      return error({ status: 400, message: 'Filename is required' })
    }

    const result = await backupService.restoreBackup(filename)

    if (result.success) {
      return success({ message: 'Database restored successfully' })
    } else {
      return error({ status: 500, message: result.error || 'Restore failed' })
    }
  } catch (err) {
    console.error('Error restoring backup:', err)
    return error(err)
  }
}
