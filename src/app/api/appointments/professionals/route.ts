import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { appointmentService } from '@/services/appointment.service'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const professionals = await appointmentService.getProfessionals()
    return NextResponse.json(professionals)
  } catch (error) {
    console.error('Error fetching professionals:', error)
    return NextResponse.json(
      { message: 'Error fetching professionals' },
      { status: 500 }
    )
  }
}
