import { NextRequest } from 'next/server'
import { attendanceController } from '@/controllers/attendance.controller'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return attendanceController.confirmAppointment(request, params)
}
