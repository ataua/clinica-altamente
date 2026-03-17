import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/bcrypt'
import { Prisma, Role } from '@prisma/client'

export class UserService {
  async findAll(params: {
    page?: number
    limit?: number
    role?: string
    search?: string
  }) {
    const { page = 1, limit = 10, role, search } = params
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {}
    
    if (role) {
      where.role = role as Role
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return user
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    })
  }

  async create(data: {
    name: string
    email: string
    password: string
    role?: string
  }) {
    const hashedPassword = await hashPassword(data.password)
    
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: (data.role as Role) || 'PATIENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })
  }

  async update(id: string, data: {
    name?: string
    email?: string
    password?: string
    role?: string
  }) {
    const updateData: Prisma.UserUpdateInput = {}
    
    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email
    if (data.role) updateData.role = data.role as Role
    if (data.password) {
      updateData.password = await hashPassword(data.password)
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    })
  }

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    })
  }
}

export const userService = new UserService()
