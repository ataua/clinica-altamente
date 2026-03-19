import type { NextRequest } from 'next/server'
import { responsibleController } from '@/controllers/responsible.controller'

export async function GET(request: NextRequest) {
  return responsibleController.findAll(request)
}

export async function POST(request: NextRequest) {
  return responsibleController.create(request)
}
