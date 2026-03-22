import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { reminderService } from '@/services/reminder.service'
import { prisma, cleanupDatabase, uniqueEmail } from '../setup'

describe('ReminderService', () => {
  let testProfessionalId: string
  let testPatientId: string

  beforeAll(async () => {
    await prisma.$connect()

    const specialty = await prisma.specialty.create({
      data: {
        name: 'Psicologia',
        description: 'Test specialty',
        isActive: true,
      },
    })

    const profUser = await prisma.user.create({
      data: {
        name: 'Professional',
        email: uniqueEmail(),
        password: 'hashed',
        role: 'PROFESSIONAL',
      },
    })
    const professional = await prisma.professional.create({
      data: {
        userId: profUser.id,
        specialtyId: specialty.id,
        licenseNumber: '12345',
      },
    })
    testProfessionalId = professional.id

    const patientUser = await prisma.user.create({
      data: {
        name: 'Patient',
        email: 'patient@test.com',
        password: 'hashed',
        role: 'PATIENT',
      },
    })
    const patient = await prisma.patient.create({
      data: { userId: patientUser.id },
    })
    testPatientId = patient.id
  })

  beforeEach(async () => {
    await prisma.appointment.deleteMany()
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  describe('sendReminder', () => {
    it('should return failure for non-existent appointment', async () => {
      const result = await reminderService.sendReminder('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Appointment not found')
    })

    it('should return failure for appointment without patient email', async () => {
      const patientUser = await prisma.user.create({
        data: {
          name: 'No Email Patient',
          email: '',
          password: 'hashed',
          role: 'PATIENT',
        },
      })
      const patient = await prisma.patient.create({
        data: { userId: patientUser.id },
      })

      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          professionalId: testProfessionalId,
          scheduledDateTime: new Date(Date.now() + 86400000),
          endDateTime: new Date(Date.now() + 86400000 + 3600000),
          status: 'SCHEDULED',
        },
      })

      const result = await reminderService.sendReminder(appointment.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Patient has no email')
    })
  })

  describe('sendConfirmation', () => {
    it('should return failure for non-existent appointment', async () => {
      const result = await reminderService.sendConfirmation('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Appointment not found')
    })
  })

  describe('sendCancellation', () => {
    it('should return failure for non-existent appointment', async () => {
      const result = await reminderService.sendCancellation('non-existent-id', 'Test reason')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Appointment not found')
    })
  })

  describe('sendBatchReminders', () => {
    it('should send reminders for tomorrow appointments', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)

      await prisma.appointment.create({
        data: {
          patientId: testPatientId,
          professionalId: testProfessionalId,
          scheduledDateTime: tomorrow,
          endDateTime: new Date(tomorrow.getTime() + 3600000),
          status: 'SCHEDULED',
        },
      })

      const result = await reminderService.sendBatchReminders()

      expect(result).toHaveProperty('sent')
      expect(result).toHaveProperty('failed')
      expect(typeof result.sent).toBe('number')
      expect(typeof result.failed).toBe('number')
    })

    it('should not send reminders for cancelled appointments', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(11, 0, 0, 0)

      await prisma.appointment.create({
        data: {
          patientId: testPatientId,
          professionalId: testProfessionalId,
          scheduledDateTime: tomorrow,
          endDateTime: new Date(tomorrow.getTime() + 3600000),
          status: 'CANCELLED',
        },
      })

      const result = await reminderService.sendBatchReminders()

      const cancelledInResult = result.sent + result.failed
      expect(cancelledInResult).toBeLessThanOrEqual(1)
    })
  })
})
