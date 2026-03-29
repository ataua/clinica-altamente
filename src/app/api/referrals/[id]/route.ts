import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { referralService } from '@/services/referral.service'
import { success, error, notFound } from '@/lib/response'
import { ReferralStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const { id } = await params
    const referral = await referralService.findById(id)

    if (!referral) {
      return notFound('Referral')
    }

    return success(referral)
  } catch (err) {
    console.error('Error fetching referral:', err)
    return error(err)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const { id } = await params
    const body = await request.json()
    const { status, response } = body

    if (!status) {
      return error({ status: 400, message: 'Status is required' })
    }

    const referral = await referralService.updateStatus(id, status as ReferralStatus, response)

    return success(referral, { message: 'Referral updated successfully' })
  } catch (err) {
    console.error('Error updating referral:', err)
    return error(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const { id } = await params
    await referralService.delete(id)

    return success(null, { message: 'Referral deleted successfully' })
  } catch (err) {
    console.error('Error deleting referral:', err)
    return error(err)
  }
}
