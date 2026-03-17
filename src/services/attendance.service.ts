import { prisma } from '@/lib/prisma'
import { AttendanceStatus } from '@prisma/client'

export type AttendanceWithRelations = {
  id: string
  appointmentId: string
  patientId: string
  professionalId: string
  startTime: Date
  endTime: Date | null
  status: AttendanceStatus
  notes: string | null
  observations: string | null
  diagnosis: string | null
  treatmentPlan: string | null
  createdAt: Date
  updatedAt: Date
  appointment?: {
    id: string
    scheduledDateTime: Date
    appointmentType: {
      name: string
    }
  }
  patient?: {
    id: string
    user: {
      name: string | null
    }
  }
  professional?: {
    id: string
    user: {
      name: string | null
    }
    specialty: string
  }
}

class AttendanceService {
  async create(data: {
    appointmentId: string
    patientId: string
    professionalId: string
    startTime: Date
    notes?: string
    observations?: string
  }) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: { appointmentType: true },
    })

    if (!appointment) {
      throw new Error('Agendamento não encontrado')
    }

    const endTime = new Date(data.startTime)
    endTime.setMinutes(endTime.getMinutes() + appointment.appointmentType.durationMinutes)

    return prisma.attendance.create({
      data: {
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        professionalId: data.professionalId,
        startTime: data.startTime,
        endTime,
        notes: data.notes,
        observations: data.observations,
        status: AttendanceStatus.PENDING,
      },
      include: {
        appointment: {
          include: { appointmentType: true },
        },
        patient: {
          include: { user: { select: { name: true } } },
        },
        professional: {
          include: { user: { select: { name: true } } },
        },
      },
    })
  }

  async findAll(params: {
    page?: number
    limit?: number
    patientId?: string
    professionalId?: string
    appointmentId?: string
    status?: AttendanceStatus
  }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.patientId) where.patientId = params.patientId
    if (params.professionalId) where.professionalId = params.professionalId
    if (params.appointmentId) where.appointmentId = params.appointmentId
    if (params.status) where.status = params.status

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          appointment: {
            include: { appointmentType: true },
          },
          patient: {
            include: { user: { select: { name: true } } },
          },
          professional: {
            include: { user: { select: { name: true } } },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ])

    return {
      attendances: attendances as unknown as AttendanceWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: string) {
    return prisma.attendance.findUnique({
      where: { id },
      include: {
        appointment: {
          include: { appointmentType: true },
        },
        patient: {
          include: { user: { select: { name: true } } },
        },
        professional: {
          include: { user: { select: { name: true } } },
        },
      },
    }) as Promise<AttendanceWithRelations | null>
  }

  async update(
    id: string,
    data: {
      notes?: string
      observations?: string
      diagnosis?: string
      treatmentPlan?: string
      status?: AttendanceStatus
      endTime?: Date
    }
  ) {
    const updateData: any = {}
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.observations !== undefined) updateData.observations = data.observations
    if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis
    if (data.treatmentPlan !== undefined) updateData.treatmentPlan = data.treatmentPlan
    if (data.status) updateData.status = data.status
    if (data.endTime !== undefined) updateData.endTime = data.endTime

    return prisma.attendance.update({
      where: { id },
      data: updateData,
      include: {
        appointment: {
          include: { appointmentType: true },
        },
        patient: {
          include: { user: { select: { name: true } } },
        },
        professional: {
          include: { user: { select: { name: true } } },
        },
      },
    })
  }

  async start(id: string) {
    return prisma.attendance.update({
      where: { id },
      data: {
        status: AttendanceStatus.IN_PROGRESS,
        startTime: new Date(),
      },
      include: {
        appointment: {
          include: { appointmentType: true },
        },
        patient: {
          include: { user: { select: { name: true } } },
        },
        professional: {
          include: { user: { select: { name: true } } },
        },
      },
    })
  }

  async complete(id: string, data?: {
    notes?: string
    observations?: string
    diagnosis?: string
    treatmentPlan?: string
  }) {
    return prisma.attendance.update({
      where: { id },
      data: {
        status: AttendanceStatus.COMPLETED,
        endTime: new Date(),
        ...(data?.notes && { notes: data.notes }),
        ...(data?.observations && { observations: data.observations }),
        ...(data?.diagnosis && { diagnosis: data.diagnosis }),
        ...(data?.treatmentPlan && { treatmentPlan: data.treatmentPlan }),
      },
      include: {
        appointment: {
          include: { appointmentType: true },
        },
        patient: {
          include: { user: { select: { name: true } } },
        },
        professional: {
          include: { user: { select: { name: true } } },
        },
      },
    })
  }

  async delete(id: string) {
    return prisma.attendance.delete({ where: { id } })
  }

  async findByAppointmentId(appointmentId: string) {
    return prisma.attendance.findFirst({
      where: { appointmentId },
      include: {
        appointment: {
          include: { appointmentType: true },
        },
        patient: {
          include: { user: { select: { name: true } } },
        },
        professional: {
          include: { user: { select: { name: true } } },
        },
      },
    })
  }
}

export const attendanceService = new AttendanceService()
