import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { testPrisma } from './setup'
import { hashPassword } from '@/lib/bcrypt'

describe('Professional', () => {
  let userId: string

  beforeEach(async () => {
    const password = await hashPassword('testpassword123')
    const user = await testPrisma.user.create({
      data: {
        email: `professional_${Date.now()}@test.com`,
        name: 'Test Professional',
        password,
        role: 'PROFESSIONAL',
      },
    })
    userId = user.id
  })

  afterEach(async () => {
    await testPrisma.professional.deleteMany({
      where: { userId },
    })
    await testPrisma.user.delete({
      where: { id: userId },
    })
  })

  it('should create a professional', async () => {
    const professional = await testPrisma.professional.create({
      data: {
        userId,
        specialty: 'Psicologia',
        licenseNumber: 'CRP-12345',
        bio: 'Especialista em psicologia clínica',
      },
    })

    expect(professional).toBeDefined()
    expect(professional.userId).toBe(userId)
    expect(professional.specialty).toBe('Psicologia')
    expect(professional.licenseNumber).toBe('CRP-12345')
    expect(professional.isActive).toBe(true)
  })

  it('should read a professional', async () => {
    const created = await testPrisma.professional.create({
      data: {
        userId,
        specialty: 'Pedagogia',
        licenseNumber: 'PED-54321',
      },
    })

    const professional = await testPrisma.professional.findUnique({
      where: { id: created.id },
    })

    expect(professional).toBeDefined()
    expect(professional?.id).toBe(created.id)
    expect(professional?.specialty).toBe('Pedagogia')
  })

  it('should update a professional', async () => {
    const professional = await testPrisma.professional.create({
      data: {
        userId,
        specialty: 'Fonoaudiologia',
      },
    })

    const updated = await testPrisma.professional.update({
      where: { id: professional.id },
      data: {
        specialty: 'Fonoaudiologia Clínica',
        bio: 'Atualizado',
      },
    })

    expect(updated.specialty).toBe('Fonoaudiologia Clínica')
    expect(updated.bio).toBe('Atualizado')
  })

  it('should delete a professional', async () => {
    const professional = await testPrisma.professional.create({
      data: {
        userId,
        specialty: 'Terapia Ocupacional',
      },
    })

    await testPrisma.professional.delete({
      where: { id: professional.id },
    })

    const deleted = await testPrisma.professional.findUnique({
      where: { id: professional.id },
    })

    expect(deleted).toBeNull()
  })

  it('should find professionals by specialty', async () => {
    await testPrisma.professional.create({
      data: {
        userId,
        specialty: 'Psicopedagogia',
        isActive: true,
      },
    })

    const professionals = await testPrisma.professional.findMany({
      where: { specialty: 'Psicopedagogia' },
    })

    expect(professionals.length).toBeGreaterThan(0)
  })

  it('should create professional schedule', async () => {
    const professional = await testPrisma.professional.create({
      data: {
        userId,
        specialty: 'Psicologia',
      },
    })

    const schedule = await testPrisma.professionalSchedule.create({
      data: {
        professionalId: professional.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
      },
    })

    expect(schedule).toBeDefined()
    expect(schedule.professionalId).toBe(professional.id)
    expect(schedule.dayOfWeek).toBe(1)
    expect(schedule.startTime).toBe('09:00')
    expect(schedule.endTime).toBe('17:00')
  })
})
