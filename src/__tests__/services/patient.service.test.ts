import { describe, it, expect, beforeEach } from 'bun:test'
import { patientService } from '@/services/patient.service'
import { cleanupDatabase, uniqueEmail } from '../setup'

describe('PatientService', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  describe('create', () => {
    it('should create a patient', async () => {
      const patient = await patientService.create({
        name: 'Test Patient',
        email: uniqueEmail(),
        phone: '11999999999',
        dateOfBirth: '2010-01-01',
      })

      expect(patient).toBeDefined()
      expect(patient.phone).toBe('11999999999')
    })

    it('should create a patient with responsible contact', async () => {
      const patient = await patientService.create({
        name: 'Test Patient',
        email: uniqueEmail(),
        phone: '11999999999',
        responsibleContact: {
          name: 'Responsible Name',
          email: uniqueEmail(),
          phone: '11888888888',
          relationship: 'Mãe',
        },
      })

      expect(patient).toBeDefined()
      expect(patient.emergencyPhone).toBe('11888888888')
    })

    it('should create a patient with address', async () => {
      const patient = await patientService.create({
        name: 'Test Patient',
        email: uniqueEmail(),
        address: {
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Bairro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
        },
      })

      expect(patient).toBeDefined()
      expect(patient.address).toBeDefined()
    })
  })

  describe('findAll', () => {
    it('should return patients with pagination', async () => {
      const result = await patientService.findAll({ page: 1, limit: 10 })

      expect(result.patients).toBeDefined()
      expect(result.pagination).toBeDefined()
      expect(result.pagination.page).toBe(1)
    })

    it('should search patients by name', async () => {
      await patientService.create({
        name: 'Unique Search Name',
        email: uniqueEmail(),
      })

      const result = await patientService.findAll({
        page: 1,
        limit: 10,
        search: 'Unique Search',
      })

      expect(result.patients.length).toBeGreaterThan(0)
    })

    it('should return empty list when no patients exist', async () => {
      const result = await patientService.findAll({ page: 1, limit: 10 })

      expect(result.patients).toBeDefined()
      expect(result.patients.length).toBe(0)
    })

    it('should include pagination metadata', async () => {
      const result = await patientService.findAll({ page: 2, limit: 5 })

      expect(result.pagination.limit).toBe(5)
      expect(result.pagination.page).toBe(2)
    })
  })

  describe('findById', () => {
    it('should return patient by id', async () => {
      const created = await patientService.create({
        name: 'Find Test',
        email: uniqueEmail(),
        phone: '11999999999',
      })

      const found = await patientService.findById(created.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.phone).toBe('11999999999')
    })

    it('should return null for non-existent id', async () => {
      const found = await patientService.findById('non-existent-id')

      expect(found).toBeNull()
    })

    it('should include user data', async () => {
      const created = await patientService.create({
        name: 'User Data Test',
        email: uniqueEmail(),
      })

      const found = await patientService.findById(created.id)

      expect(found?.user).toBeDefined()
      expect(found?.name).toBe('User Data Test')
    })
  })

  describe('findByCpf', () => {
    it('should return null for non-existent CPF', async () => {
      const result = await patientService.findByCpf('00000000000')
      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update patient name', async () => {
      const created = await patientService.create({
        name: 'Original Name',
        email: uniqueEmail(),
      })

      const updated = await patientService.update(created.id, {
        name: 'Updated Name',
      })

      expect(updated).toBeDefined()
    })

    it('should throw for non-existent patient', async () => {
      await expect(
        patientService.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('Patient not found')
    })

    it('should update patient phone', async () => {
      const created = await patientService.create({
        name: 'Phone Update Test',
        email: uniqueEmail(),
        phone: '11999999999',
      })

      await patientService.update(created.id, {
        phone: '11888888888',
      })

      const found = await patientService.findById(created.id)
      expect(found?.phone).toBe('11888888888')
    })
  })

  describe('delete', () => {
    it('should delete a patient', async () => {
      const created = await patientService.create({
        name: 'Delete Test',
        email: uniqueEmail(),
      })

      await patientService.delete(created.id)

      const found = await patientService.findById(created.id)
      expect(found).toBeNull()
    })
  })
})
