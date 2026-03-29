import { NextRequest } from 'next/server'
import { calendarController } from '@/controllers/calendar.controller'

export async function GET(request: NextRequest) {
  return calendarController.getMyAppointments(request)
}
