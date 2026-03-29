import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { referralService } from '@/services/referral.service'
import { success, error, paginated } from '@/lib/response'
import { ReferralStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || undefined

    const result = await referralService.findAll({
      page,
      limit,
      status: status as ReferralStatus | undefined,
    })

    return paginated(
      result.referrals,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      },
      request.nextUrl.origin,
      '/referrals',
      { status: status || '' }
    )
  } catch (err) {
    console.error('Error fetching referrals:', err)
    return error(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const body = await request.json()
    const { patientId, teacherId, reason, observations } = body

    if (!patientId || !teacherId || !reason) {
      return error({ status: 400, message: 'Patient, teacher and reason are required' })
    }

    const referral = await referralService.create({
      patientId,
      teacherId,
      reason,
      observations,
    })

    return success(referral, { message: 'Referral created successfully', status: 201 })
  } catch (err) {
    console.error('Error creating referral:', err)
    return error(err)
  }
}
