import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { lgpdService } from '@/services/lgpd.service'
import { success, error } from '@/lib/response'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const consents = await lgpdService.getUserConsents(session.user.id)
    return success({ consents })
  } catch (err) {
    console.error('Error fetching consents:', err)
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
    const { consentType, consentGiven } = body

    if (!consentType) {
      return error({ status: 400, message: 'Consent type is required' })
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    const consent = await lgpdService.recordConsent(
      session.user.id,
      consentType,
      consentGiven,
      ipAddress,
      userAgent
    )

    return success(consent, { message: 'Consent recorded successfully' })
  } catch (err) {
    console.error('Error recording consent:', err)
    return error(err)
  }
}
