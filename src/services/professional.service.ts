import { prisma } from '@/lib/prisma'

export class ProfessionalService {
  async findAll(params: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
    specialtyId?: string
  }) {
    const { page = 1, limit = 10, search, isActive, specialtyId } = params
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    
    if (isActive !== undefined) {
      where.isActive = isActive
    }
    
    if (specialtyId) {
      where.specialtyId = specialtyId
    }
    
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { specialty: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [professionals, total] = await Promise.all([
      prisma.professional.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          specialty: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.professional.count({ where }),
    ])

    return {
      professionals: professionals.map(p => ({
        id: p.id,
        userId: p.userId,
        name: p.user.name,
        email: p.user.email,
        specialty: p.specialty ? { id: p.specialty.id, name: p.specialty.name } : null,
        licenseNumber: p.licenseNumber,
        bio: p.bio,
        isActive: p.isActive,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: string) {
    const professional = await prisma.professional.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        specialty: {
          select: {
            id: true,
            name: true,
          },
        },
        professionalSchedules: {
          where: { isActive: true },
        },
      },
    })

    if (!professional) return null

    return {
      id: professional.id,
      userId: professional.userId,
      name: professional.user.name,
      email: professional.user.email,
      specialty: professional.specialty ? { id: professional.specialty.id, name: professional.specialty.name } : null,
      licenseNumber: professional.licenseNumber,
      bio: professional.bio,
      isActive: professional.isActive,
      schedules: professional.professionalSchedules,
    }
  }

  async findByUserId(userId: string) {
    return prisma.professional.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        specialty: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
  }

  async create(data: {
    userId: string
    specialtyId?: string
    licenseNumber?: string
    bio?: string
  }) {
    return prisma.professional.create({
      data: {
        userId: data.userId,
        specialtyId: data.specialtyId || null,
        licenseNumber: data.licenseNumber || null,
        bio: data.bio || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        specialty: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
  }

  async update(id: string, data: {
    specialtyId?: string
    licenseNumber?: string
    bio?: string
    isActive?: boolean
  }) {
    return prisma.professional.update({
      where: { id },
      data: {
        ...(data.specialtyId !== undefined && { specialtyId: data.specialtyId }),
        ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        specialty: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
  }

  async delete(id: string) {
    return prisma.professional.delete({
      where: { id },
    })
  }

  async updateSchedule(id: string, schedules: {
    dayOfWeek: number
    startTime: string
    endTime: string
  }[]) {
    await prisma.professionalSchedule.deleteMany({
      where: { professionalId: id },
    })

    if (schedules.length === 0) {
      return this.findById(id)
    }

    await prisma.professionalSchedule.createMany({
      data: schedules.map(s => ({
        professionalId: id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isActive: true,
      })),
    })

    return this.findById(id)
  }
}

export const professionalService = new ProfessionalService()
