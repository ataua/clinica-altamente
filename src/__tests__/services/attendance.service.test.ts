import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { attendanceService } from '@/services/attendance.service'
import { prisma, cleanupDatabase, uniqueEmail } from '../setup'
import { AttendanceStatus } from '@prisma/client'

describe('AttendanceService', () => {
  let testPatientId: string
  let testProfessionalId: string
  let testAppointmentId: string

  beforeAll(async () => {
    await prisma.$connect()

    const patientUser = await prisma.user.create({
      data: {
        name: 'Patient',
        email: uniqueEmail(),
        password: 'hashed',
        role: 'PATIENT',
      },
    })
    const patient = await prisma.patient.create({
      data: { userId: patientUser.id },
    })
    testPatientId = patient.id

    const profUser = await prisma.user.create({
      data: {
        name: 'Professional',
        email: uniqueEmail(),
        password: 'hashed',
        role: 'PROFESSIONAL',
      },
    })
    const professional = await prisma.professional.create({
      data: { userId: profUser.id },
    })
    testProfessionalId = professional.id

    const appointment = await prisma.appointment.create({
      data: {
        patientId: testPatientId,
        professionalId: testProfessionalId,
        scheduledDateTime: new Date(Date.now() + 86400000),
        endDateTime: new Date(Date.now() + 86400000 + 3600000),
        status: 'SCHEDULED',
      },
    })
    testAppointmentId = appointment.id
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  beforeEach(async () => {
    await prisma.attendance.deleteMany()
  })

  describe('create', () => {
    it('should create an attendance', async () => {
      const attendance = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
      })

      expect(attendance).toBeDefined()
      expect(attendance.appointmentId).toBe(testAppointmentId)
      expect(attendance.status).toBe('PENDING')
    })

    it('should create an attendance with notes and observations', async () => {
      const attendance = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
        notes: 'Initial notes',
        observations: 'Observations',
      })

      expect(attendance.notes).toBe('Initial notes')
      expect(attendance.observations).toBe('Observations')
    })

    it('should throw for non-existent appointment', async () => {
      await expect(
        attendanceService.create({
          appointmentId: 'non-existent-id',
          patientId: testPatientId,
          professionalId: testProfessionalId,
          startTime: new Date(),
        })
      ).rejects.toThrow('Agendamento não encontrado')
    })

    it('should calculate end time based on default duration', async () => {
      const attendance = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date('2025-01-01T10:00:00Z'),
      })

      expect(attendance.endTime).toBeDefined()
      expect(new Date(attendance.endTime!).getTime()).toBe(new Date('2025-01-01T11:00:00Z').getTime())
    })
  })

  describe('findAll', () => {
    it('should return attendances with pagination', async () => {
      const result = await attendanceService.findAll({ page: 1, limit: 10 })

      expect(result.attendances).toBeDefined()
      expect(result.pagination).toBeDefined()
    })

    it('should filter by patientId', async () => {
      await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
      })

      const result = await attendanceService.findAll({
        page: 1,
        limit: 10,
        patientId: testPatientId,
      })

      expect(result.attendances.length).toBeGreaterThan(0)
    })

    it('should filter by status', async () => {
      const attendance = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
      })

      await attendanceService.start(attendance.id)

      const result = await attendanceService.findAll({
        page: 1,
        limit: 10,
        status: AttendanceStatus.IN_PROGRESS,
      })

      expect(result.attendances.length).toBeGreaterThan(0)
      expect(result.attendances[0].status).toBe('IN_PROGRESS')
    })

    it('should filter by professionalId', async () => {
      const result = await attendanceService.findAll({
        page: 1,
        limit: 10,
        professionalId: testProfessionalId,
      })

      expect(result.attendances).toBeDefined()
    })
  })

  describe('findById', () => {
    it('should return attendance by id', async () => {
      const created = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
      })

      const found = await attendanceService.findById(created.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
    })

    it('should return null for non-existent id', async () => {
      const found = await attendanceService.findById('non-existent-id')

      expect(found).toBeNull()
    })

    it('should include related data', async () => {
      const created = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
      })

      const found = await attendanceService.findById(created.id)

      expect(found?.appointment).toBeDefined()
      expect(found?.patient).toBeDefined()
      expect(found?.professional).toBeDefined()
    })
  })

  describe('update', () => {
    it('should update attendance notes', async () => {
      const created = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
      })

      const updated = await attendanceService.update(created.id, {
        notes: 'Updated notes',
      })

      expect(updated.notes).toBe('Updated notes')
    })

    it('should update diagnosis and treatment plan', async () => {
      const created = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
      })

      const updated = await attendanceService.update(created.id, {
        diagnosis: 'Anxiety disorder',
        treatmentPlan: 'Weekly sessions',
      })

      expect(updated.diagnosis).toBe('Anxiety disorder')
      expect(updated.treatmentPlan).toBe('Weekly sessions')
    })

    it('should throw for non-existent id', async () => {
      await expect(
        attendanceService.update('non-existent-id', { notes: 'Test' })
      ).rejects.toThrow()
    })
  })

  describe('start', () => {
    it('should start an attendance', async () => {
      const attendance = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
      })

      const started = await attendanceService.start(attendance.id)

      expect(started.status).toBe('IN_PROGRESS')
    })

    it('should throw for non-existent id', async () => {
      await expect(attendanceService.start('non-existent-id')).rejects.toThrow()
    })
  })

  describe('complete', () => {
    it('should complete an attendance with diagnosis', async () => {
      const attendance = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
      })

      const completed = await attendanceService.complete(attendance.id, {
        notes: 'Session notes',
        diagnosis: 'Diagnosis',
        treatmentPlan: 'Treatment plan',
      })

      expect(completed.status).toBe('COMPLETED')
    })

    it('should set end time when completing', async () => {
      const attendance = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
      })

      const completed = await attendanceService.complete(attendance.id)

      expect(completed.endTime).toBeDefined()
    })

    it('should throw for non-existent id', async () => {
      await expect(
        attendanceService.complete('non-existent-id')
      ).rejects.toThrow()
    })
  })

  describe('findByAppointmentId', () => {
    it('should return attendance by appointment id', async () => {
      const created = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
      })

      const found = await attendanceService.findByAppointmentId(testAppointmentId)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
    })

    it('should return null for non-existent appointment', async () => {
      const found = await attendanceService.findByAppointmentId('non-existent-id')

      expect(found).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete an attendance', async () => {
      const created = await attendanceService.create({
        appointmentId: testAppointmentId,
        patientId: testPatientId,
        professionalId: testProfessionalId,
        startTime: new Date(),
      })

      await attendanceService.delete(created.id)

      const found = await attendanceService.findById(created.id)
      expect(found).toBeNull()
    })
  })
})
