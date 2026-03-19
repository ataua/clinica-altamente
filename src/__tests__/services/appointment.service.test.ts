import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { appointmentService } from '@/services/appointment.service'
import { prisma, cleanupDatabase, uniqueEmail } from '../setup'

describe('AppointmentService', () => {
  let testProfessionalId: string
  let testAppointmentTypeId: string
  let testPatientId: string

  beforeAll(async () => {
    await prisma.$connect()

    const user = await prisma.user.create({
      data: {
        name: 'Professional Test',
        email: uniqueEmail(),
        password: 'hashed',
        role: 'PROFESSIONAL',
      },
    })

    const professional = await prisma.professional.create({
      data: {
        userId: user.id,
        specialty: 'Psicologia',
        licenseNumber: '12345',
      },
    })
    testProfessionalId = professional.id

    await prisma.professionalSchedule.create({
      data: {
        professionalId: professional.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
    })

    const appointmentType = await prisma.appointmentType.create({
      data: {
        name: 'Avaliação',
        description: 'Avaliação inicial',
        durationMinutes: 60,
        isActive: true,
      },
    })
    testAppointmentTypeId = appointmentType.id
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  beforeEach(async () => {
    await prisma.appointment.deleteMany()
    await prisma.patient.deleteMany()

    const user = await prisma.user.create({
      data: {
        name: 'Test Patient',
        email: uniqueEmail(),
        password: 'hashed',
        role: 'PATIENT',
      },
    })

    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        phone: '11999999999',
      },
    })
    testPatientId = patient.id
  })

  describe('create', () => {
    it('should create a new appointment', async () => {
      const appointment = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Test appointment',
      })

      expect(appointment).toBeDefined()
      expect(appointment.patientId).toBe(testPatientId)
      expect(appointment.professionalId).toBe(testProfessionalId)
    })

    it('should throw for invalid appointment type', async () => {
      await expect(
        appointmentService.create({
          patientId: testPatientId,
          professionalId: testProfessionalId,
          appointmentTypeId: 'invalid-id',
          scheduledDateTime: new Date().toISOString(),
        })
      ).rejects.toThrow('Tipo de agendamento não encontrado')
    })

    it('should throw for conflicting appointment', async () => {
      const scheduledTime = new Date(Date.now() + 86400000)
      scheduledTime.setHours(10, 0, 0, 0)

      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: scheduledTime.toISOString(),
      })

      await expect(
        appointmentService.create({
          patientId: testPatientId,
          professionalId: testProfessionalId,
          appointmentTypeId: testAppointmentTypeId,
          scheduledDateTime: scheduledTime.toISOString(),
        })
      ).rejects.toThrow()
    })

    it('should allow overlapping for different professionals', async () => {
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
          specialty: 'Psicologia',
          licenseNumber: '54321',
        },
      })

      const scheduledTime = new Date(Date.now() + 86400000)
      scheduledTime.setHours(10, 0, 0, 0)

      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: scheduledTime.toISOString(),
      })

      const result = await appointmentService.create({
        patientId: testPatientId,
        professionalId: professional2.id,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: scheduledTime.toISOString(),
      })

      expect(result.id).toBeDefined()
    })
  })

  describe('cancel', () => {
    it('should throw for non-existent appointment', async () => {
      await expect(
        appointmentService.cancel('non-existent-id', 'Patient sick')
      ).rejects.toThrow()
    })

    it('should cancel an appointment', async () => {
      const appointment = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const cancelled = await appointmentService.cancel(appointment.id, 'Patient sick')

      expect(cancelled.status).toBe('CANCELLED')
      expect(cancelled.cancellationReason).toBe('Patient sick')
    })
  })

  describe('getAppointmentTypes', () => {
    it('should return active appointment types', async () => {
      const types = await appointmentService.getAppointmentTypes()

      expect(types).toBeDefined()
      expect(types.length).toBeGreaterThan(0)
      expect(types[0].isActive).toBe(true)
    })
  })

  describe('getProfessionals', () => {
    it('should return all professionals', async () => {
      const professionals = await appointmentService.getProfessionals()

      expect(professionals).toBeDefined()
      expect(professionals.length).toBeGreaterThan(0)
    })
  })
})
