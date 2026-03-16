import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { appointmentService } from '@/services/appointment.service'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const types = await appointmentService.getAppointmentTypes()
    return NextResponse.json(types)
  } catch (error) {
    console.error('Error fetching appointment types:', error)
    return NextResponse.json(
      { message: 'Error fetching appointment types' },
      { status: 500 }
    )
  }
}
