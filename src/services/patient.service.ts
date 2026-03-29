import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { hashPassword } from '@/lib/bcrypt'

export class PatientService {
  async findAll(params: {
    page?: number
    limit?: number
    search?: string
  }) {
    const { page = 1, limit = 10, search } = params
    const skip = (page - 1) * limit

    const where: Prisma.PatientWhereInput = {}
    
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { cpf: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
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
            },
          },
        },
      }),
      prisma.patient.count({ where }),
    ])

    const emergencyPhones = patients
      .map(p => p.emergencyPhone)
      .filter((phone): phone is string => !!phone)

    const responsibleContacts = emergencyPhones.length > 0
      ? await prisma.responsibleContact.findMany({
          where: { phone: { in: emergencyPhones } },
        })
      : []

    const responsibleContactsMap = new Map(
      responsibleContacts.map(rc => [rc.phone, rc])
    )

    const patientsWithResponsible = patients.map((patient) => {
      const responsibleContact = patient.emergencyPhone
        ? responsibleContactsMap.get(patient.emergencyPhone)
        : null
      let parsedAddress = null
      if (patient.address) {
        try {
          parsedAddress = typeof patient.address === 'string' 
            ? JSON.parse(patient.address) 
            : patient.address
        } catch {
          parsedAddress = null
        }
      }
      return {
        ...patient,
        address: parsedAddress,
        notes: patient.observations,
        name: patient.user?.name,
        email: patient.user?.email,
        responsibleContact: responsibleContact ? {
          id: responsibleContact.id,
          name: responsibleContact.name,
          email: responsibleContact.email,
          phone: responsibleContact.phone,
          cpf: responsibleContact.cpf,
          relationship: responsibleContact.relationship,
        } : null,
      }
    })

    return {
      patients: patientsWithResponsible,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: string) {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!patient) return null

    const responsibleContact = patient.emergencyPhone 
      ? await prisma.responsibleContact.findFirst({
          where: { phone: patient.emergencyPhone },
        })
      : null

    let parsedAddress = null
    if (patient.address) {
      try {
        parsedAddress = typeof patient.address === 'string' 
          ? JSON.parse(patient.address) 
          : patient.address
      } catch {
        parsedAddress = null
      }
    }

    return {
      ...patient,
      address: parsedAddress,
      notes: patient.observations,
      name: patient.user?.name,
      email: patient.user?.email,
      responsibleContact: responsibleContact ? {
        id: responsibleContact.id,
        name: responsibleContact.name,
        email: responsibleContact.email,
        phone: responsibleContact.phone,
        cpf: responsibleContact.cpf,
        relationship: responsibleContact.relationship,
      } : null,
    }
  }

  async findByCpf(cpf: string) {
    return prisma.patient.findUnique({
      where: { cpf },
    })
  }

  private generatePatientPassword(): string {
    const timestamp = Date.now()
    const hash = String(timestamp).slice(-6)
    return `Paciente#${hash}`
  }

  async create(data: {
    name: string
    email?: string
    password?: string
    phone?: string
    cpf?: string
    dateOfBirth?: string
    gender?: string
    address?: {
      street?: string
      number?: string
      complement?: string
      neighborhood?: string
      city?: string
      state?: string
      zipCode?: string
    }
    responsibleContactId?: string
    responsibleContact?: {
      name: string
      email?: string
      phone: string
      cpf?: string
      relationship: string
    }
    notes?: string
  }) {
    let responsibleContactId = data.responsibleContactId

    if (data.responsibleContact && !responsibleContactId) {
      const existingResponsible = await prisma.responsibleContact.findFirst({
        where: { phone: data.responsibleContact.phone },
      })
      
      if (existingResponsible) {
        responsibleContactId = existingResponsible.id
      } else {
        const newResponsible = await prisma.responsibleContact.create({
          data: {
            name: data.responsibleContact.name,
            email: data.responsibleContact.email ?? null,
            phone: data.responsibleContact.phone,
            cpf: data.responsibleContact.cpf ?? null,
            relationship: data.responsibleContact.relationship,
          },
        })
        responsibleContactId = newResponsible.id
      }
    }

    const plainPassword = this.generatePatientPassword()
    const hashedPassword = await hashPassword(plainPassword)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email ?? null,
        password: hashedPassword,
      },
    })

    let emergencyPhone: string | null = null;
    if (responsibleContactId) {
      const contact = await prisma.responsibleContact.findUnique({ where: { id: responsibleContactId } });
      emergencyPhone = contact?.phone ?? null;
    }

    const patient = await prisma.patient.create({
      data: {
        user: { connect: { id: user.id } },
        phone: data.phone ?? null,
        cpf: data.cpf ?? null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender ?? null,
        address: data.address ? JSON.stringify(data.address) : null,
        emergencyPhone: emergencyPhone,
        observations: data.notes ?? null,
      },
    })

    return {
      ...patient,
      generatedPassword: plainPassword,
    }
  }

  async update(id: string, data: {
    name?: string
    email?: string
    phone?: string
    cpf?: string
    dateOfBirth?: string
    gender?: string
    address?: {
      street?: string
      number?: string
      complement?: string
      neighborhood?: string
      city?: string
      state?: string
      zipCode?: string
    }
    responsibleContactId?: string
    responsibleContact?: {
      name: string
      email?: string
      phone: string
      cpf?: string
      relationship: string
    }
    notes?: string
  }) {
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!existingPatient) {
      throw new Error('Patient not found')
    }

    let responsibleContactId = data.responsibleContactId

    if (data.responsibleContact) {
      const existingResponsible = await prisma.responsibleContact.findFirst({
        where: { phone: data.responsibleContact.phone },
      })
      
      if (existingResponsible) {
        responsibleContactId = existingResponsible.id
      } else {
        const newResponsible = await prisma.responsibleContact.create({
          data: {
            name: data.responsibleContact.name,
            email: data.responsibleContact.email || null,
            phone: data.responsibleContact.phone,
            cpf: data.responsibleContact.cpf || null,
            relationship: data.responsibleContact.relationship,
          },
        })
        responsibleContactId = newResponsible.id
      }
    }

    if (data.name || data.email) {
      await prisma.user.update({
        where: { id: existingPatient.userId },
        data: {
          name: data.name || existingPatient.user.name,
          email: data.email || existingPatient.user.email,
        },
      })
    }

    const updateData: Prisma.PatientUpdateInput = {}
    
    if (data.phone !== undefined) updateData.phone = data.phone || null
    if (data.cpf !== undefined) updateData.cpf = data.cpf || null
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth)
    if (data.gender) updateData.gender = data.gender
    if (data.address) updateData.address = JSON.stringify(data.address)
    if (data.notes !== undefined) updateData.observations = data.notes || null
    if (responsibleContactId) {
      const rc = await prisma.responsibleContact.findUnique({ where: { id: responsibleContactId } })
      updateData.emergencyPhone = rc?.phone || null
    }

    return prisma.patient.update({
      where: { id },
      data: updateData,
    })
  }

  async delete(id: string) {
    return prisma.patient.delete({
      where: { id },
    })
  }
}

export const patientService = new PatientService()
