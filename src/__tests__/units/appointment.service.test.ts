import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { appointmentService } from '@/services/appointment.service'
import { patientService } from '@/services/patient.service'
import { prisma } from '@/lib/prisma'

describe('AppointmentService', () => {
  let testUserId: string
  let testProfessionalUserId: string
  let testProfessionalId: string
  let testAppointmentTypeId: string
  let testPatientId: string

  const uniqueEmail = () => `test_${Date.now()}_${Math.random()}@test.com`

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
    testProfessionalUserId = user.id

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
    await prisma.appointment.deleteMany({})
    await prisma.patient.deleteMany({})
    await prisma.professionalSchedule.deleteMany({})
    await prisma.professional.deleteMany({})
    await prisma.appointmentType.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await prisma.appointment.deleteMany({})
    await prisma.patient.deleteMany({})

    const user = await prisma.user.create({
      data: {
        name: 'Test Patient',
        email: uniqueEmail(),
        password: 'hashed',
        role: 'PATIENT',
      },
    })
    testUserId = user.id

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
      expect(appointment.notes).toBe('Test appointment')
    })

    it('should throw error for invalid appointment type', async () => {
      await expect(
        appointmentService.create({
          patientId: testPatientId,
          professionalId: testProfessionalId,
          appointmentTypeId: 'invalid-id',
          scheduledDateTime: new Date().toISOString(),
        })
      ).rejects.toThrow('Tipo de agendamento não encontrado')
    })

    it('should throw error for conflicting appointment', async () => {
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
      ).rejects.toThrow('Horário conflictado')
    })

    it('should allow overlapping appointments for different professionals', async () => {
      const scheduledTime = new Date(Date.now() + 86400000)
      scheduledTime.setHours(10, 0, 0, 0)

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

      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: scheduledTime.toISOString(),
      })

      const appointment2 = await appointmentService.create({
        patientId: testPatientId,
        professionalId: professional2.id,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: scheduledTime.toISOString(),
      })

      expect(appointment2).toBeDefined()
    })
  })

  describe('findAll', () => {
    it('should return all appointments without filters', async () => {
      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const result = await appointmentService.findAll({ page: 1, limit: 10 })

      expect(result.appointments.length).toBeGreaterThan(0)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)
    })

    it('should filter appointments by date range', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 30)

      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: futureDate.toISOString(),
      })

      const result = await appointmentService.findAll({
        page: 1,
        limit: 10,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 60).toISOString(),
      })

      expect(result.appointments.length).toBeGreaterThanOrEqual(1)
    })

    it('should filter by professional', async () => {
      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const result = await appointmentService.findAll({
        page: 1,
        limit: 10,
        professionalId: testProfessionalId,
      })

      expect(result.appointments.length).toBeGreaterThan(0)
    })

    it('should return pagination info', async () => {
      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const result = await appointmentService.findAll({ page: 1, limit: 1 })

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(1)
      expect(result.pagination.total).toBeGreaterThan(0)
    })
  })

  describe('findById', () => {
    it('should find appointment by id', async () => {
      const created = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const found = await appointmentService.findById(created.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
    })

    it('should return null for non-existent appointment', async () => {
      const found = await appointmentService.findById('non-existent-id')

      expect(found).toBeNull()
    })
  })

  describe('update', () => {
    it('should update appointment status', async () => {
      const created = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const updated = await appointmentService.update(created.id, {
        status: 'CONFIRMED',
      })

      expect(updated.status).toBe('CONFIRMED')
    })

    it('should update appointment notes', async () => {
      const created = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const updated = await appointmentService.update(created.id, {
        notes: 'Updated notes',
      })

      expect(updated.notes).toBe('Updated notes')
    })

    it('should throw error for non-existent appointment', async () => {
      await expect(
        appointmentService.update('non-existent-id', { status: 'CANCELLED' })
      ).rejects.toThrow('Agendamento não encontrado')
    })
  })

  describe('delete', () => {
    it('should delete appointment', async () => {
      const created = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      await appointmentService.delete(created.id)

      const found = await appointmentService.findById(created.id)
      expect(found).toBeNull()
    })
  })

  describe('cancel', () => {
    it('should cancel an appointment', async () => {
      const created = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      const cancelled = await appointmentService.cancel(created.id, 'Paciente desistiu')

      expect(cancelled.status).toBe('CANCELLED')
      expect(cancelled.cancellationReason).toBe('Paciente desistiu')
    })

    it('should throw error when cancelling already cancelled appointment', async () => {
      const created = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      await appointmentService.cancel(created.id, 'Primeiro cancelamento')

      await expect(
        appointmentService.cancel(created.id, 'Segundo cancelamento')
      ).rejects.toThrow('Agendamento já está cancelado')
    })

    it('should throw error when cancelling completed appointment', async () => {
      const created = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      await appointmentService.update(created.id, { status: 'COMPLETED' })

      await expect(
        appointmentService.cancel(created.id, 'Cancelar depois de concluído')
      ).rejects.toThrow('Não é possível cancelar um agendamento concluído')
    })

    it('should throw error for non-existent appointment', async () => {
      await expect(
        appointmentService.cancel('non-existent-id', 'Motivo')
      ).rejects.toThrow('Agendamento não encontrado')
    })
  })

  describe('reschedule', () => {
    it('should reschedule an appointment', async () => {
      const originalDateTime = new Date(Date.now() + 86400000)
      originalDateTime.setHours(10, 0, 0, 0)

      const created = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: originalDateTime.toISOString(),
      })

      const newDateTime = new Date(Date.now() + 86400000 * 2)
      newDateTime.setHours(14, 0, 0, 0)

      const rescheduled = await appointmentService.reschedule(
        created.id,
        newDateTime.toISOString()
      )

      expect(rescheduled.status).toBe('SCHEDULED')
      expect(new Date(rescheduled.scheduledDateTime).getHours()).toBe(14)
    })

    it('should throw error when rescheduling cancelled appointment', async () => {
      const created = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      await appointmentService.cancel(created.id, 'Cancelado')

      const newDateTime = new Date(Date.now() + 86400000 * 2)

      await expect(
        appointmentService.reschedule(created.id, newDateTime.toISOString())
      ).rejects.toThrow('Não é possível reagendar um agendamento cancelado')
    })

    it('should throw error when rescheduling completed appointment', async () => {
      const created = await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
      })

      await appointmentService.update(created.id, { status: 'COMPLETED' })

      const newDateTime = new Date(Date.now() + 86400000 * 2)

      await expect(
        appointmentService.reschedule(created.id, newDateTime.toISOString())
      ).rejects.toThrow('Não é possível reagendar um agendamento concluído')
    })

    it('should throw error for conflicting time slot', async () => {
      const scheduledTime1 = new Date(Date.now() + 86400000)
      scheduledTime1.setHours(10, 0, 0, 0)

      const scheduledTime2 = new Date(Date.now() + 86400000)
      scheduledTime2.setHours(14, 0, 0, 0)

      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: scheduledTime1.toISOString(),
      })

      const user2 = await prisma.user.create({
        data: {
          name: 'Patient 2',
          email: uniqueEmail(),
          password: 'hashed',
          role: 'PATIENT',
        },
      })

      const patient2 = await prisma.patient.create({
        data: {
          userId: user2.id,
          phone: '11999999999',
        },
      })

      const appointment2 = await appointmentService.create({
        patientId: patient2.id,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: scheduledTime2.toISOString(),
      })

      await expect(
        appointmentService.reschedule(appointment2.id, scheduledTime1.toISOString())
      ).rejects.toThrow('Horário conflictado')
    })

    it('should throw error for non-existent appointment', async () => {
      const newDateTime = new Date(Date.now() + 86400000 * 2)

      await expect(
        appointmentService.reschedule('non-existent-id', newDateTime.toISOString())
      ).rejects.toThrow('Agendamento não encontrado')
    })
  })

  describe('getAppointmentTypes', () => {
    it('should return active appointment types', async () => {
      const types = await appointmentService.getAppointmentTypes()

      expect(types.length).toBeGreaterThan(0)
      expect(types[0].isActive).toBe(true)
    })
  })

  describe('getProfessionals', () => {
    it('should return professionals with user info', async () => {
      const professionals = await appointmentService.getProfessionals()

      expect(professionals.length).toBeGreaterThan(0)
      expect(professionals[0].user).toBeDefined()
      expect(professionals[0].user.name).toBeDefined()
    })
  })

  describe('getAvailableSlots', () => {
    it('should return available slots for a day with schedule', async () => {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7
      const nextMonday = new Date(today)
      nextMonday.setDate(today.getDate() + daysUntilMonday)
      nextMonday.setHours(0, 0, 0, 0)

      const slots = await appointmentService.getAvailableSlots(
        testProfessionalId,
        nextMonday.toISOString()
      )

      expect(slots).toBeDefined()
      expect(Array.isArray(slots.slots)).toBe(true)
      expect(slots.slots.length).toBeGreaterThan(0)
    })

    it('should return message when professional does not work on that day', async () => {
      const user3 = await prisma.user.create({
        data: {
          name: 'Professional 3',
          email: uniqueEmail(),
          password: 'hashed',
          role: 'PROFESSIONAL',
        },
      })

      const professional3 = await prisma.professional.create({
        data: {
          userId: user3.id,
          specialty: 'Psicologia',
          licenseNumber: '67890',
        },
      })

      const targetDate = new Date(Date.now() + 86400000)
      targetDate.setHours(0, 0, 0, 0)

      const slots = await appointmentService.getAvailableSlots(
        professional3.id,
        targetDate.toISOString()
      )

      expect(slots.message).toBe('Profissional não atende neste dia')
    })

    it('should exclude booked slots', async () => {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7
      const nextMonday = new Date(today)
      nextMonday.setDate(today.getDate() + daysUntilMonday)
      nextMonday.setHours(10, 0, 0, 0)

      await appointmentService.create({
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
        scheduledDateTime: nextMonday.toISOString(),
      })

      const slots = await appointmentService.getAvailableSlots(
        testProfessionalId,
        nextMonday.toISOString()
      )

      expect(slots.slots.length).toBeLessThan(17)
    })
  })
})
