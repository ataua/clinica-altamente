import { dashboardService } from '@/services/dashboard.service'
import { success, error } from '@/lib/response'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return error(new Error('Unauthorized'))
    }

    const stats = await dashboardService.getStats()

    return success(stats)
  } catch (err) {
    return error(err)
  }
}
