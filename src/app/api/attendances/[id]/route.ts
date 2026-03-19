import type { NextRequest } from 'next/server'
import { attendanceController } from '@/controllers/attendance.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return attendanceController.findById(params)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return attendanceController.update(request, params)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return attendanceController.delete(params)
}
