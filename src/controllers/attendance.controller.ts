import type { NextRequest } from 'next/server'
import { BaseController } from './base.controller'
import { attendanceService } from '@/services/attendance.service'
import { success, created, error, notFound, paginated } from '@/lib/response'
import { generateAttendanceLinks } from '@/lib/hateoas'
import { AttendanceStatus } from '@prisma/client'

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
      await this.requireAuth()
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

  async start(params: Promise<{ id: string }>) {
    try {
      await this.requireAuth()
      const { id } = await params

      const result = await attendanceService.start(id)

      return success(result, {
        message: 'Attendance started',
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

  async complete(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      await this.requireAuth()
      const { id } = await params

      const body = await request.json().catch(() => ({}))
      const result = await attendanceService.complete(id, {
        notes: body.notes,
        observations: body.observations,
        diagnosis: body.diagnosis,
        treatmentPlan: body.treatmentPlan,
      })

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
}

export const attendanceController = new AttendanceController()
