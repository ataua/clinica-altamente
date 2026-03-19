import type { NextRequest } from 'next/server'
import { attendanceController } from '@/controllers/attendance.controller'

export async function GET(request: NextRequest) {
  return attendanceController.findAll(request)
}

export async function POST(request: NextRequest) {
  return attendanceController.create(request)
}
