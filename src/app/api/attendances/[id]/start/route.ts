import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { attendanceService } from '@/services/attendance.service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const attendance = await attendanceService.start(id)

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error starting attendance:', error)
    const message = error instanceof Error ? error.message : 'Failed to start attendance'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
