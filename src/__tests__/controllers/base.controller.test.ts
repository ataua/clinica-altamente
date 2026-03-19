import { describe, it, expect, vi, beforeEach } from 'bun:test'
import type { Session } from 'next-auth'
import type { Role } from '@prisma/client'
import { BaseController } from '@/controllers/base.controller'

const mockAuth = vi.fn()

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

describe('BaseController', () => {
  class TestController extends BaseController {
    async testRequireAuth() {
      return this.requireAuth()
    }

    testCanAccess(user: Session['user'], resourceUserId: string, roles: Role[] = []) {
      return this.canAccess(user, resourceUserId, roles)
    }

    testRequireRole(user: Session['user'], allowedRoles: Role[]) {
      return this.requireRole(user, allowedRoles)
    }
  }

  let controller: TestController

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new TestController()
  })

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: '1', name: 'Test', role: 'ADMIN' as const }
      mockAuth.mockResolvedValueOnce({ user: mockUser })

      const user = await controller.testRequireAuth()

      expect(user).toEqual(mockUser)
    })

    it('should throw when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null)

      await expect(controller.testRequireAuth()).rejects.toEqual({
        status: 401,
        message: 'Unauthorized',
      })
    })
  })

  describe('canAccess', () => {
    it('should return true if user has allowed role', () => {
      const user = { id: '1', role: 'ADMIN' as const }

      expect(controller.testCanAccess(user, '2', ['ADMIN'])).toBe(true)
    })

    it('should return true if user is resource owner', () => {
      const user = { id: '1', role: 'PATIENT' as const }

      expect(controller.testCanAccess(user, '1', ['ADMIN'])).toBe(true)
    })

    it('should return false if user has no role and not owner', () => {
      const user = { id: '1', role: 'PATIENT' as const }

      expect(controller.testCanAccess(user, '2', ['ADMIN'])).toBe(false)
    })
  })

  describe('requireRole', () => {
    it('should not throw if user has allowed role', () => {
      const user = { id: '1', role: 'ADMIN' as const }

      expect(() => controller.testRequireRole(user, ['ADMIN'])).not.toThrow()
    })

    it('should throw if user does not have allowed role', () => {
      const user = { id: '1', role: 'PATIENT' as const }

      expect(() => controller.testRequireRole(user, ['ADMIN'])).toThrow()
    })
  })
})
