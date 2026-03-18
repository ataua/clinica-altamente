import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { testPrisma } from './setup'
import { hashPassword } from '@/lib/bcrypt'

describe('Patient', () => {
  let userId: string

  beforeEach(async () => {
    const password = await hashPassword('testpassword123')
    const user = await testPrisma.user.create({
      data: {
        email: `patient_${Date.now()}@test.com`,
        name: 'Test Patient',
        password,
        role: 'PATIENT',
      },
    })
    userId = user.id
  })

  afterEach(async () => {
    await testPrisma.patient.deleteMany({
      where: { userId },
    })
    await testPrisma.user.delete({
      where: { id: userId },
    })
  })

  it('should create a patient', async () => {
    const patient = await testPrisma.patient.create({
      data: {
        userId,
        dateOfBirth: new Date('2010-01-01'),
        gender: 'M',
        phone: '(11) 99999-9999',
        address: 'Test Address, 123',
      },
    })

    expect(patient).toBeDefined()
    expect(patient.userId).toBe(userId)
    expect(patient.dateOfBirth).toEqual(new Date('2010-01-01'))
    expect(patient.gender).toBe('M')
    expect(patient.isActive).toBe(true)
  })

  it('should read a patient', async () => {
    const created = await testPrisma.patient.create({
      data: {
        userId,
        dateOfBirth: new Date('2010-01-01'),
        gender: 'F',
        phone: '(11) 88888-8888',
      },
    })

    const patient = await testPrisma.patient.findUnique({
      where: { id: created.id },
    })

    expect(patient).toBeDefined()
    expect(patient?.id).toBe(created.id)
    expect(patient?.gender).toBe('F')
  })

  it('should update a patient', async () => {
    const patient = await testPrisma.patient.create({
      data: {
        userId,
        dateOfBirth: new Date('2010-01-01'),
        phone: '(11) 99999-9999',
      },
    })

    const updated = await testPrisma.patient.update({
      where: { id: patient.id },
      data: {
        phone: '(11) 77777-7777',
        observations: 'Updated observations',
      },
    })

    expect(updated.phone).toBe('(11) 77777-7777')
    expect(updated.observations).toBe('Updated observations')
  })

  it('should delete a patient', async () => {
    const patient = await testPrisma.patient.create({
      data: {
        userId,
        dateOfBirth: new Date('2010-01-01'),
      },
    })

    await testPrisma.patient.delete({
      where: { id: patient.id },
    })

    const deleted = await testPrisma.patient.findUnique({
      where: { id: patient.id },
    })

    expect(deleted).toBeNull()
  })

  it('should find patients by active status', async () => {
    await testPrisma.patient.create({
      data: {
        userId,
        dateOfBirth: new Date('2010-01-01'),
        isActive: true,
      },
    })

    const activePatients = await testPrisma.patient.findMany({
      where: { isActive: true },
    })

    expect(activePatients.length).toBeGreaterThan(0)
  })
})
