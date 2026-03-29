import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { lgpdService } from '@/services/lgpd.service'
import { success, error } from '@/lib/response'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const userId = session.user.id

    await lgpdService.anonymizeUser(userId)

    const { signOut } = await import('@/lib/auth')
    await signOut({ redirect: true, redirectTo: '/' })

    return success({ message: 'Account anonymized successfully' })
  } catch (err) {
    console.error('Error anonymizing user:', err)
    return error(err)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const userRole = session.user.role
    if (userRole !== 'ADMIN') {
      return error({ status: 403, message: 'Access denied' })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return error({ status: 400, message: 'User ID is required' })
    }

    await lgpdService.anonymizeUser(userId)

    return success({ message: 'User anonymized successfully' })
  } catch (err) {
    console.error('Error anonymizing user:', err)
    return error(err)
  }
}
