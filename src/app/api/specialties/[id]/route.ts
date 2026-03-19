import type { NextRequest } from 'next/server'
import { specialtyService } from '@/services/specialty.service'
import { success, error, notFound } from '@/lib/response'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const result = await specialtyService.findById(id)

    if (!result) {
      return notFound('Specialty')
    }

    return success(result)
  } catch (err) {
    return error(err)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, isActive } = body

    const existing = await specialtyService.findById(id)
    if (!existing) {
      return notFound('Specialty')
    }

    const result = await specialtyService.update(id, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
    })

    return success(result, { message: 'Especialidade atualizada' })
  } catch (err) {
    return error(err)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await specialtyService.delete(id)

    return success(null, { message: 'Especialidade excluída' })
  } catch (err) {
    return error(err)
  }
}
