import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { reminderService } from '@/services/reminder.service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentId, type } = body

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    let result
    switch (type) {
      case 'confirmation':
        result = await reminderService.sendConfirmation(appointmentId)
        break
      case 'cancellation':
        result = await reminderService.sendCancellation(appointmentId, body.reason)
        break
      case 'reminder':
      default:
        result = await reminderService.sendReminder(appointmentId)
        break
    }

    if (result.success) {
      return NextResponse.json({
        message: 'Email sent successfully',
        appointmentId: result.appointmentId,
        email: result.patientEmail,
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SECRETARY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await reminderService.sendBatchReminders()

    return NextResponse.json({
      message: 'Batch reminders sent',
      sent: result.sent,
      failed: result.failed,
    })
  } catch (error) {
    console.error('Error sending batch reminders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
