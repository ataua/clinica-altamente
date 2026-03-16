import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { patientService } from '@/services/patient.service'
import { responsibleContactService } from '@/services/responsible.service'
import { prisma } from '@/lib/prisma'

const testPatient = {
  name: 'Test Patient',
  email: 'patient@test.com',
  phone: '11999999999',
  cpf: '12345678901',
}

const testResponsible = {
  name: 'Test Responsible',
  email: 'responsible@test.com',
  phone: '11888888888',
  cpf: '98765432109',
  relationship: 'Pai',
}

describe('PatientService', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await prisma.appointment.deleteMany({})
    await prisma.patient.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.responsibleContact.deleteMany({})
  })

  describe('create', () => {
    it('should create a new patient without responsible', async () => {
      const patient = await patientService.create(testPatient)

      expect(patient).toBeDefined()
      expect(patient.phone).toBe(testPatient.phone)
    })

    it('should create a new patient with responsible contact', async () => {
      const patient = await patientService.create({
        ...testPatient,
        email: 'patient2@test.com',
        cpf: '12345678902',
        responsibleContact: testResponsible,
      })

      expect(patient).toBeDefined()
    })
  })

  describe('findAll', () => {
    it('should return all patients without filters', async () => {
      await patientService.create(testPatient)
      await patientService.create({
        ...testPatient,
        email: 'patient3@test.com',
        cpf: '12345678903',
      })

      const result = await patientService.findAll({})

      expect(result.patients.length).toBeGreaterThanOrEqual(2)
    })

    it('should filter by search term', async () => {
      await patientService.create(testPatient)

      const result = await patientService.findAll({ search: 'Test' })

      expect(result.patients.length).toBeGreaterThan(0)
    })

    it('should return pagination info', async () => {
      await patientService.create(testPatient)

      const result = await patientService.findAll({ page: 1, limit: 1 })

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(1)
      expect(result.pagination.total).toBeGreaterThan(0)
    })
  })

  describe('findById', () => {
    it('should find patient by id', async () => {
      const created = await patientService.create({
        name: 'Find Test',
        email: 'find@test.com',
        phone: '11777777777',
        cpf: '11122233344',
      })
      
      const patient = await patientService.findById(created.id)

      expect(patient).toBeDefined()
      expect(patient?.phone).toBe('11777777777')
    })
  })

  describe('update', () => {
    it('should update patient phone', async () => {
      const created = await patientService.create({
        name: 'Update Test',
        email: 'update@test.com',
        phone: '11666666666',
        cpf: '55566677788',
      })
      
      const updated = await patientService.update(created.id, {
        phone: '11999999999',
      })

      expect(updated.phone).toBe('11999999999')
    })
  })

  describe('delete', () => {
    it('should delete patient', async () => {
      const created = await patientService.create({
        name: 'Delete Test',
        email: 'delete@test.com',
        phone: '11333333333',
        cpf: '77766655544',
      })
      
      await patientService.delete(created.id)

      const patient = await patientService.findById(created.id)
      expect(patient).toBeNull()
    })
  })
})

describe('ResponsibleContactService', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  beforeEach(async () => {
    await prisma.responsibleContact.deleteMany({})
  })

  describe('create', () => {
    it('should create a new responsible contact', async () => {
      const responsible = await responsibleContactService.create(testResponsible)

      expect(responsible).toBeDefined()
      expect(responsible.name).toBe(testResponsible.name)
      expect(responsible.phone).toBe(testResponsible.phone)
    })
  })

  describe('findAll', () => {
    it('should return all responsibles', async () => {
      await responsibleContactService.create(testResponsible)

      const result = await responsibleContactService.findAll({})

      expect(result.responsibles.length).toBeGreaterThan(0)
    })

    it('should filter by search', async () => {
      await responsibleContactService.create(testResponsible)

      const result = await responsibleContactService.findAll({ search: 'Test' })

      expect(result.responsibles.length).toBeGreaterThan(0)
    })
  })

  describe('findByPhone', () => {
    it('should find responsible by phone', async () => {
      await responsibleContactService.create(testResponsible)

      const responsible = await responsibleContactService.findByPhone('11888888888')

      expect(responsible).toBeDefined()
      expect(responsible?.name).toBe('Test Responsible')
    })
  })

  describe('findByCpf', () => {
    it('should find responsible by cpf', async () => {
      await responsibleContactService.create(testResponsible)

      const responsible = await responsibleContactService.findByCpf('98765432109')

      expect(responsible).toBeDefined()
      expect(responsible?.name).toBe('Test Responsible')
    })
  })
})
