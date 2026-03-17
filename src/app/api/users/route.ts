import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { userService } from '@/services/user.service'
import { CreateUserDTO, UserQueryDTO } from '@/dtos/user.dto'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Acesso negado. Apenas administradores e coordenadores podem listar usuários.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = UserQueryDTO.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      role: searchParams.get('role'),
      search: searchParams.get('search'),
    })

    const result = await userService.findAll(query)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching users:', error)
    const message = error instanceof Error ? error.message : 'Erro ao buscar usuários'
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
        { error: 'Forbidden', message: 'Acesso negado. Apenas administradores podem criar usuários.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = CreateUserDTO.parse(body)

    const existingUser = await userService.findByEmail(data.email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Email já cadastrado' },
        { status: 409 }
      )
    }

    const user = await userService.create(data)

    return NextResponse.json(
      { message: 'Usuário criado com sucesso', user },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating user:', error)
    const message = error instanceof Error ? error.message : 'Erro ao criar usuário'
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    )
  }
}
