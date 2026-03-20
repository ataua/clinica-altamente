import { describe, it, expect } from 'bun:test'
import {
  success,
  created,
  error,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  badRequest,
} from '@/lib/response'
import { AppError, UnauthorizedError, NotFoundError, ConflictError } from '@/lib/errors'

describe('Response Helpers', () => {
  describe('success', () => {
    it('should return 200 with data', () => {
      const response = success({ id: '1', name: 'Test' })

      expect(response.status).toBe(200)
    })

    it('should include links when provided', async () => {
      const response = success({ id: '1' }, {
        links: { self: { href: '/api/users/1' } },
      })

      const body = await response.json()
      expect(body._links).toBeDefined()
    })
  })

  describe('created', () => {
    it('should return 201', () => {
      const response = created({ id: '1' }, 'Created successfully')

      expect(response.status).toBe(201)
    })
  })

  describe('error', () => {
    it('should handle AppError', async () => {
      const appError = new AppError('Test error', 400, 'TEST_ERROR')
      const response = error(appError)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.code).toBe('TEST_ERROR')
    })

    it('should handle UnauthorizedError', async () => {
      const response = error(new UnauthorizedError())

      expect(response.status).toBe(401)
    })

    it('should handle NotFoundError', async () => {
      const response = error(new NotFoundError('User'))

      expect(response.status).toBe(404)
    })

    it('should handle ConflictError', async () => {
      const response = error(new ConflictError('Email already exists'))

      expect(response.status).toBe(409)
    })

    it('should handle unknown errors', async () => {
      const response = error(new Error('Unknown'))

      expect(response.status).toBe(500)
    })
  })

  describe('unauthorized', () => {
    it('should return 401', () => {
      const response = unauthorized()

      expect(response.status).toBe(401)
    })
  })

  describe('forbidden', () => {
    it('should return 403', () => {
      const response = forbidden()

      expect(response.status).toBe(403)
    })
  })

  describe('notFound', () => {
    it('should return 404', () => {
      const response = notFound('User')

      expect(response.status).toBe(404)
    })
  })

  describe('conflict', () => {
    it('should return 409', () => {
      const response = conflict('Email already exists')

      expect(response.status).toBe(409)
    })
  })

  describe('badRequest', () => {
    it('should return 400', () => {
      const response = badRequest('Invalid input')

      expect(response.status).toBe(400)
    })
  })
})
