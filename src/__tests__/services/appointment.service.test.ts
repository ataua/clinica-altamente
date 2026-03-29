import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { appointmentService } from '@/services/appointment.service'
import { prisma, cleanupDatabase, uniqueEmail } from '../setup'
import { AppointmentStatus } from '@prisma/client'

describe('AppointmentService', () => {
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
        specialtyId: specialty.id,
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
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Test appointment',
      })

      expect(appointment).toBeDefined()
      expect(appointment.patientId).toBe(testPatientId)
      expect(appointment.professionalId).toBe(testProfessionalId)
    })

    it('should throw for conflicting appointment', async () => {
      const scheduledTime = new Date(Date.now() + 86400000)
      scheduledTime.setHours(10, 0, 0, 0)

      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: scheduledTime.toISOString(),
      })

      await expect(
        appointmentService.create({
          patientId: testPatientId,
          professionalId: testProfessionalId,
          scheduledDateTime: scheduledTime.toISOString(),
        })
      ).rejects.toThrow()
    })

    it('should allow overlapping for different professionals', async () => {
      const specialty = await prisma.specialty.findFirst()

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
          specialtyId: specialty?.id,
          licenseNumber: '54321',
        },
      })

      const scheduledTime = new Date(Date.now() + 86400000)
      scheduledTime.setHours(10, 0, 0, 0)

      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: scheduledTime.toISOString(),
      })

      const result = await appointmentService.create({
        patientId: testPatientId,
        professionalId: professional2.id,
        scheduledDateTime: scheduledTime.toISOString(),
      })

      expect(result.id).toBeDefined()
    })

    it('should calculate end time based on default duration', async () => {
      const scheduledTime = new Date('2025-01-01T10:00:00Z')
      const appointment = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: scheduledTime.toISOString(),
      })

      expect(appointment.endDateTime).toBeDefined()
      expect(new Date(appointment.endDateTime).getTime()).toBe(new Date('2025-01-01T11:00:00Z').getTime())
    })
  })

  describe('findAll', () => {
    it('should return appointments with pagination', async () => {
      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const result = await appointmentService.findAll({
        page: 1,
        limit: 10,
      })

      expect(result.appointments).toBeDefined()
      expect(result.pagination).toBeDefined()
    })

    it('should filter by professionalId', async () => {
      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const result = await appointmentService.findAll({
        page: 1,
        limit: 10,
        professionalId: testProfessionalId,
      })

      expect(result.appointments.length).toBeGreaterThan(0)
    })

    it('should filter by status', async () => {
      const appointment = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const result = await appointmentService.findAll({
        page: 1,
        limit: 10,
        status: AppointmentStatus.SCHEDULED,
      })

      expect(result.appointments.some((apt) => apt.id === appointment.id)).toBe(true)
    })

    it('should filter by date range', async () => {
      const tomorrow = new Date(Date.now() + 86400000)
      tomorrow.setHours(12, 0, 0, 0)

      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: tomorrow.toISOString(),
      })

      const startOfDay = new Date(tomorrow)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(tomorrow)
      endOfDay.setHours(23, 59, 59, 999)

      const result = await appointmentService.findAll({
        page: 1,
        limit: 10,
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      })

      expect(result.appointments.length).toBeGreaterThan(0)
    })
  })

  describe('findById', () => {
    it('should return appointment by id', async () => {
      const created = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const found = await appointmentService.findById(created.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
    })

    it('should return null for non-existent id', async () => {
      const found = await appointmentService.findById('non-existent-id')

      expect(found).toBeNull()
    })
  })

  describe('update', () => {
    it('should update appointment notes', async () => {
      const created = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const updated = await appointmentService.update(created.id, {
        notes: 'Updated notes',
      })

      expect(updated.notes).toBe('Updated notes')
    })

    it('should throw for non-existent appointment', async () => {
      await expect(
        appointmentService.update('non-existent-id', { notes: 'Test' })
      ).rejects.toThrow('Agendamento não encontrado')
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
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const cancelled = await appointmentService.cancel(appointment.id, 'Patient sick')

      expect(cancelled.status).toBe('CANCELLED')
      expect(cancelled.cancellationReason).toBe('Patient sick')
    })

    it('should throw when cancelling already cancelled', async () => {
      const appointment = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      await appointmentService.cancel(appointment.id, 'First cancellation')

      await expect(
        appointmentService.cancel(appointment.id, 'Second cancellation')
      ).rejects.toThrow('Agendamento já está cancelado')
    })
  })

  describe('reschedule', () => {
    it('should reschedule an appointment', async () => {
      const appointment = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const newDateTime = new Date(Date.now() + 172800000).toISOString()
      const rescheduled = await appointmentService.reschedule(appointment.id, newDateTime)

      expect(rescheduled.status).toBe('SCHEDULED')
    })

    it('should throw when rescheduling cancelled appointment', async () => {
      const appointment = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      await appointmentService.cancel(appointment.id, 'Cancelled')

      await expect(
        appointmentService.reschedule(appointment.id, new Date().toISOString())
      ).rejects.toThrow('Não é possível reagendar um agendamento cancelado')
    })

    it('should throw for conflicting time on reschedule', async () => {
      const scheduledTime = new Date(Date.now() + 86400000)
      scheduledTime.setHours(10, 0, 0, 0)

      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: scheduledTime.toISOString(),
      })

      const newTime = new Date(scheduledTime)
      newTime.setHours(11, 0, 0, 0)

      const appointment2 = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: newTime.toISOString(),
      })

      await expect(
        appointmentService.reschedule(appointment2.id, scheduledTime.toISOString())
      ).rejects.toThrow('Horário com conflito com outro agendamento')
    })
  })

  describe('getProfessionals', () => {
    it('should return all professionals', async () => {
      const professionals = await appointmentService.getProfessionals()

      expect(professionals).toBeDefined()
      expect(professionals.length).toBeGreaterThan(0)
    })
  })

  describe('getAvailableSlots', () => {
    it('should return empty slots for day without schedule', async () => {
      const result = await appointmentService.getAvailableSlots(
        testProfessionalId,
        new Date('2025-01-01').toISOString()
      )

      expect(result.slots).toBeDefined()
    })

    it('should return available slots for day with schedule', async () => {
      const today = new Date()
      const dayOfWeek = today.getDay()

      await prisma.professionalSchedule.deleteMany({
        where: {
          professionalId: testProfessionalId,
          dayOfWeek,
        },
      })

      await prisma.professionalSchedule.create({
        data: {
          professionalId: testProfessionalId,
          dayOfWeek,
          startTime: '09:00',
          endTime: '10:00',
          isActive: true,
        },
      })

      const result = await appointmentService.getAvailableSlots(
        testProfessionalId,
        today.toISOString()
      )

      expect(result.slots).toBeDefined()
      expect(result.slots.length).toBeGreaterThan(0)
    })
  })

  describe('delete', () => {
    it('should delete an appointment', async () => {
      const appointment = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      await appointmentService.delete(appointment.id)

      const found = await appointmentService.findById(appointment.id)
      expect(found).toBeNull()
    })
  })
})
