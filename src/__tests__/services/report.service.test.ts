import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { reportService } from '@/services/report.service'
import { prisma, cleanupDatabase, uniqueEmail } from '../setup'
import { AppointmentStatus } from '@prisma/client'

describe('ReportService', () => {
  let testProfessionalId: string
  let testProfessionalId2: string
  let testAppointmentTypeId: string
  let testPatientId1: string
  let testPatientId2: string

  beforeAll(async () => {
    await prisma.$connect()

    const specialty = await prisma.specialty.create({
      data: {
        name: 'Psicologia',
        description: 'Test specialty',
        isActive: true,
      },
    })

    const user1 = await prisma.user.create({
      data: {
        name: 'Professional 1',
        email: uniqueEmail(),
        password: 'hashed',
        role: 'PROFESSIONAL',
      },
    })
    const professional1 = await prisma.professional.create({
      data: {
        userId: user1.id,
        specialtyId: specialty.id,
        licenseNumber: '12345',
      },
    })
    testProfessionalId = professional1.id

    const user2 = await prisma.user.create({
      data: {
        name: 'Professional 2',
        email: uniqueEmail(),
        password: 'hashed',
        role: 'PROFESSIONAL',
      },
    })
    const professional2 = await prisma.professional.create({
      data: {
        userId: user2.id,
        specialtyId: specialty.id,
        licenseNumber: '54321',
      },
    })
    testProfessionalId2 = professional2.id

    const aptType = await prisma.appointmentType.create({
      data: {
        name: 'Avaliação',
        description: 'Avaliação inicial',
        durationMinutes: 60,
        isActive: true,
        specialtyId: specialty.id,
      },
    })
    testAppointmentTypeId = aptType.id
  })

  beforeEach(async () => {
    await prisma.attendance.deleteMany()
    await prisma.appointment.deleteMany()
    await prisma.patient.deleteMany()

    const patientUser1 = await prisma.user.create({
      data: {
        name: 'Patient 1',
        email: uniqueEmail(),
        password: 'hashed',
        role: 'PATIENT',
      },
    })
    const patient1 = await prisma.patient.create({
      data: { userId: patientUser1.id },
    })
    testPatientId1 = patient1.id

    const patientUser2 = await prisma.user.create({
      data: {
        name: 'Patient 2',
        email: uniqueEmail(),
        password: 'hashed',
        role: 'PATIENT',
      },
    })
    const patient2 = await prisma.patient.create({
      data: { userId: patientUser2.id },
    })
    testPatientId2 = patient2.id
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  describe('getDashboardStats', () => {
    it('should return zero stats when no appointments exist', async () => {
      const stats = await reportService.getDashboardStats({})

      expect(stats.totalAppointments).toBe(0)
      expect(stats.completedAppointments).toBe(0)
      expect(stats.noShowAppointments).toBe(0)
      expect(stats.noShowRate).toBe(0)
    })

    it('should calculate correct stats with appointments', async () => {
      const baseDate = new Date('2025-01-15T10:00:00Z')

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: baseDate,
          endDateTime: new Date(baseDate.getTime() + 3600000),
          status: AppointmentStatus.COMPLETED,
        },
      })

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: new Date(baseDate.getTime() + 86400000),
          endDateTime: new Date(baseDate.getTime() + 86400000 + 3600000),
          status: AppointmentStatus.NO_SHOW,
        },
      })

      await prisma.appointment.create({
        data: {
          patientId: testPatientId2,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: new Date(baseDate.getTime() + 172800000),
          endDateTime: new Date(baseDate.getTime() + 172800000 + 3600000),
          status: AppointmentStatus.SCHEDULED,
        },
      })

      const stats = await reportService.getDashboardStats({})

      expect(stats.totalAppointments).toBe(3)
      expect(stats.completedAppointments).toBe(1)
      expect(stats.noShowAppointments).toBe(1)
      expect(stats.scheduledAppointments).toBe(1)
      expect(stats.noShowRate).toBe(50)
    })

    it('should filter by date range', async () => {
      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: new Date('2025-01-10T10:00:00Z'),
          endDateTime: new Date('2025-01-10T11:00:00Z'),
          status: AppointmentStatus.COMPLETED,
        },
      })

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: new Date('2025-01-20T10:00:00Z'),
          endDateTime: new Date('2025-01-20T11:00:00Z'),
          status: AppointmentStatus.COMPLETED,
        },
      })

      const stats = await reportService.getDashboardStats({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-15'),
      })

      expect(stats.totalAppointments).toBe(1)
    })

    it('should filter by professional', async () => {
      const baseDate = new Date('2025-01-15T10:00:00Z')

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: baseDate,
          endDateTime: new Date(baseDate.getTime() + 3600000),
          status: AppointmentStatus.COMPLETED,
        },
      })

      await prisma.appointment.create({
        data: {
          patientId: testPatientId2,
          professionalId: testProfessionalId2,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: baseDate,
          endDateTime: new Date(baseDate.getTime() + 3600000),
          status: AppointmentStatus.COMPLETED,
        },
      })

      const stats = await reportService.getDashboardStats({
        professionalId: testProfessionalId,
      })

      expect(stats.totalAppointments).toBe(1)
    })
  })

  describe('getProfessionalStats', () => {
    it('should return empty array when no appointments', async () => {
      const stats = await reportService.getProfessionalStats({})

      expect(stats).toEqual([])
    })

    it('should return correct stats per professional', async () => {
      const baseDate = new Date('2025-01-15T10:00:00Z')

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: baseDate,
          endDateTime: new Date(baseDate.getTime() + 3600000),
          status: AppointmentStatus.COMPLETED,
        },
      })

      await prisma.appointment.create({
        data: {
          patientId: testPatientId2,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: new Date(baseDate.getTime() + 86400000),
          endDateTime: new Date(baseDate.getTime() + 86400000 + 3600000),
          status: AppointmentStatus.NO_SHOW,
        },
      })

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId2,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: baseDate,
          endDateTime: new Date(baseDate.getTime() + 3600000),
          status: AppointmentStatus.COMPLETED,
        },
      })

      const stats = await reportService.getProfessionalStats({})

      expect(stats.length).toBe(2)
      expect(stats[0].professionalName).toBe('Professional 1')
      expect(stats[0].totalAppointments).toBe(2)
      expect(stats[0].completedAppointments).toBe(1)
      expect(stats[0].noShowAppointments).toBe(1)
    })
  })

  describe('getNoShowPatients', () => {
    it('should return empty array when no no-show appointments', async () => {
      const baseDate = new Date('2025-01-15T10:00:00Z')

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: baseDate,
          endDateTime: new Date(baseDate.getTime() + 3600000),
          status: AppointmentStatus.COMPLETED,
        },
      })

      const noShows = await reportService.getNoShowPatients({})

      expect(noShows).toEqual([])
    })

    it('should return no-show patients sorted by count', async () => {
      const baseDate = new Date('2025-01-15T10:00:00Z')

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: baseDate,
          endDateTime: new Date(baseDate.getTime() + 3600000),
          status: AppointmentStatus.NO_SHOW,
        },
      })

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: new Date(baseDate.getTime() + 86400000),
          endDateTime: new Date(baseDate.getTime() + 86400000 + 3600000),
          status: AppointmentStatus.NO_SHOW,
        },
      })

      await prisma.appointment.create({
        data: {
          patientId: testPatientId2,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: new Date(baseDate.getTime() + 172800000),
          endDateTime: new Date(baseDate.getTime() + 172800000 + 3600000),
          status: AppointmentStatus.NO_SHOW,
        },
      })

      const noShows = await reportService.getNoShowPatients({})

      expect(noShows.length).toBe(2)
      expect(noShows[0].patientName).toBe('Patient 1')
      expect(noShows[0].noShowCount).toBe(2)
      expect(noShows[1].patientName).toBe('Patient 2')
      expect(noShows[1].noShowCount).toBe(1)
    })

    it('should filter by date range', async () => {
      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: new Date('2025-01-05T10:00:00Z'),
          endDateTime: new Date('2025-01-05T11:00:00Z'),
          status: AppointmentStatus.NO_SHOW,
        },
      })

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: new Date('2025-01-20T10:00:00Z'),
          endDateTime: new Date('2025-01-20T11:00:00Z'),
          status: AppointmentStatus.NO_SHOW,
        },
      })

      const noShows = await reportService.getNoShowPatients({
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-31'),
      })

      expect(noShows.length).toBe(1)
    })
  })

  describe('getPatientAttendanceHistory', () => {
    it('should return patient attendance history', async () => {
      const baseDate = new Date('2025-01-15T10:00:00Z')

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: baseDate,
          endDateTime: new Date(baseDate.getTime() + 3600000),
          status: AppointmentStatus.COMPLETED,
        },
      })

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: new Date(baseDate.getTime() + 86400000),
          endDateTime: new Date(baseDate.getTime() + 86400000 + 3600000),
          status: AppointmentStatus.NO_SHOW,
        },
      })

      const history = await reportService.getPatientAttendanceHistory(testPatientId1)

      expect(history.length).toBe(2)
      expect(history[0].patientName).toBe('Patient 1')
      expect(history[0].professionalName).toBe('Professional 1')
      expect(history[0].appointmentType).toBe('Avaliação')
    })

    it('should respect limit parameter', async () => {
      const baseDate = new Date('2025-01-15T10:00:00Z')

      for (let i = 0; i < 5; i++) {
        const date = new Date(baseDate.getTime() + i * 86400000)
        await prisma.appointment.create({
          data: {
            patientId: testPatientId1,
            professionalId: testProfessionalId,
            appointmentTypeId: testAppointmentTypeId,
            scheduledDateTime: date,
            endDateTime: new Date(date.getTime() + 3600000),
            status: AppointmentStatus.COMPLETED,
          },
        })
      }

      const history = await reportService.getPatientAttendanceHistory(testPatientId1, { limit: 3 })

      expect(history.length).toBe(3)
    })
  })

  describe('getMonthlyTrend', () => {
    it('should return monthly trend data', async () => {
      const baseDate = new Date()
      baseDate.setDate(15)

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: baseDate,
          endDateTime: new Date(baseDate.getTime() + 3600000),
          status: AppointmentStatus.COMPLETED,
        },
      })

      await prisma.appointment.create({
        data: {
          patientId: testPatientId1,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: baseDate,
          endDateTime: new Date(baseDate.getTime() + 3600000),
          status: AppointmentStatus.NO_SHOW,
        },
      })

      const trend = await reportService.getMonthlyTrend(3)

      expect(trend.length).toBe(3)
      expect(trend[0]).toHaveProperty('month')
      expect(trend[0]).toHaveProperty('year')
      expect(trend[0]).toHaveProperty('total')
      expect(trend[0]).toHaveProperty('completed')
      expect(trend[0]).toHaveProperty('noShow')
    })
  })
})
