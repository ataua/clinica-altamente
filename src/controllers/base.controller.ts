import { auth } from '@/lib/auth'
import type { Session } from 'next-auth'

export type UserRole = 'ADMIN' | 'PROFESSIONAL' | 'SECRETARY' | 'PATIENT' | 'RESPONSIBLE' | 'TEACHER' | 'COORDINATOR'

export class BaseController {
  protected async getSession(): Promise<Session['user'] | null> {
    const session = await auth()
    return session?.user || null
  }

  protected async requireAuth(): Promise<Session['user']> {
    const session = await auth()
    if (!session?.user) {
      throw { status: 401, message: 'Unauthorized' }
    }
    return session.user
  }

  protected requireRole(user: Session['user'], allowedRoles: UserRole[]): void {
    if (!allowedRoles.includes(user.role as UserRole)) {
      throw { status: 403, message: 'Forbidden' }
    }
  }

  protected canAccess(user: Session['user'], resourceUserId: string, roles: UserRole[] = []): boolean {
    if (roles.includes(user.role as UserRole)) return true
    if (user.id === resourceUserId) return true
    return false
  }

  protected getResourceId(params: Promise<{ id: string }>): Promise<string> {
    return params.then(p => p.id)
  }
}
