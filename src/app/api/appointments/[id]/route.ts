import { NextRequest } from 'next/server'
import { appointmentController } from '@/controllers/appointment.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return appointmentController.findById(params)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return appointmentController.update(request, params)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return appointmentController.delete(params)
}
