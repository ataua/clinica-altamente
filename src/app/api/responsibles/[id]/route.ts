import type { NextRequest } from 'next/server'
import { responsibleController } from '@/controllers/responsible.controller'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return responsibleController.update(request, params)
}
