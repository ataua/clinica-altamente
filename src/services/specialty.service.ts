import { prisma } from '@/lib/prisma'

export class SpecialtyService {
  async findAll(params: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
  }) {
    const { page = 1, limit = 100, search, isActive } = params
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    
    if (isActive !== undefined) {
      where.isActive = isActive
    }
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const [specialties, total] = await Promise.all([
      prisma.specialty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.specialty.count({ where }),
    ])

    return {
      specialties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: string) {
    return prisma.specialty.findUnique({
      where: { id },
    })
  }

  async findByName(name: string) {
    return prisma.specialty.findUnique({
      where: { name },
    })
  }

  async create(data: {
    name: string
    description?: string
  }) {
    return prisma.specialty.create({
      data: {
        name: data.name,
        description: data.description || null,
      },
    })
  }

  async update(id: string, data: {
    name?: string
    description?: string
    isActive?: boolean
  }) {
    return prisma.specialty.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })
  }

  async delete(id: string) {
    return prisma.specialty.delete({
      where: { id },
    })
  }
}

export const specialtyService = new SpecialtyService()
