import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { success, error, notFound } from '@/lib/response'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const role = session.user.role

    if (role !== 'PATIENT' && role !== 'RESPONSIBLE') {
      return error({ status: 403, message: 'Access denied' })
    }

    const patient = await prisma.patient.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!patient) {
      return notFound('Patient')
    }

    let responsibleContact = null
    if (patient.emergencyPhone) {
      responsibleContact = await prisma.responsibleContact.findFirst({
        where: {
          phone: patient.emergencyPhone,
        },
      })
    }

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

    return success({
      id: patient.id,
      name: patient.user?.name,
      email: patient.user?.email,
      phone: patient.phone,
      cpf: patient.cpf,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: parsedAddress,
      observations: patient.observations,
      responsibleContact: responsibleContact ? {
        id: responsibleContact.id,
        name: responsibleContact.name,
        email: responsibleContact.email,
        phone: responsibleContact.phone,
        cpf: responsibleContact.cpf,
        relationship: responsibleContact.relationship,
      } : null,
    })
  } catch (err) {
    return error(err)
  }
}
