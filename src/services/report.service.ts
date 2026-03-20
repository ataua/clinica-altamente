import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface DashboardStats {
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  scheduledAppointments: number
  confirmedAppointments: number
  noShowRate: number
}

export interface ProfessionalStats {
  professionalId: string
  professionalName: string
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
}

export interface AttendanceRecord {
  id: string
  patientName: string
  professionalName: string
  appointmentType: string
  scheduledDateTime: Date
  status: string
}

export class ReportService {
  async getDashboardStats(params: {
    startDate?: Date
    endDate?: Date
    professionalId?: string
  }): Promise<DashboardStats> {
    const where: Prisma.AppointmentWhereInput = {}

    if (params.startDate || params.endDate) {
      where.scheduledDateTime = {}
      if (params.startDate) {
        where.scheduledDateTime.gte = params.startDate
      }
      if (params.endDate) {
        where.scheduledDateTime.lte = params.endDate
      }
    }

    if (params.professionalId) {
      where.professionalId = params.professionalId
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({ where }),
      prisma.appointment.count({ where }),
    ])

    const completed = appointments.filter(a => a.status === 'COMPLETED').length
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length
    const noShow = appointments.filter(a => a.status === 'NO_SHOW').length
    const scheduled = appointments.filter(a => a.status === 'SCHEDULED').length
    const confirmed = appointments.filter(a => a.status === 'CONFIRMED').length

    const completedOrNoShow = completed + noShow
    const noShowRate = completedOrNoShow > 0 
      ? Math.round((noShow / completedOrNoShow) * 100 * 100) / 100 
      : 0

    return {
      totalAppointments: total,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      noShowAppointments: noShow,
      scheduledAppointments: scheduled,
      confirmedAppointments: confirmed,
      noShowRate,
    }
  }

  async getProfessionalStats(params: {
    startDate?: Date
    endDate?: Date
  }): Promise<ProfessionalStats[]> {
    const where: Prisma.AppointmentWhereInput = {}

    if (params.startDate || params.endDate) {
      where.scheduledDateTime = {}
      if (params.startDate) {
        where.scheduledDateTime.gte = params.startDate
      }
      if (params.endDate) {
        where.scheduledDateTime.lte = params.endDate
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        professional: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    })

    const statsMap = new Map<string, ProfessionalStats>()

    for (const apt of appointments) {
      const pid = apt.professionalId
      if (!statsMap.has(pid)) {
        statsMap.set(pid, {
          professionalId: pid,
          professionalName: apt.professional.user.name || 'Unknown',
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          noShowAppointments: 0,
        })
      }

      const stats = statsMap.get(pid)!
      stats.totalAppointments++

      if (apt.status === 'COMPLETED') {
        stats.completedAppointments++
      } else if (apt.status === 'CANCELLED') {
        stats.cancelledAppointments++
      } else if (apt.status === 'NO_SHOW') {
        stats.noShowAppointments++
      }
    }

    return Array.from(statsMap.values()).sort(
      (a, b) => b.totalAppointments - a.totalAppointments
    )
  }

  async getNoShowPatients(params: {
    startDate?: Date
    endDate?: Date
  }): Promise<Array<{
    patientId: string
    patientName: string
    patientEmail: string | null
    noShowCount: number
    lastNoShow: Date | null
  }>> {
    const where: Prisma.AppointmentWhereInput = {
      status: 'NO_SHOW',
    }

    if (params.startDate || params.endDate) {
      where.scheduledDateTime = {}
      if (params.startDate) {
        where.scheduledDateTime.gte = params.startDate
      }
      if (params.endDate) {
        where.scheduledDateTime.lte = params.endDate
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { scheduledDateTime: 'desc' },
    })

    const patientStats = new Map<string, {
      patientId: string
      patientName: string
      patientEmail: string | null
      noShowCount: number
      lastNoShow: Date | null
    }>()

    for (const apt of appointments) {
      const pid = apt.patientId
      if (!patientStats.has(pid)) {
        patientStats.set(pid, {
          patientId: pid,
          patientName: apt.patient.user.name || 'Unknown',
          patientEmail: apt.patient.user.email,
          noShowCount: 0,
          lastNoShow: null,
        })
      }

      const stats = patientStats.get(pid)!
      stats.noShowCount++
      if (!stats.lastNoShow || apt.scheduledDateTime > stats.lastNoShow) {
        stats.lastNoShow = apt.scheduledDateTime
      }
    }

    return Array.from(patientStats.values()).sort(
      (a, b) => b.noShowCount - a.noShowCount
    )
  }

  async getPatientAttendanceHistory(
    patientId: string,
    params?: { limit?: number }
  ): Promise<AttendanceRecord[]> {
    const limit = params?.limit || 50

    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        patient: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        professional: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        appointmentType: {
          select: { name: true },
        },
      },
      orderBy: { scheduledDateTime: 'desc' },
      take: limit,
    })

    return appointments.map(apt => ({
      id: apt.id,
      patientName: apt.patient.user.name || 'Unknown',
      professionalName: apt.professional.user.name || 'Unknown',
      appointmentType: apt.appointmentType.name,
      scheduledDateTime: apt.scheduledDateTime,
      status: apt.status,
    }))
  }

  async getMonthlyTrend(months: number = 6): Promise<Array<{
    month: string
    year: number
    total: number
    completed: number
    noShow: number
  }>> {
    const results = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const appointments = await prisma.appointment.findMany({
        where: {
          scheduledDateTime: {
            gte: month,
            lt: nextMonth,
          },
        },
      })

      results.push({
        month: month.toLocaleDateString('pt-BR', { month: 'short' }),
        year: month.getFullYear(),
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
      })
    }

    return results
  }
}

export const reportService = new ReportService()
