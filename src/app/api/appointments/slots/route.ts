import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { appointmentService } from '@/services/appointment.service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const professionalId = searchParams.get('professionalId')
    const date = searchParams.get('date')

    if (!professionalId || !date) {
      return NextResponse.json(
        { message: 'Professional ID and date are required' },
        { status: 400 }
      )
    }

    const result = await appointmentService.getAvailableSlots(professionalId, date)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching available slots:', error)
    return NextResponse.json(
      { message: 'Error fetching available slots' },
      { status: 500 }
    )
  }
}
