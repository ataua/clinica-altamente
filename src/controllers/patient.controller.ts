import type { NextRequest } from 'next/server'
import { BaseController } from './base.controller'
import { patientService } from '@/services/patient.service'
import { CreatePatientDTO, UpdatePatientDTO, PatientParamsDTO, PatientQueryDTO } from '@/dtos/patient.dto'
import { success, created, error, notFound, conflict, paginated } from '@/lib/response'
import { generatePatientLinks } from '@/lib/hateoas'

export class PatientController extends BaseController {
  async findAll(request: NextRequest) {
    try {
      await this.requireAuth()

      const { searchParams } = new URL(request.url)
      const query = PatientQueryDTO.parse({
        page: searchParams.get('page') || undefined,
        limit: searchParams.get('limit') || undefined,
        search: searchParams.get('search') || undefined,
      })

      const result = await patientService.findAll(query)

      return paginated(
        result.patients,
        {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
        },
        request.nextUrl.origin,
        '/patients',
        { search: query.search || '' }
      )
    } catch (err) {
      return error(err)
    }
  }

  async findById(params: Promise<{ id: string }>) {
    try {
      await this.requireAuth()
      const { id } = PatientParamsDTO.parse(await params)

      const result = await patientService.findById(id)
      if (!result) return notFound('Patient')

      return success(result, {
        links: generatePatientLinks(id, result.userId),
      })
    } catch (err) {
      return error(err)
    }
  }

  async create(request: NextRequest) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, ['ADMIN', 'SECRETARY', 'PROFESSIONAL'])

      const body = await request.json()
      const data = CreatePatientDTO.parse(body)

      if (data.cpf) {
        const existing = await patientService.findByCpf(data.cpf)
        if (existing) return conflict('CPF already registered')
      }

      const result = await patientService.create(data)

      return created(result, 'Patient created successfully', {
        self: { href: `/api/patients/${result.id}` },
        user: { href: `/api/users/${result.userId}` },
      })
    } catch (err) {
      return error(err)
    }
  }

  async update(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      await this.requireAuth()
      const { id } = PatientParamsDTO.parse(await params)

      const body = await request.json()
      const data = UpdatePatientDTO.parse(body)

      const existing = await patientService.findById(id)
      if (!existing) return notFound('Patient')

      if (data.cpf && data.cpf !== existing.cpf) {
        const cpfExists = await patientService.findByCpf(data.cpf)
        if (cpfExists) return conflict('CPF already in use')
      }

      const result = await patientService.update(id, data)

      return success(result, {
        message: 'Patient updated successfully',
        links: generatePatientLinks(id, result.userId),
      })
    } catch (err) {
      return error(err)
    }
  }

  async delete(params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, ['ADMIN'])

      const { id } = PatientParamsDTO.parse(await params)

      const existing = await patientService.findById(id)
      if (!existing) return notFound('Patient')

      await patientService.delete(id)

      return success(null, { message: 'Patient deleted successfully' })
    } catch (err) {
      return error(err)
    }
  }
}

export const patientController = new PatientController()
