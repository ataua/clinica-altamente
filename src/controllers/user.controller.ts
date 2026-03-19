import type { NextRequest } from 'next/server'
import { BaseController } from './base.controller'
import { userService } from '@/services/user.service'
import { CreateUserDTO, UpdateUserDTO, UserParamsDTO, UserQueryDTO } from '@/dtos/user.dto'
import { success, created, error, notFound, conflict, paginated } from '@/lib/response'
import { generateResourceLinks } from '@/lib/hateoas'

export class UserController extends BaseController {
  async findAll(request: NextRequest) {
    try {
      await this.requireAuth()

      const { searchParams } = new URL(request.url)
      const query = UserQueryDTO.parse({
        page: searchParams.get('page') || undefined,
        limit: searchParams.get('limit') || undefined,
        role: searchParams.get('role') || undefined,
        search: searchParams.get('search') || undefined,
      })

      const result = await userService.findAll(query)

      return paginated(
        result.users,
        {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
        },
        request.nextUrl.origin,
        '/users',
        { role: query.role || '', search: query.search || '' }
      )
    } catch (err) {
      return error(err)
    }
  }

  async findById(params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      const { id } = UserParamsDTO.parse(await params)

      if (!this.canAccess(user, id, ['ADMIN', 'COORDINATOR'])) {
        return conflict('Access denied')
      }

      const result = await userService.findById(id)
      if (!result) return notFound('User')

      return success(result, {
        links: generateResourceLinks('/users', id, ['GET', 'PUT', 'DELETE']),
      })
    } catch (err) {
      return error(err)
    }
  }

  async create(request: NextRequest) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, ['ADMIN'])

      const body = await request.json()
      const data = CreateUserDTO.parse(body)

      const existing = await userService.findByEmail(data.email)
      if (existing) return conflict('Email already registered')

      const result = await userService.create(data)

      return created(result, 'User created successfully', {
        self: { href: `/api/users/${result.id}` },
      })
    } catch (err) {
      return error(err)
    }
  }

  async update(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      const { id } = UserParamsDTO.parse(await params)

      if (!this.canAccess(user, id, ['ADMIN'])) {
        return conflict('Access denied')
      }

      const body = await request.json()
      const data = UpdateUserDTO.parse(body)

      const existing = await userService.findById(id)
      if (!existing) return notFound('User')

      if (data.email && data.email !== existing.email) {
        const emailExists = await userService.findByEmail(data.email)
        if (emailExists) return conflict('Email already in use')
      }

      const result = await userService.update(id, data)

      return success(result, {
        message: 'User updated successfully',
        links: generateResourceLinks('/users', id, ['GET', 'PUT', 'DELETE']),
      })
    } catch (err) {
      return error(err)
    }
  }

  async delete(params: Promise<{ id: string }>) {
    try {
      const user = await this.requireAuth()
      this.requireRole(user, ['ADMIN'])

      const { id } = UserParamsDTO.parse(await params)

      if (id === user.id) {
        return error({ status: 400, message: 'Cannot delete your own user' })
      }

      const existing = await userService.findById(id)
      if (!existing) return notFound('User')

      await userService.delete(id)

      return success(null, { message: 'User deleted successfully' })
    } catch (err) {
      return error(err)
    }
  }
}

export const userController = new UserController()
