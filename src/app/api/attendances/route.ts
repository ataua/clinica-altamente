import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { attendanceService } from '@/services/attendance.service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const patientId = searchParams.get('patientId') || undefined
    const professionalId = searchParams.get('professionalId') || undefined
    const appointmentId = searchParams.get('appointmentId') || undefined
    const status = searchParams.get('status') || undefined

    const result = await attendanceService.findAll({
      page,
      limit,
      patientId,
      professionalId,
      appointmentId: appointmentId,
      status: status as any,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching attendances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendances' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentId, patientId, professionalId, startTime, notes, observations } = body

    if (!appointmentId || !patientId || !professionalId || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const attendance = await attendanceService.create({
      appointmentId,
      patientId,
      professionalId,
      startTime: new Date(startTime),
      notes,
      observations,
    })

    return NextResponse.json(attendance, { status: 201 })
  } catch (error) {
    console.error('Error creating attendance:', error)
    const message = error instanceof Error ? error.message : 'Failed to create attendance'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
