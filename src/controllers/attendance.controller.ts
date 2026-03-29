import type { NextRequest } from 'next/server'
import { BaseController, UserRole } from './base.controller'
import { attendanceService } from '@/services/attendance.service'
import { appointmentService } from '@/services/appointment.service'
import { success, created, error, notFound, paginated } from '@/lib/response'
import { generateAttendanceLinks } from '@/lib/hateoas'
import { AttendanceStatus } from '@prisma/client'

const SECRETARY_ROLES: UserRole[] = ['ADMIN', 'SECRETARY', 'COORDINATOR']
const PROFESSIONAL_ROLES: UserRole[] = ['ADMIN', 'PROFESSIONAL']

export class AttendanceController extends BaseController {
  async findAll(request: NextRequest) {
    try {
      await this.requireAuth()

      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const patientId = searchParams.get('patientId') || undefined
      const professionalId = searchParams.get('professionalId') || undefined
      const appointmentId = searchParams.get('appointmentId') || undefined
      const status = searchParams.get('status') as AttendanceStatus | undefined

      const result = await attendanceService.findAll({
        page,
        limit,
        patientId,
        professionalId,
        appointmentId,
        status,
      })

      return paginated(
        result.attendances,
        {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
        },
        request.nextUrl.origin,
        '/attendances',
        { status: status || '', patientId: patientId || '', professionalId: professionalId || '' }
      )
    } catch (err) {
      return error(err)
    }
  }

  async findById(params: Promise<{ id: string }>) {
    try {
      await this.requireAuth()
      const { id } = await params

      const result = await attendanceService.findById(id)
      if (!result) return notFound('Attendance')

      return success(result, {
        links: generateAttendanceLinks(
          id,
          result.appointmentId,
          result.patientId,
          result.professionalId,
          result.status
        ),
      })
    } catch (err) {
      return error(err)
    }
  }

  async findByAppointmentId(request: NextRequest, params: Promise<{ appointmentId: string }>) {
    try {
      await this.requireAuth()
      const { appointmentId } = await params

      const result = await attendanceService.findByAppointmentId(appointmentId)
      if (!result) return notFound('Attendance')

      return success(result)
    } catch (err) {
      return error(err)
    }
  }

  async findByAppointment(request: NextRequest, appointmentId: string) {
    try {
      await this.requireAuth()
      const attendance = await attendanceService.findByAppointmentId(appointmentId)
      if (!attendance) return notFound('Attendance')
      return success(attendance)
    } catch (err) {
      return error(err)
    }
  }

  async create(request: NextRequest) {
    try {
      await this.requireAuth()

      const body = await request.json()
      const { appointmentId, patientId, professionalId, startTime, notes, observations } = body

      if (!appointmentId || !patientId || !professionalId || !startTime) {
        return error({ status: 400, message: 'Missing required fields' })
      }

      const result = await attendanceService.create({
        appointmentId,
        patientId,
        professionalId,
        startTime: new Date(startTime),
        notes,
        observations,
      })

      return created(result, 'Attendance created successfully', {
        self: { href: `/api/attendances/${result.id}` },
        appointment: { href: `/api/appointments/${result.appointmentId}` },
      })
    } catch (err) {
      return error(err)
    }
  }

  async update(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, PROFESSIONAL_ROLES)
      const { id } = await params

      const body = await request.json()
      const result = await attendanceService.update(id, body)

