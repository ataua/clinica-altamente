import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class LgpdService {
  async recordConsent(userId: string, consentType: string, consentGiven: boolean, ipAddress?: string, userAgent?: string) {
    const existing = await prisma.userConsent.findFirst({
      where: {
        userId,
        consentType,
      },
    })

    if (existing) {
      return prisma.userConsent.update({
        where: { id: existing.id },
        data: {
          consentGiven,
          consentDate: consentGiven ? new Date() : existing.consentDate,
          withdrawalDate: consentGiven ? null : new Date(),
          ipAddress,
          userAgent,
        },
      })
    }

    return prisma.userConsent.create({
      data: {
        userId,
        consentType,
        consentGiven,
        consentDate: consentGiven ? new Date() : undefined,
        withdrawalDate: consentGiven ? undefined : new Date(),
        ipAddress,
        userAgent,
      },
    })
  }

  async getUserConsents(userId: string) {
    return prisma.userConsent.findMany({
      where: { userId },
      orderBy: { consentDate: 'desc' },
    })
  }

  async hasConsent(userId: string, consentType: string): Promise<boolean> {
    const consent = await prisma.userConsent.findFirst({
      where: {
        userId,
        consentType,
        consentGiven: true,
        withdrawalDate: null,
      },
    })
    return !!consent
  }

  async logAccess(userId: string | null, action: string, entityType: string, entityId?: string, ipAddress?: string, userAgent?: string, metadata?: Record<string, unknown>) {
    return prisma.accessLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        ipAddress,
        userAgent,
        metadata: metadata as Prisma.JsonObject,
      },
    })
  }

  async getAccessLogs(params: {
    userId?: string
    entityType?: string
    entityId?: string
    page?: number
    limit?: number
  }) {
    const { userId, entityType, entityId, page = 1, limit = 50 } = params
    const skip = (page - 1) * limit

    const where: Prisma.AccessLogWhereInput = {}
    if (userId) where.userId = userId
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId

    const [logs, total] = await Promise.all([
      prisma.accessLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.accessLog.count({ where }),
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async anonymizeUser(userId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: 'Usuário Anonimizado',
          email: `anonimizado_${userId}@removed.com`,
          image: null,
        },
      })

      await tx.userConsent.deleteMany({
        where: { userId },
      })

      await tx.accessLog.deleteMany({
        where: { userId },
      })

      return { success: true }
    })
  }
}

export const lgpdService = new LgpdService()
