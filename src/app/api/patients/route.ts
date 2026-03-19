import { NextRequest } from 'next/server'
import { patientController } from '@/controllers/patient.controller'

export async function GET(request: NextRequest) {
  return patientController.findAll(request)
}

export async function POST(request: NextRequest) {
  return patientController.create(request)
}
