import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { testPrisma } from './setup'
import { hashPassword, verifyPassword } from '@/lib/bcrypt'

describe('User', () => {
  let userId: string

  afterEach(async () => {
    if (userId) {
      await testPrisma.user.deleteMany({
        where: { email: { contains: '@test.com' } },
      })
    }
  })

  it('should create a user with hashed password', async () => {
    const password = await hashPassword('testpassword123')

    const user = await testPrisma.user.create({
      data: {
        email: `user_${Date.now()}@test.com`,
        name: 'Test User',
        password,
        role: 'PATIENT',
      },
    })

    expect(user).toBeDefined()
    expect(user.email).toBeDefined()
    expect(user.password).not.toBe('testpassword123')
    userId = user.id
  })

  it('should verify password correctly', async () => {
    const password = await hashPassword('testpassword123')
    const user = await testPrisma.user.create({
      data: {
        email: `user_verify_${Date.now()}@test.com`,
        name: 'Test User',
        password,
        role: 'PATIENT',
      },
    })
    userId = user.id

    const isValid = await verifyPassword('testpassword123', user.password!)
    expect(isValid).toBe(true)
  })

  it('should reject wrong password', async () => {
    const password = await hashPassword('testpassword123')
    const user = await testPrisma.user.create({
      data: {
        email: `user_wrong_${Date.now()}@test.com`,
        name: 'Test User',
        password,
        role: 'PATIENT',
      },
    })
    userId = user.id

    const isValid = await verifyPassword('wrongpassword', user.password!)
    expect(isValid).toBe(false)
  })

  it('should create user with different roles', async () => {
    const roles: ('ADMIN' | 'PROFESSIONAL' | 'SECRETARY' | 'PATIENT' | 'COORDINATOR')[] = ['ADMIN', 'PROFESSIONAL', 'SECRETARY', 'PATIENT', 'COORDINATOR']

    for (const role of roles) {
      const password = await hashPassword('testpassword123')
      const user = await testPrisma.user.create({
        data: {
          email: `user_${role.toLowerCase()}_${Date.now()}@test.com`,
          name: `Test ${role}`,
          password,
          role,
        },
      })

      expect(user.role).toBe(role)
    }
  })

  it('should find user by email', async () => {
    const email = `user_find_${Date.now()}@test.com`
    const password = await hashPassword('testpassword123')

    const user = await testPrisma.user.create({
      data: {
        email,
        name: 'Test User',
        password,
        role: 'PATIENT',
      },
    })
    userId = user.id

    const found = await testPrisma.user.findUnique({
      where: { email },
    })

    expect(found).toBeDefined()
    expect(found?.email).toBe(email)
  })

  it('should update user role', async () => {
    const password = await hashPassword('testpassword123')
    const user = await testPrisma.user.create({
      data: {
        email: `user_update_${Date.now()}@test.com`,
        name: 'Test User',
        password,
        role: 'PATIENT',
      },
    })
    userId = user.id

    const updated = await testPrisma.user.update({
      where: { id: user.id },
      data: { role: 'PROFESSIONAL' },
    })

    expect(updated.role).toBe('PROFESSIONAL')
  })
})
