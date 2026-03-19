import { NextRequest } from 'next/server'
import { appointmentController } from '@/controllers/appointment.controller'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return appointmentController.cancel(request, params)
}
