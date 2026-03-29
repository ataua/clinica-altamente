import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/response'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const userRole = session.user.role

    if (userRole !== 'RESPONSIBLE' && userRole !== 'PATIENT') {
      return error({ status: 403, message: 'Access denied' })
    }

    const body = await request.json()
    const { patientId, preferredDate, notes } = body

    if (!patientId || !preferredDate) {
      return error({ status: 400, message: 'Patient ID and preferred date are required' })
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    })

    if (!patient) {
      return error({ status: 404, message: 'Patient not found' })
    }

    const professional = await prisma.professional.findFirst({
      where: { isActive: true },
      include: {
        user: {
          select: { name: true },
        },
        specialty: true,
      },
    })

    if (!professional) {
      return error({ status: 400, message: 'No professional available' })
    }

    const scheduledDateTime = new Date(preferredDate)

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        professionalId: professional.id,
        scheduledDateTime,
        endDateTime: new Date(scheduledDateTime.getTime() + 30 * 60000),
        status: 'SCHEDULED',
        notes: `Solicitação via portal do responsável. Data preferencial: ${preferredDate}. Observações: ${notes || 'N/A'}`,
      },
    })

    return success(appointment, { message: 'Appointment request submitted successfully' })
  } catch (err) {
    console.error('Error creating appointment request:', err)
    return error(err)
  }
}
