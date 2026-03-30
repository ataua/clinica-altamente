import type { NextRequest } from 'next/server'
import { BaseController } from './base.controller'
import { appointmentService } from '@/services/appointment.service'
import { CreateAppointmentDTO, UpdateAppointmentDTO, AppointmentFilterDTO } from '@/dtos/appointment.dto'
import { success, created, error, notFound, paginated } from '@/lib/response'
import { generateAppointmentLinks } from '@/lib/hateoas'
import { prisma } from '@/lib/prisma'

export class AppointmentController extends BaseController {
  async findAll(request: NextRequest) {
    try {
      const user = await this.requireAuth()

      const searchParams = request.nextUrl.searchParams
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const startDate = searchParams.get('startDate') || undefined
      const endDate = searchParams.get('endDate') || undefined
      const professionalId = searchParams.get('professionalId') || undefined
      const patientId = searchParams.get('patientId') || undefined
      const status = searchParams.get('status') || undefined

      let effectiveProfessionalId = professionalId

      if (user.role === 'PROFESSIONAL' && user.id) {
        const professional = await appointmentService.getProfessionalByUserId(user.id)
        if (professional) {
          effectiveProfessionalId = professional.id
        }
      }

      const filter = AppointmentFilterDTO.parse({
        page,
        limit,
        startDate,
        endDate,
        professionalId: effectiveProfessionalId,
        patientId,
        status,
      })

      const result = await appointmentService.findAll(filter)

      return paginated(
        result.appointments,
        {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
        },
        request.nextUrl.origin,
        '/appointments',
        { status: status || '', professionalId: professionalId || '', patientId: patientId || '' }
      )
    } catch (err) {
      return error(err)
    }
  }

  async findById(params: Promise<{ id: string }>) {
    try {
      await this.requireAuth()
      const { id } = await params

      const result = await appointmentService.findById(id)
      if (!result) return notFound('Appointment')

      return success(result, {
        links: generateAppointmentLinks(
          id,
          result.patientId,
          result.professionalId,
          result.status
        ),
      })
    } catch (err) {
      return error(err)
    }
  }

  async create(request: NextRequest) {
    try {
      await this.requireAuth()

      const body = await request.json()
      const data = CreateAppointmentDTO.parse(body)

      const result = await appointmentService.create(data)

      return created(result, 'Appointment created successfully', {
        self: { href: `/api/appointments/${result.id}` },
        patient: { href: `/api/patients/${result.patientId}` },
        professional: { href: `/api/professionals/${result.professionalId}` },
      })
    } catch (err) {
      return error(err)
    }
  }

  async update(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      await this.requireAuth()
      const { id } = await params

      const body = await request.json()
      const data = UpdateAppointmentDTO.parse(body)

      const result = await appointmentService.update(id, data)

      return success(result, {
        message: 'Appointment updated successfully',
        links: generateAppointmentLinks(
          id,
          result.patientId,
          result.professionalId,
          result.status
        ),
      })
    } catch (err) {
      return error(err)
    }
  }

  async delete(params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, ['ADMIN'])

      const { id } = await params
      await appointmentService.delete(id)

      return success(null, { message: 'Appointment deleted successfully' })
    } catch (err) {
      return error(err)
    }
  }

  async cancel(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      const { id } = await params

      const userRole = user.role

      if (!['ADMIN', 'SECRETARY', 'PROFESSIONAL', 'PATIENT', 'RESPONSIBLE'].includes(userRole)) {
        return error({ status: 403, message: 'Forbidden' })
      }

      if (userRole === 'PATIENT' || userRole === 'RESPONSIBLE') {
        const appointment = await appointmentService.findById(id)
        if (!appointment) {
          return notFound('Appointment')
        }
        const patient = await prisma.patient.findFirst({
          where: { userId: user.id },
          select: { id: true },
        })
        if (!patient || appointment.patientId !== patient.id) {
          return error({ status: 403, message: 'You can only cancel your own appointments' })
        }
      }

      const body = await request.json()
      const { reason } = body

      if (!reason) {
        return error({ status: 400, message: 'Cancellation reason is required' })
      }

      const result = await appointmentService.cancel(id, reason)

      return success(result, {
        message: 'Appointment cancelled',
        links: generateAppointmentLinks(
          id,
          result.patientId,
          result.professionalId,
          result.status
        ),
      })
    } catch (err) {
      return error(err)
    }
  }

  async reschedule(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      await this.requireAuth()
      const { id } = await params

      const body = await request.json()
      const { scheduledDateTime, professionalId } = body

      if (!scheduledDateTime) {
        return error({ status: 400, message: 'New date/time is required' })
      }

      const result = await appointmentService.reschedule(id, scheduledDateTime, professionalId)

      return success(result, {
        message: 'Appointment rescheduled',
        links: generateAppointmentLinks(
          id,
          result.patientId,
          result.professionalId,
          result.status
        ),
      })
    } catch (err) {
      return error(err)
    }
  }

  async getProfessionals(request: NextRequest) {
    try {
      await this.requireAuth()
      const searchParams = request.nextUrl.searchParams
      const specialtyId = searchParams.get('specialtyId') || undefined
      const result = await appointmentService.getProfessionals(specialtyId)
      return success(result)
    } catch (err) {
      return error(err)
    }
  }

  async getSlots(request: NextRequest) {
    try {
      await this.requireAuth()

      const searchParams = request.nextUrl.searchParams
      const professionalId = searchParams.get('professionalId')
      const date = searchParams.get('date')

      if (!professionalId || !date) {
        return error({ status: 400, message: 'Professional ID and date are required' })
      }

      const result = await appointmentService.getAvailableSlots(professionalId, date)
      return success(result)
    } catch (err) {
      return error(err)
    }
  }
}

export const appointmentController = new AppointmentController()
