import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class ResponsibleContactService {
  async findAll(params: {
    page?: number
    limit?: number
    search?: string
  }) {
    const { page = 1, limit = 10, search } = params
    const skip = (page - 1) * limit

    const where: Prisma.ResponsibleContactWhereInput = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [responsibles, total] = await Promise.all([
      prisma.responsibleContact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.responsibleContact.count({ where }),
    ])

    return {
      responsibles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: string) {
    return prisma.responsibleContact.findUnique({
      where: { id },
    })
  }

  async findByCpf(cpf: string) {
    return prisma.responsibleContact.findUnique({
      where: { cpf },
    })
  }

  async findByPhone(phone: string) {
    return prisma.responsibleContact.findFirst({
      where: { phone },
    })
  }

  async create(data: {
    name: string
    email?: string
    phone: string
    cpf?: string
    relationship: string
  }) {
    return prisma.responsibleContact.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        cpf: data.cpf || null,
        relationship: data.relationship,
      },
    })
  }

  async update(id: string, data: {
    name?: string
    email?: string
    phone?: string
    cpf?: string
    relationship?: string
  }) {
    const updateData: Prisma.ResponsibleContactUpdateInput = {}
    
    if (data.name) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email || null
    if (data.phone) updateData.phone = data.phone
    if (data.cpf !== undefined) updateData.cpf = data.cpf || null
    if (data.relationship) updateData.relationship = data.relationship

    return prisma.responsibleContact.update({
      where: { id },
      data: updateData,
    })
  }

  async delete(id: string) {
    return prisma.responsibleContact.delete({
      where: { id },
    })
  }
}

export const responsibleContactService = new ResponsibleContactService()
