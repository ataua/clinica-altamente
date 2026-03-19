import { describe, it, expect, beforeEach } from 'bun:test'
import { userService } from '@/services/user.service'
import { prisma, cleanupDatabase, uniqueEmail } from '../setup'

describe('UserService', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const user = await userService.create({
        name: 'Test User',
        email: uniqueEmail(),
        password: 'plaintext123',
      })

      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
      expect(user.name).toBe('Test User')
      expect(user.email).toBeDefined()
    })

    it('should hash the password', async () => {
      const email = uniqueEmail()
      await userService.create({
        name: 'Test',
        email,
        password: 'plaintext123',
      })

      const dbUser = await prisma.user.findUnique({ where: { email } })
      expect(dbUser?.password).not.toBe('plaintext123')
      expect(dbUser?.password).toMatch(/^\$2[ayb]/)
    })

    it('should default role to PATIENT', async () => {
      const user = await userService.create({
        name: 'Test',
        email: uniqueEmail(),
        password: '123456',
      })

      expect(user.role).toBe('PATIENT')
    })

    it('should accept custom role', async () => {
      const user = await userService.create({
        name: 'Admin',
        email: uniqueEmail(),
        password: '123456',
        role: 'ADMIN',
      })

      expect(user.role).toBe('ADMIN')
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await userService.create({
        name: 'User 1',
        email: uniqueEmail(),
        password: '123456',
        role: 'PATIENT',
      })
      await userService.create({
        name: 'User 2',
        email: uniqueEmail(),
        password: '123456',
        role: 'ADMIN',
      })
    })

    it('should return all users with pagination', async () => {
      const result = await userService.findAll({ page: 1, limit: 10 })

      expect(result.users).toHaveLength(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.total).toBe(2)
    })

    it('should filter by role', async () => {
      const result = await userService.findAll({ page: 1, limit: 10, role: 'ADMIN' })

      expect(result.users).toHaveLength(1)
      expect(result.users[0].role).toBe('ADMIN')
    })

    it('should search by name or email', async () => {
      const result = await userService.findAll({ page: 1, limit: 10, search: 'User 1' })

      expect(result.users).toHaveLength(1)
      expect(result.users[0].name).toBe('User 1')
    })
  })

  describe('findById', () => {
    it('should return null for non-existent user', async () => {
      const result = await userService.findById('non-existent-id')
      expect(result).toBeNull()
    })

    it('should return user by id', async () => {
      const created = await userService.create({
        name: 'Test',
        email: uniqueEmail(),
        password: '123456',
      })

      const result = await userService.findById(created.id)
      expect(result).toBeDefined()
      expect(result?.name).toBe('Test')
    })
  })

  describe('findByEmail', () => {
    it('should return null for non-existent email', async () => {
      const result = await userService.findByEmail('nonexistent@test.com')
      expect(result).toBeNull()
    })

    it('should return user by email', async () => {
      const email = uniqueEmail()
      await userService.create({
        name: 'Test',
        email,
        password: '123456',
      })

      const result = await userService.findByEmail(email)
      expect(result).toBeDefined()
      expect(result?.email).toBe(email)
    })
  })

  describe('update', () => {
    it('should throw for non-existent user', async () => {
      await expect(
        userService.update('non-existent', { name: 'New Name' })
      ).rejects.toThrow()
    })

    it('should update user name', async () => {
      const user = await userService.create({
        name: 'Original',
        email: uniqueEmail(),
        password: '123456',
      })

      const updated = await userService.update(user.id, { name: 'Updated' })
      expect(updated.name).toBe('Updated')
    })

    it('should rehash password when updating', async () => {
      const user = await userService.create({
        name: 'Test',
        email: uniqueEmail(),
        password: 'old123',
      })

      const originalPassword = (await prisma.user.findUnique({ where: { id: user.id } }))?.password

      await userService.update(user.id, { password: 'new456' })
      
      const newPassword = (await prisma.user.findUnique({ where: { id: user.id } }))?.password
      expect(newPassword).not.toBe('new456')
      expect(newPassword).not.toBe(originalPassword)
    })
  })

  describe('delete', () => {
    it('should delete user', async () => {
      const user = await userService.create({
        name: 'Test',
        email: uniqueEmail(),
        password: '123456',
      })

      await userService.delete(user.id)

      const result = await userService.findById(user.id)
      expect(result).toBeNull()
    })
  })
})
