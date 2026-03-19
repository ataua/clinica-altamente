import type { NextRequest } from 'next/server'
import { BaseController } from './base.controller'
import { responsibleContactService } from '@/services/responsible.service'
import { CreateResponsibleDTO, ResponsibleQueryDTO } from '@/dtos/patient.dto'
import { created, error, conflict, paginated, success, notFound } from '@/lib/response'
import { z } from 'zod'

const UpdateResponsibleDTO = z.object({
  name: z.string().min(2, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().regex(/^\(?\d{2}\)?[\s.-]?(\d{4,5})[\s.-]?\d{4}$/, 'Telefone inválido').optional(),
  cpf: z.string().optional(),
  relationship: z.string().min(2, 'Relacionamento é obrigatório').optional(),
})

export class ResponsibleController extends BaseController {
  async findAll(request: NextRequest) {
    try {
      await this.requireAuth()

      const { searchParams } = new URL(request.url)
      const query = ResponsibleQueryDTO.parse({
        page: searchParams.get('page') || undefined,
        limit: searchParams.get('limit') || undefined,
        search: searchParams.get('search') || undefined,
      })

      const result = await responsibleContactService.findAll(query)

      return paginated(
        result.responsibles,
        {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
        },
        request.nextUrl.origin,
        '/responsibles',
        { search: query.search || '' }
      )
    } catch (err) {
      return error(err)
    }
  }

  async create(request: NextRequest) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, ['ADMIN', 'SECRETARY', 'PROFESSIONAL'])

      const body = await request.json()
      const data = CreateResponsibleDTO.parse(body)

      if (data.cpf) {
        const existing = await responsibleContactService.findByCpf(data.cpf)
        if (existing) return conflict('CPF already registered')
      }

      const existingPhone = await responsibleContactService.findByPhone(data.phone)
      if (existingPhone) return conflict('Phone already registered')

      const result = await responsibleContactService.create(data)

      return created(result, 'Responsible created successfully', {
        self: { href: `/api/responsibles/${result.id}` },
      })
    } catch (err) {
      return error(err)
    }
  }

  async update(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      await this.requireAuth()
      const { id } = await params

      const existing = await responsibleContactService.findById(id)
      if (!existing) return notFound('Responsible')

      const body = await request.json()
      const data = UpdateResponsibleDTO.parse(body)

      const result = await responsibleContactService.update(id, data)

      return success(result, { message: 'Responsible updated successfully' })
    } catch (err) {
      return error(err)
    }
  }
}

export const responsibleController = new ResponsibleController()
