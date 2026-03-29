import type { NextRequest } from 'next/server'
import { BaseController } from './base.controller'
import { appointmentService } from '@/services/appointment.service'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/response'

export class CalendarController extends BaseController {
  async getMyAppointments(request: NextRequest) {
    try {
      const user = await this.requireAuth()

      const searchParams = request.nextUrl.searchParams
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      const status = searchParams.get('status') || undefined

      if (!startDate || !endDate) {
        return error({ status: 400, message: 'startDate and endDate are required' })
      }

      let professionalId: string | undefined
      let patientId: string | undefined

      if (user.role === 'PROFESSIONAL' && user.id) {
        const professional = await appointmentService.getProfessionalByUserId(user.id)
        if (!professional) {
          return success([])
        }
        professionalId = professional.id
      }

      if ((user.role === 'PATIENT' || user.role === 'RESPONSIBLE') && user.id) {
        const patient = await prisma.patient.findFirst({
          where: { userId: user.id },
          select: { id: true },
        })
        if (!patient) {
          return success([])
        }
        patientId = patient.id
      }

      const appointments = await appointmentService.findByDateRange({
        startDate,
        endDate,
        professionalId,
        patientId,
        status,
      })

      return success(appointments)
    } catch (err) {
      console.error('CalendarController.getMyAppointments error:', err)
      return error(err)
    }
  }
}

export const calendarController = new CalendarController()
