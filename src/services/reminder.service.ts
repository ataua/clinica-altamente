import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { 
  getAppointmentReminderTemplate, 
  getAppointmentConfirmationTemplate,
  getAppointmentCancellationTemplate 
} from '@/lib/email-templates'

export interface ReminderResult {
  success: boolean
  appointmentId: string
  patientEmail?: string
  error?: string
}

export class ReminderService {
  async sendReminder(appointmentId: string): Promise<ReminderResult> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          professional: {
            include: {
              user: true,
            },
          },
        },
      })

      if (!appointment) {
        return { success: false, appointmentId, error: 'Appointment not found' }
      }

      const patientEmail = appointment.patient.user.email
      if (!patientEmail) {
        return { success: false, appointmentId, error: 'Patient has no email' }
      }

      const appointmentDate = new Date(appointment.scheduledDateTime).toLocaleDateString('pt-BR')
      const appointmentTime = new Date(appointment.scheduledDateTime).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })

      const templateData = {
        patientName: appointment.patient.user.name || 'Paciente',
        appointmentDate,
        appointmentTime,
        professionalName: appointment.professional.user.name || 'Profissional',
        clinicPhone: process.env.CLINIC_PHONE,
      }

      const html = getAppointmentReminderTemplate(templateData)
      const success = await sendEmail({
        to: patientEmail,
        subject: `Lembrete: Consulta em ${appointmentDate} às ${appointmentTime}`,
        html,
      })

      if (success) {
        await this.logReminder(appointmentId, 'REMINDER_SENT')
      }

      return { success, appointmentId, patientEmail }
    } catch (error) {
      console.error('Error sending reminder:', error)
      return { 
        success: false, 
        appointmentId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async sendConfirmation(appointmentId: string): Promise<ReminderResult> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          professional: {
            include: {
              user: true,
            },
          },
        },
      })

      if (!appointment) {
        return { success: false, appointmentId, error: 'Appointment not found' }
      }

      const patientEmail = appointment.patient.user.email
      if (!patientEmail) {
        return { success: false, appointmentId, error: 'Patient has no email' }
      }

      const appointmentDate = new Date(appointment.scheduledDateTime).toLocaleDateString('pt-BR')
      const appointmentTime = new Date(appointment.scheduledDateTime).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })

      const html = getAppointmentConfirmationTemplate({
        patientName: appointment.patient.user.name || 'Paciente',
        appointmentDate,
        appointmentTime,
        professionalName: appointment.professional.user.name || 'Profissional',
        clinicPhone: process.env.CLINIC_PHONE,
      })

      const success = await sendEmail({
        to: patientEmail,
        subject: `Consulta Confirmada: ${appointmentDate} às ${appointmentTime}`,
        html,
      })

      if (success) {
        await this.logReminder(appointmentId, 'CONFIRMATION_SENT')
      }

      return { success, appointmentId, patientEmail }
    } catch (error) {
      return { 
        success: false, 
        appointmentId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async sendCancellation(
    appointmentId: string, 
    reason?: string
  ): Promise<ReminderResult> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          professional: {
            include: {
              user: true,
            },
          },
        },
      })

      if (!appointment) {
        return { success: false, appointmentId, error: 'Appointment not found' }
      }

      const patientEmail = appointment.patient.user.email
      if (!patientEmail) {
        return { success: false, appointmentId, error: 'Patient has no email' }
      }

      const appointmentDate = new Date(appointment.scheduledDateTime).toLocaleDateString('pt-BR')
      const appointmentTime = new Date(appointment.scheduledDateTime).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })

      const html = getAppointmentCancellationTemplate({
        patientName: appointment.patient.user.name || 'Paciente',
        appointmentDate,
        appointmentTime,
        professionalName: appointment.professional.user.name || 'Profissional',
        clinicPhone: process.env.CLINIC_PHONE,
        reason,
      })

      const success = await sendEmail({
        to: patientEmail,
        subject: `Consulta Cancelada: ${appointmentDate}`,
        html,
      })

      if (success) {
        await this.logReminder(appointmentId, 'CANCELLATION_SENT')
      }

      return { success, appointmentId, patientEmail }
    } catch (error) {
      return { 
        success: false, 
        appointmentId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async sendBatchReminders(): Promise<{ sent: number; failed: number }> {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date()
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
    dayAfterTomorrow.setHours(0, 0, 0, 0)

    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledDateTime: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    })

    let sent = 0
    let failed = 0

    for (const appointment of appointments) {
      const result = await this.sendReminder(appointment.id)
      if (result.success) {
        sent++
      } else {
        failed++
      }
    }

    return { sent, failed }
  }

  private async logReminder(
    appointmentId: string, 
    type: 'REMINDER_SENT' | 'CONFIRMATION_SENT' | 'CANCELLATION_SENT'
  ): Promise<void> {
    console.log(`[ReminderService] ${type} for appointment ${appointmentId}`)
  }
}

export const reminderService = new ReminderService()
