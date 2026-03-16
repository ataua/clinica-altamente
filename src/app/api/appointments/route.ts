import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { appointmentService } from '@/services/appointment.service'
import { CreateAppointmentDTO, AppointmentFilterDTO } from '@/dtos/appointment.dto'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const professionalId = searchParams.get('professionalId') || undefined
    const patientId = searchParams.get('patientId') || undefined
    const status = searchParams.get('status') || undefined

    const filter = AppointmentFilterDTO.parse({
      page,
      limit,
      startDate,
      endDate,
      professionalId,
      patientId,
      status,
    })

    const result = await appointmentService.findAll(filter)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error fetching appointments' },
      { status: 400 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = CreateAppointmentDTO.parse(body)

    const appointment = await appointmentService.create(data)
    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error creating appointment' },
      { status: 400 }
    )
  }
}
