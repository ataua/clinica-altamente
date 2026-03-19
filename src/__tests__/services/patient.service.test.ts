import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { patientService } from '@/services/patient.service'
import { testPrisma, cleanupDatabase, uniqueEmail } from '../setup'

describe('PatientService', () => {
  beforeAll(async () => {
    await testPrisma.$connect()
  })

  afterAll(async () => {
    await testPrisma.$disconnect()
  })

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
  })

  describe('findAll', () => {
    it('should return patients with pagination', async () => {
      const result = await patientService.findAll({ page: 1, limit: 10 })

      expect(result.patients).toBeDefined()
      expect(result.pagination).toBeDefined()
      expect(result.pagination.page).toBe(1)
    })
  })

  describe('findByCpf', () => {
    it('should return null for non-existent CPF', async () => {
      const result = await patientService.findByCpf('00000000000')
      expect(result).toBeNull()
    })
  })
})
