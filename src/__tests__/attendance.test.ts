import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { testPrisma } from './setup'
import { hashPassword } from '@/lib/bcrypt'

describe('Attendance', () => {
  let patientUserId: string
  let professionalUserId: string
  let patientId: string
  let professionalId: string
  let appointmentTypeId: string
  let appointmentId: string

  beforeEach(async () => {
    const password = await hashPassword('testpassword123')

    const patientUser = await testPrisma.user.create({
      data: {
        email: `patient_att_${Date.now()}@test.com`,
        name: 'Test Patient',
        password,
        role: 'PATIENT',
      },
    })
    patientUserId = patientUser.id

    const professionalUser = await testPrisma.user.create({
      data: {
        email: `professional_att_${Date.now()}@test.com`,
        name: 'Test Professional',
        password,
        role: 'PROFESSIONAL',
      },
    })
    professionalUserId = professionalUser.id

    const patient = await testPrisma.patient.create({
      data: {
        userId: patientUserId,
        dateOfBirth: new Date('2010-01-01'),
      },
    })
    patientId = patient.id

    const professional = await testPrisma.professional.create({
      data: {
        userId: professionalUserId,
        specialty: 'Psicologia',
      },
    })
    professionalId = professional.id

    const appointmentType = await testPrisma.appointmentType.create({
      data: {
        name: 'Consulta Psicológica',
        durationMinutes: 60,
      },
    })
    appointmentTypeId = appointmentType.id

    const scheduledDateTime = new Date()
    scheduledDateTime.setDate(scheduledDateTime.getDate() + 1)

    const endDateTime = new Date(scheduledDateTime)
    endDateTime.setMinutes(endDateTime.getMinutes() + 60)

    const appointment = await testPrisma.appointment.create({
      data: {
        patientId,
        professionalId,
        appointmentTypeId,
        scheduledDateTime,
        endDateTime,
        status: 'COMPLETED',
      },
    })
    appointmentId = appointment.id
  })

  afterEach(async () => {
    await testPrisma.attendance.deleteMany({
      where: { appointmentId },
    })
    await testPrisma.appointment.deleteMany({
      where: { id: appointmentId },
    })
    await testPrisma.patient.deleteMany({
      where: { userId: patientUserId },
    })
    await testPrisma.professional.deleteMany({
      where: { userId: professionalUserId },
    })
    await testPrisma.appointmentType.delete({
      where: { id: appointmentTypeId },
    })
    await testPrisma.user.delete({
      where: { id: patientUserId },
    })
    await testPrisma.user.delete({
      where: { id: professionalUserId },
    })
  })

  it('should create an attendance', async () => {
    const startTime = new Date()
    startTime.setDate(startTime.getDate() - 1)
    startTime.setHours(10, 0, 0, 0)

    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + 60)

    const attendance = await testPrisma.attendance.create({
      data: {
        appointmentId,
        patientId,
        professionalId,
        startTime,
        endTime,
        status: 'COMPLETED',
        notes: 'Atendimento realizado com sucesso',
      },
    })

    expect(attendance).toBeDefined()
    expect(attendance.appointmentId).toBe(appointmentId)
    expect(attendance.patientId).toBe(patientId)
    expect(attendance.professionalId).toBe(professionalId)
    expect(attendance.status).toBe('COMPLETED')
  })

  it('should read an attendance', async () => {
    const startTime = new Date()
    startTime.setDate(startTime.getDate() - 1)

    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + 60)

    const created = await testPrisma.attendance.create({
      data: {
        appointmentId,
        patientId,
        professionalId,
        startTime,
        endTime,
      },
    })

    const attendance = await testPrisma.attendance.findUnique({
      where: { id: created.id },
    })

    expect(attendance).toBeDefined()
    expect(attendance?.id).toBe(created.id)
  })

  it('should update attendance status', async () => {
    const startTime = new Date()
    startTime.setDate(startTime.getDate() - 1)

    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + 60)

    const attendance = await testPrisma.attendance.create({
      data: {
        appointmentId,
        patientId,
        professionalId,
        startTime,
        endTime,
        status: 'IN_PROGRESS',
      },
    })

    const updated = await testPrisma.attendance.update({
      where: { id: attendance.id },
      data: {
        status: 'COMPLETED',
        observations: 'Paciente apresentou progresso significativo',
      },
    })

    expect(updated.status).toBe('COMPLETED')
    expect(updated.observations).toBe('Paciente apresentou progresso significativo')
  })

  it('should find attendances by patient', async () => {
    const startTime = new Date()
    startTime.setDate(startTime.getDate() - 1)

    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + 60)

    await testPrisma.attendance.create({
      data: {
        appointmentId,
        patientId,
        professionalId,
        startTime,
        endTime,
        status: 'COMPLETED',
      },
    })

    const attendances = await testPrisma.attendance.findMany({
      where: { patientId },
    })

    expect(attendances.length).toBeGreaterThan(0)
  })

  it('should find attendances by professional', async () => {
    const startTime = new Date()
    startTime.setDate(startTime.getDate() - 1)

    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + 60)

    await testPrisma.attendance.create({
      data: {
        appointmentId,
        patientId,
        professionalId,
        startTime,
        endTime,
        status: 'COMPLETED',
      },
    })

    const attendances = await testPrisma.attendance.findMany({
      where: { professionalId },
    })

    expect(attendances.length).toBeGreaterThan(0)
  })
})
