import type { Session } from 'next-auth'

export const mockSession = (overrides: Partial<Session['user']> = {}): Session => ({
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@test.com',
    role: 'ADMIN',
    ...overrides,
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
})

export const mockAdminSession = mockSession({ role: 'ADMIN' })
export const mockProfessionalSession = mockSession({ role: 'PROFESSIONAL' })
export const mockSecretarySession = mockSession({ role: 'SECRETARY' })
export const mockPatientSession = mockSession({ role: 'PATIENT' })
export const mockCoordinatorSession = mockSession({ role: 'COORDINATOR' })
