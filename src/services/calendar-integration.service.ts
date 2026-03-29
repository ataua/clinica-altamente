import { prisma } from '@/lib/prisma'

export type CalendarProvider = 'google' | 'outlook'

export interface CalendarTokens {
  provider: CalendarProvider
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
}

export class CalendarIntegrationService {
  async saveTokens(userId: string, provider: CalendarProvider, tokens: CalendarTokens) {
    const existing = await prisma.userCalendarIntegration.findFirst({
      where: { userId, provider },
    })

    if (existing) {
      return prisma.userCalendarIntegration.update({
        where: { id: existing.id },
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        },
      })
    }

    return prisma.userCalendarIntegration.create({
      data: {
        userId,
        provider,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
    })
  }

  async getTokens(userId: string, provider: CalendarProvider) {
    return prisma.userCalendarIntegration.findFirst({
      where: { userId, provider },
    })
  }

  async disconnect(userId: string, provider: CalendarProvider) {
    return prisma.userCalendarIntegration.deleteMany({
      where: { userId, provider },
    })
  }

  async isConnected(userId: string, provider: CalendarProvider): Promise<boolean> {
    const integration = await this.getTokens(userId, provider)
    return !!integration
  }

  async syncAppointmentToGoogle(appointment: {
    id: string
    patientName: string
    professionalName: string
    scheduledDateTime: Date
    endDateTime: Date
    notes?: string | null
  }, userId: string): Promise<{ externalEventId?: string; error?: string }> {
    const integration = await this.getTokens(userId, 'google')
    if (!integration) {
      return { error: 'Google Calendar not connected' }
    }

    try {
      const event = {
        summary: `Consulta - ${appointment.patientName}`,
        description: `Profissional: ${appointment.professionalName}\n${appointment.notes || ''}`,
        start: {
          dateTime: appointment.scheduledDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: appointment.endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
      }

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return { error: error.error?.message || 'Failed to create Google Calendar event' }
      }

      const result = await response.json()
      return { externalEventId: result.id }
    } catch (error) {
      return { error: 'Failed to sync to Google Calendar' }
    }
  }

  async syncAppointmentToOutlook(appointment: {
    id: string
    patientName: string
    professionalName: string
    scheduledDateTime: Date
    endDateTime: Date
    notes?: string | null
  }, userId: string): Promise<{ externalEventId?: string; error?: string }> {
    const integration = await this.getTokens(userId, 'outlook')
    if (!integration) {
      return { error: 'Outlook Calendar not connected' }
    }

    try {
      const event = {
        subject: `Consulta - ${appointment.patientName}`,
        body: {
          contentType: 'HTML',
          content: `<p>Profissional: ${appointment.professionalName}</p><p>${appointment.notes || ''}</p>`,
        },
        start: {
          dateTime: appointment.scheduledDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: appointment.endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
      }

      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return { error: error.error?.message || 'Failed to create Outlook event' }
      }

      const result = await response.json()
      return { externalEventId: result.id }
    } catch (error) {
      return { error: 'Failed to sync to Outlook Calendar' }
    }
  }
}

export const calendarIntegrationService = new CalendarIntegrationService()
