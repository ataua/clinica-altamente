import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { attendanceService } from '@/services/attendance.service'
import { prisma, cleanupDatabase, uniqueEmail } from '../setup'

describe('AttendanceService', () => {
  let testPatientId: string
  let testProfessionalId: string
  let testAppointmentTypeId: string
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
      data: { userId: profUser.id, specialty: 'Psicologia' },
    })
    testProfessionalId = professional.id

    const aptType = await prisma.appointmentType.create({
      data: { name: 'Avaliação', durationMinutes: 60, isActive: true },
    })
    testAppointmentTypeId = aptType.id

    const appointment = await prisma.appointment.create({
      data: {
        patientId: testPatientId,
        professionalId: testProfessionalId,
        appointmentTypeId: testAppointmentTypeId,
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
  })
})