      return success(result, {
        message: 'Attendance updated',
        links: generateAttendanceLinks(
          id,
          result.appointmentId,
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
      await attendanceService.delete(id)

      return success(null, { message: 'Attendance deleted successfully' })
    } catch (err) {
      return error(err)
    }
  }

  async startAttendance(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, PROFESSIONAL_ROLES)
      const { id } = await params

      const appointment = await appointmentService.findById(id)
      if (!appointment) return notFound('Appointment')

      if (appointment.status !== 'CONFIRMED') {
        return error({ status: 400, message: 'Appointment must be confirmed to start attendance' })
      }

      const professional = await appointmentService.getProfessionalByUserId(user.id)
      if (!professional) {
        return error({ status: 403, message: 'User is not a professional' })
      }

      if (appointment.professionalId !== professional.id) {
        return error({ status: 403, message: 'You can only start attendance for your own appointments' })
      }

      await appointmentService.updateStatus(id, 'IN_PROGRESS')

      const attendance = await attendanceService.create({
        appointmentId: id,
        patientId: appointment.patientId,
        professionalId: professional.id,
        startTime: new Date(),
      })

      return success(attendance, { message: 'Attendance started' })
    } catch (err) {
      return error(err)
    }
  }

  async complete(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, PROFESSIONAL_ROLES)
      const { id } = await params

      const body = await request.json().catch(() => ({}))
      
      const attendance = await attendanceService.findById(id)
      if (!attendance) return notFound('Attendance')

      if (attendance.status === 'COMPLETED') {
        return error({ status: 400, message: 'Attendance is already completed' })
      }

      const professional = await appointmentService.getProfessionalByUserId(user.id)
      if (!professional || attendance.professionalId !== professional.id) {
        return error({ status: 403, message: 'You can only complete your own attendances' })
      }

      const result = await attendanceService.complete(id, {
        notes: body.notes,
        observations: body.observations,
        diagnosis: body.diagnosis,
        treatmentPlan: body.treatmentPlan,
      })

      await appointmentService.updateStatus(attendance.appointmentId, 'COMPLETED')

      return success(result, {
        message: 'Attendance completed',
        links: generateAttendanceLinks(
          id,
          result.appointmentId,
          result.patientId,
          result.professionalId,
          result.status
        ),
      })
    } catch (err) {
      return error(err)
    }
  }

  async confirmAppointment(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, SECRETARY_ROLES)
      const { id } = await params

      const appointment = await appointmentService.findById(id)
      if (!appointment) return notFound('Appointment')

      if (appointment.status !== 'SCHEDULED') {
        return error({ status: 400, message: 'Only scheduled appointments can be confirmed' })
      }

      const result = await appointmentService.updateStatus(id, 'CONFIRMED')
      return success(result, { message: 'Appointment confirmed' })
    } catch (err) {
      return error(err)
    }
  }

  async cancelAppointment(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, SECRETARY_ROLES)
      const { id } = await params

      const body = await request.json()
      const { reason } = body

      if (!reason) {
        return error({ status: 400, message: 'Cancellation reason is required' })
      }

      const appointment = await appointmentService.findById(id)
      if (!appointment) return notFound('Appointment')

      if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
        return error({ status: 400, message: 'Cannot cancel appointment in current status' })
      }

      const result = await appointmentService.cancel(id, reason)
      return success(result, { message: 'Appointment cancelled' })
    } catch (err) {
      return error(err)
    }
  }

  async rescheduleAppointment(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, SECRETARY_ROLES)
      const { id } = await params

      const body = await request.json()
      const { scheduledDateTime } = body

      if (!scheduledDateTime) {
        return error({ status: 400, message: 'New date/time is required' })
      }

      const appointment = await appointmentService.findById(id)
      if (!appointment) return notFound('Appointment')

      if (['COMPLETED', 'CANCELLED', 'NO_SHOW', 'IN_PROGRESS'].includes(appointment.status)) {
        return error({ status: 400, message: 'Cannot reschedule appointment in current status' })
      }

      const result = await appointmentService.reschedule(id, scheduledDateTime)
      return success(result, { message: 'Appointment rescheduled' })
    } catch (err) {
      return error(err)
    }
  }

  async markNoShow(params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, SECRETARY_ROLES)
      const { id } = await params

      const appointment = await appointmentService.findById(id)
      if (!appointment) return notFound('Appointment')

      if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
        return error({ status: 400, message: 'Cannot mark as no-show in current status' })
      }

      const result = await appointmentService.updateStatus(id, 'NO_SHOW')
      return success(result, { message: 'Appointment marked as no-show' })
    } catch (err) {
      return error(err)
    }
  }
}

export const attendanceController = new AttendanceController()
