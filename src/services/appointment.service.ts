import { prisma } from '@/lib/prisma'
import { CreateAppointmentInput, UpdateAppointmentInput, AppointmentFilterInput } from '@/dtos/appointment.dto'
import { AppointmentStatus } from '@prisma/client'

export class AppointmentService {
  async create(data: CreateAppointmentInput) {
    const scheduledDateTime = new Date(data.scheduledDateTime)
    const appointmentType = await prisma.appointmentType.findUnique({
      where: { id: data.appointmentTypeId },
    })

    if (!appointmentType) {
      throw new Error('Tipo de agendamento não encontrado')
    }

    const endDateTime = new Date(scheduledDateTime.getTime() + appointmentType.durationMinutes * 60000)

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        professionalId: data.professionalId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        OR: [
          {
            scheduledDateTime: { lte: scheduledDateTime },
            endDateTime: { gt: scheduledDateTime },
          },
          {
            scheduledDateTime: { lt: endDateTime },
            endDateTime: { gte: endDateTime },
          },
          {
            scheduledDateTime: { gte: scheduledDateTime },
            endDateTime: { lte: endDateTime },
          },
        ],
      },
    })

    if (conflictingAppointment) {
      throw new Error('Horário conflictado com outro agendamento')
    }

    return prisma.appointment.create({
      data: {
        patientId: data.patientId,
        professionalId: data.professionalId,
        appointmentTypeId: data.appointmentTypeId,
        scheduledDateTime,
        endDateTime,
        notes: data.notes,
      },
      include: {
        patient: {
          include: { user: { select: { name: true, email: true } } },
        },
        professional: {
          include: { user: { select: { name: true } } },
        },
        appointmentType: true,
      },
    })
  }

  async findAll(filter: AppointmentFilterInput) {
    const { page, limit, startDate, endDate, professionalId, patientId, status } = filter
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (startDate || endDate) {
      where.scheduledDateTime = {}
      if (startDate) (where.scheduledDateTime as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.scheduledDateTime as Record<string, Date>).lte = new Date(endDate)
    }

    if (professionalId) where.professionalId = professionalId
    if (patientId) where.patientId = patientId
    if (status) where.status = status

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDateTime: 'asc' },
        include: {
          patient: {
            include: { user: { select: { name: true, email: true } } },
          },
          professional: {
            include: { user: { select: { name: true } } },
          },
          appointmentType: true,
        },
      }),
      prisma.appointment.count({ where }),
    ])

    return {
      appointments: appointments.map((apt) => ({
        id: apt.id,
        patientName: apt.patient.user.name,
        professionalName: apt.professional.user.name,
        appointmentType: apt.appointmentType.name,
        scheduledDateTime: apt.scheduledDateTime.toISOString(),
        endDateTime: apt.endDateTime.toISOString(),
        status: apt.status,
        notes: apt.notes,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: { select: { name: true, email: true } } },
        },
        professional: {
          include: { user: { select: { name: true } } },
        },
        appointmentType: true,
      },
    })

    if (!appointment) return null

    return {
      id: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patient.user.name,
      professionalId: appointment.professionalId,
      professionalName: appointment.professional.user.name,
      appointmentTypeId: appointment.appointmentTypeId,
      appointmentType: appointment.appointmentType.name,
      scheduledDateTime: appointment.scheduledDateTime.toISOString(),
      endDateTime: appointment.endDateTime.toISOString(),
      status: appointment.status,
      notes: appointment.notes,
      cancellationReason: appointment.cancellationReason,
    }
  }

  async update(id: string, data: UpdateAppointmentInput) {
    const existing = await prisma.appointment.findUnique({ where: { id } })
    if (!existing) throw new Error('Agendamento não encontrado')

    const updateData: Record<string, unknown> = {}

    if (data.scheduledDateTime) {
      const scheduledDateTime = new Date(data.scheduledDateTime)
      const appointmentType = await prisma.appointmentType.findUnique({
        where: { id: data.appointmentTypeId || existing.appointmentTypeId },
      })

      if (!appointmentType) throw new Error('Tipo de agendamento não encontrado')

      updateData.scheduledDateTime = scheduledDateTime
      updateData.endDateTime = new Date(scheduledDateTime.getTime() + appointmentType.durationMinutes * 60000)
    }

    if (data.appointmentTypeId) updateData.appointmentTypeId = data.appointmentTypeId
    if (data.status) updateData.status = data.status as AppointmentStatus
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.cancellationReason !== undefined) updateData.cancellationReason = data.cancellationReason

    return prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { include: { user: { select: { name: true } } } },
        professional: { include: { user: { select: { name: true } } } },
        appointmentType: true,
      },
    })
  }

  async cancel(id: string, reason: string) {
    const existing = await prisma.appointment.findUnique({ where: { id } })
    if (!existing) throw new Error('Agendamento não encontrado')

    if (existing.status === 'CANCELLED') {
      throw new Error('Agendamento já está cancelado')
    }

    if (existing.status === 'COMPLETED') {
      throw new Error('Não é possível cancelar um agendamento concluído')
    }

    return prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED' as AppointmentStatus,
        cancellationReason: reason,
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        professional: { include: { user: { select: { name: true } } } },
        appointmentType: true,
      },
    })
  }

  async reschedule(id: string, newDateTime: string, newProfessionalId?: string) {
    const existing = await prisma.appointment.findUnique({ where: { id } })
    if (!existing) throw new Error('Agendamento não encontrado')

    if (existing.status === 'CANCELLED') {
      throw new Error('Não é possível reagendar um agendamento cancelado')
    }

    if (existing.status === 'COMPLETED') {
      throw new Error('Não é possível reagendar um agendamento concluído')
    }

    const scheduledDateTime = new Date(newDateTime)
    const appointmentType = await prisma.appointmentType.findUnique({
      where: { id: existing.appointmentTypeId },
    })

    if (!appointmentType) throw new Error('Tipo de agendamento não encontrado')

    const endDateTime = new Date(scheduledDateTime.getTime() + appointmentType.durationMinutes * 60000)

    const professionalId = newProfessionalId || existing.professionalId

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        professionalId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        OR: [
          {
            scheduledDateTime: { lte: scheduledDateTime },
            endDateTime: { gt: scheduledDateTime },
          },
          {
            scheduledDateTime: { lt: endDateTime },
            endDateTime: { gte: endDateTime },
          },
          {
            scheduledDateTime: { gte: scheduledDateTime },
            endDateTime: { lte: endDateTime },
          },
        ],
      },
    })

    if (conflictingAppointment) {
      throw new Error('Horário conflictado com outro agendamento')
    }

    return prisma.appointment.update({
      where: { id },
      data: {
        scheduledDateTime,
        endDateTime,
        status: 'SCHEDULED' as AppointmentStatus,
        ...(newProfessionalId && { professionalId: newProfessionalId }),
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        professional: { include: { user: { select: { name: true } } } },
        appointmentType: true,
      },
    })
  }

  async delete(id: string) {
    return prisma.appointment.delete({ where: { id } })
  }

  async getAppointmentTypes() {
    return prisma.appointmentType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
  }

  async getProfessionals() {
    return prisma.professional.findMany({
      include: {
        user: { select: { name: true } },
      },
    })
  }

  async getAvailableSlots(professionalId: string, date: string) {
    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()

    const schedule = await prisma.professionalSchedule.findFirst({
      where: {
        professionalId,
        dayOfWeek,
        isActive: true,
      },
    })

    if (!schedule) {
      return { slots: [], message: 'Profissional não atende neste dia' }
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        scheduledDateTime: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lt: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
      },
      orderBy: { scheduledDateTime: 'asc' },
    })

    const slots: string[] = []
    const slotDuration = 30

    const parseTimeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }

    const startMinutes = parseTimeToMinutes(schedule.startTime)
    const endMinutes = parseTimeToMinutes(schedule.endTime)

    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
      const slotTime = new Date(targetDate)
      slotTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)

      const isAvailable = !appointments.some(
        (apt) =>
          slotTime >= apt.scheduledDateTime && slotTime < apt.endDateTime
      )

      if (isAvailable) {
        slots.push(slotTime.toISOString())
      }
    }

    return { slots }
  }
}

export const appointmentService = new AppointmentService()
