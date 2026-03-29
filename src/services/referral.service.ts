import { prisma } from '@/lib/prisma'
import { Prisma, ReferralStatus } from '@prisma/client'

export class ReferralService {
  async create(data: {
    patientId: string
    teacherId: string
    reason: string
    observations?: string
  }) {
    return prisma.referral.create({
      data: {
        patientId: data.patientId,
        teacherId: data.teacherId,
        reason: data.reason,
        observations: data.observations,
        status: 'PENDING',
      },
      include: {
        patient: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    })
  }

  async findAll(params: {
    page?: number
    limit?: number
    teacherId?: string
    status?: ReferralStatus
  }) {
    const { page = 1, limit = 10, teacherId, status } = params
    const skip = (page - 1) * limit

    const where: Prisma.ReferralWhereInput = {}
    if (teacherId) where.teacherId = teacherId
    if (status) where.status = status

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
          teacher: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
      }),
      prisma.referral.count({ where }),
    ])

    return {
      referrals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: string) {
    return prisma.referral.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    })
  }

  async updateStatus(id: string, status: ReferralStatus, response?: string) {
    return prisma.referral.update({
      where: { id },
      data: {
        status,
        response,
        responseDate: response ? new Date() : null,
      },
      include: {
        patient: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    })
  }

  async delete(id: string) {
    return prisma.referral.delete({ where: { id } })
  }
}

export const referralService = new ReferralService()
