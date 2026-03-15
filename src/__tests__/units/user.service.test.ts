import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'
import { userService } from '@/services/user.service'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/bcrypt'

const testUser = {
  name: 'Test User',
  email: 'test-us1@test.com',
  password: 'test123456',
  role: 'PATIENT' as const,
}

const adminUser = {
  name: 'Admin User',
  email: 'admin-us1@test.com',
  password: 'admin123456',
  role: 'ADMIN' as const,
}

describe('UserService', () => {
  beforeAll(async () => {
    await prisma.$connect()
    await prisma.user.deleteMany({})
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { 
          in: [
            testUser.email, 
            adminUser.email, 
            'update@test.com', 
            'delete@test.com',
            'default@test.com',
            'role@test.com',
            'prof@test.com',
            'search@test.com',
          ] 
        },
      },
    })
  })

  describe('create', () => {
    it('should create a new user', async () => {
      const user = await userService.create(testUser)

      expect(user).toBeDefined()
      expect(user.name).toBe(testUser.name)
      expect(user.email).toBe(testUser.email)
      expect(user.role).toBe(testUser.role)
      expect(user.id).toBeDefined()
    })

    it('should hash the password', async () => {
      await userService.create(testUser)
      
      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email },
      })

      expect(dbUser).toBeDefined()
      expect(dbUser?.password).not.toBe(testUser.password)
      expect(dbUser?.password).toMatch(/^\$2[ayb]\$.{56}$/)
    })

    it('should create user with default role PATIENT', async () => {
      const user = await userService.create({
        name: 'Default Role User',
        email: 'default@test.com',
        password: 'test123456',
      })

      expect(user.role).toBe('PATIENT')
    })

    it('should create user with specified role', async () => {
      const user = await userService.create({
        ...testUser,
        email: 'role@test.com',
        role: 'PROFESSIONAL',
      })

      expect(user.role).toBe('PROFESSIONAL')
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await userService.create(testUser)
      await userService.create(adminUser)
      await userService.create({
        name: 'Professional',
        email: 'prof@test.com',
        password: 'test123456',
        role: 'PROFESSIONAL',
      })
    })

    it('should return all users without filters', async () => {
      const result = await userService.findAll({})

      expect(result.users.length).toBeGreaterThanOrEqual(3)
    })

    it('should filter by role', async () => {
      const result = await userService.findAll({ role: 'ADMIN' })

      expect(result.users.length).toBe(1)
      expect(result.users[0].role).toBe('ADMIN')
    })

    it('should filter by search term', async () => {
      const result = await userService.findAll({ search: 'Admin' })

      expect(result.users.length).toBe(1)
      expect(result.users[0].name).toContain('Admin')
    })

    it('should return pagination info', async () => {
      const result = await userService.findAll({ page: 1, limit: 2 })

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(2)
      expect(result.pagination.total).toBeGreaterThan(0)
    })
  })

  describe('findById', () => {
    it('should find user by id', async () => {
      const created = await userService.create(testUser)
      const user = await userService.findById(created.id)

      expect(user).toBeDefined()
      expect(user?.email).toBe(testUser.email)
    })

    it('should return null for non-existent id', async () => {
      const user = await userService.findById('00000000-0000-0000-0000-000000000000')

      expect(user).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      await userService.create(testUser)
      const user = await userService.findByEmail(testUser.email)

      expect(user).toBeDefined()
      expect(user?.name).toBe(testUser.name)
    })
  })

  describe('update', () => {
    it('should update user name', async () => {
      const created = await userService.create(testUser)
      
      const updated = await userService.update(created.id, {
        name: 'Updated Name',
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.email).toBe(testUser.email)
    })

    it('should update user role', async () => {
      const created = await userService.create(testUser)
      
      const updated = await userService.update(created.id, {
        role: 'PROFESSIONAL',
      })

      expect(updated.role).toBe('PROFESSIONAL')
    })

    it('should update password', async () => {
      const created = await userService.create(testUser)
      
      await userService.update(created.id, {
        password: 'newpassword123',
      })

      const dbUser = await prisma.user.findUnique({
        where: { id: created.id },
      })

      expect(dbUser?.password).not.toBe(testUser.password)
    })
  })

  describe('delete', () => {
    it('should delete user', async () => {
      const created = await userService.create(testUser)
      
      await userService.delete(created.id)

      const user = await userService.findById(created.id)
      expect(user).toBeNull()
    })
  })
})
