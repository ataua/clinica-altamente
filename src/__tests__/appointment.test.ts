import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { testPrisma } from './setup'
import { hashPassword } from '@/lib/bcrypt'

describe('Appointment', () => {
  let patientUserId: string
  let professionalUserId: string
  let patientId: string
  let professionalId: string
  let appointmentTypeId: string

  beforeEach(async () => {
    const password = await hashPassword('testpassword123')

    const patientUser = await testPrisma.user.create({
      data: {
        email: `patient_appt_${Date.now()}@test.com`,
        name: 'Test Patient',
        password,
        role: 'PATIENT',
      },
    })
    patientUserId = patientUser.id

    const professionalUser = await testPrisma.user.create({
      data: {
        email: `professional_appt_${Date.now()}@test.com`,
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
        description: 'Atendimento psicológico padrão',
        durationMinutes: 60,
      },
    })
    appointmentTypeId = appointmentType.id
  })

  afterEach(async () => {
    await testPrisma.appointment.deleteMany({
      where: { patientId },
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

  it('should create an appointment', async () => {
    const scheduledDateTime = new Date()
    scheduledDateTime.setDate(scheduledDateTime.getDate() + 1)
    scheduledDateTime.setHours(10, 0, 0, 0)

    const endDateTime = new Date(scheduledDateTime)
    endDateTime.setMinutes(endDateTime.getMinutes() + 60)

    const appointment = await testPrisma.appointment.create({
      data: {
        patientId,
        professionalId,
        appointmentTypeId,
        scheduledDateTime,
        endDateTime,
        status: 'SCHEDULED',
      },
    })

    expect(appointment).toBeDefined()
    expect(appointment.patientId).toBe(patientId)
    expect(appointment.professionalId).toBe(professionalId)
    expect(appointment.status).toBe('SCHEDULED')
  })

  it('should read an appointment', async () => {
    const scheduledDateTime = new Date()
    scheduledDateTime.setDate(scheduledDateTime.getDate() + 1)

    const endDateTime = new Date(scheduledDateTime)
    endDateTime.setMinutes(endDateTime.getMinutes() + 60)

    const created = await testPrisma.appointment.create({
      data: {
        patientId,
        professionalId,
        appointmentTypeId,
        scheduledDateTime,
        endDateTime,
      },
    })

    const appointment = await testPrisma.appointment.findUnique({
      where: { id: created.id },
    })

    expect(appointment).toBeDefined()
    expect(appointment?.id).toBe(created.id)
  })

  it('should update appointment status', async () => {
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
        status: 'SCHEDULED',
      },
    })

    const updated = await testPrisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CONFIRMED',
      },
    })

    expect(updated.status).toBe('CONFIRMED')
  })

  it('should cancel an appointment', async () => {
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
      },
    })

    const cancelled = await testPrisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELLED',
        cancellationReason: 'Paciente solicitou cancelamento',
      },
    })

    expect(cancelled.status).toBe('CANCELLED')
    expect(cancelled.cancellationReason).toBe('Paciente solicitou cancelamento')
  })

  it('should find appointments by status', async () => {
    const scheduledDateTime = new Date()
    scheduledDateTime.setDate(scheduledDateTime.getDate() + 1)

    const endDateTime = new Date(scheduledDateTime)
    endDateTime.setMinutes(endDateTime.getMinutes() + 60)

    await testPrisma.appointment.create({
      data: {
        patientId,
        professionalId,
        appointmentTypeId,
        scheduledDateTime,
        endDateTime,
        status: 'SCHEDULED',
      },
    })

    const appointments = await testPrisma.appointment.findMany({
      where: { status: 'SCHEDULED' },
    })

    expect(appointments.length).toBeGreaterThan(0)
  })

  it('should create appointment type', async () => {
    const type = await testPrisma.appointmentType.create({
      data: {
        name: 'Avaliação Fonoaudiológica',
        description: 'Avaliação completa de fala e linguagem',
        durationMinutes: 90,
      },
    })

    expect(type).toBeDefined()
    expect(type.name).toBe('Avaliação Fonoaudiológica')
    expect(type.durationMinutes).toBe(90)
  })
})
