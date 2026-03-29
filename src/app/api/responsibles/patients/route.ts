import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/response'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const userRole = session.user.role

    if (userRole !== 'RESPONSIBLE') {
      return error({ status: 403, message: 'Access denied' })
    }

    const responsibleContact = await prisma.responsibleContact.findFirst({
      where: {
        email: session.user.email || '',
      },
    })

    if (!responsibleContact) {
      return success({ patients: [] })
    }

    const patients = await prisma.patient.findMany({
      where: {
        emergencyPhone: responsibleContact.phone,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    const formattedPatients = patients.map((patient) => ({
      id: patient.id,
      name: patient.user?.name || 'Paciente',
      dateOfBirth: patient.dateOfBirth?.toISOString() || null,
    }))

    return success({ patients: formattedPatients })
  } catch (err) {
    console.error('Error fetching responsible patients:', err)
    return error(err)
  }
}
