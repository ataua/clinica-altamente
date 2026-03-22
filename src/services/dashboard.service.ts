import { prisma } from '@/lib/prisma'

export class DashboardService {
  async getStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [totalPatients, totalAppointments, todayAppointments, activeProfessionals] = await Promise.all([
      prisma.patient.count({
        where: { isActive: true },
      }),
      prisma.appointment.count(),
      prisma.appointment.count({
        where: {
          scheduledDateTime: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.professional.count({
        where: { isActive: true },
      }),
    ])

    return {
      totalPatients,
      totalAppointments,
      todayAppointments,
      activeProfessionals,
    }
  }
}

export const dashboardService = new DashboardService()
