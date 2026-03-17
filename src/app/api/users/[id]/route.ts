import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { userService } from '@/services/user.service'
import { UpdateUserDTO, UserParamsDTO } from '@/dtos/user.dto'
import { ZodError } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { id } = UserParamsDTO.parse(await params)

    if (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR' && session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Acesso negado' },
        { status: 403 }
      )
    }

    const user = await userService.findById(id)

    if (!user) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error fetching user:', error)
    const message = error instanceof Error ? error.message : 'Erro ao buscar usuário'
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { id } = UserParamsDTO.parse(await params)

    const body = await request.json()
    const data = UpdateUserDTO.parse(body)

    const existingUser = await userService.findById(id)
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (session.user.role !== 'ADMIN' && session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Acesso negado' },
        { status: 403 }
      )
    }

    if (data.email && data.email !== existingUser.email) {
      const emailExists = await userService.findByEmail(data.email)
      if (emailExists) {
        return NextResponse.json(
          { error: 'Conflict', message: 'Email já está em uso' },
          { status: 409 }
        )
      }
    }

    const user = await userService.update(id, data)

    return NextResponse.json({ message: 'Usuário atualizado com sucesso', user })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating user:', error)
    const message = error instanceof Error ? error.message : 'Erro ao atualizar usuário'
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Acesso negado. Apenas administradores podem excluir usuários.' },
        { status: 403 }
      )
    }

    const { id } = UserParamsDTO.parse(await params)

    const existingUser = await userService.findById(id)
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Você não pode excluir seu próprio usuário' },
        { status: 400 }
      )
    }

    await userService.delete(id)

    return NextResponse.json({ message: 'Usuário excluído com sucesso' })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error deleting user:', error)
    const message = error instanceof Error ? error.message : 'Erro ao excluir usuário'
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    )
  }
}
