import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { calendarIntegrationService, type CalendarProvider } from '@/services/calendar-integration.service'
import { success, error } from '@/lib/response'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const [googleConnected, outlookConnected] = await Promise.all([
      calendarIntegrationService.isConnected(session.user.id, 'google'),
      calendarIntegrationService.isConnected(session.user.id, 'outlook'),
    ])

    return success({
      integrations: {
        google: googleConnected,
        outlook: outlookConnected,
      },
    })
  } catch (err) {
    console.error('Error fetching calendar integrations:', err)
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
    const { provider, accessToken, refreshToken, expiresAt } = body

    if (!provider || !accessToken) {
      return error({ status: 400, message: 'Provider and access token are required' })
    }

    if (!['google', 'outlook'].includes(provider)) {
      return error({ status: 400, message: 'Invalid provider' })
    }

    await calendarIntegrationService.saveTokens(session.user.id, provider as CalendarProvider, {
      provider: provider as CalendarProvider,
      accessToken,
      refreshToken,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    })

    return success({ message: `${provider} calendar connected successfully` })
  } catch (err) {
    console.error('Error connecting calendar:', err)
    return error(err)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')

    if (!provider || !['google', 'outlook'].includes(provider)) {
      return error({ status: 400, message: 'Invalid provider' })
    }

    await calendarIntegrationService.disconnect(session.user.id, provider as CalendarProvider)

    return success({ message: `${provider} calendar disconnected successfully` })
  } catch (err) {
    console.error('Error disconnecting calendar:', err)
    return error(err)
  }
}
