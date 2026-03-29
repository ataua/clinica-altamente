import { NextRequest } from 'next/server'
import { attendanceController } from '@/controllers/attendance.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  return attendanceController.findByAppointmentId(request, params)
}
