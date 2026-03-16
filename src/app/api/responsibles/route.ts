import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { responsibleContactService } from '@/services/responsible.service'
import { CreateResponsibleDTO, ResponsibleQueryDTO } from '@/dtos/patient.dto'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = ResponsibleQueryDTO.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
    })

    const result = await responsibleContactService.findAll(query)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching responsibles:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Erro ao buscar responsáveis' },
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

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SECRETARY' && session.user.role !== 'PROFESSIONAL') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = CreateResponsibleDTO.parse(body)

    if (data.cpf) {
      const existingResponsible = await responsibleContactService.findByCpf(data.cpf)
      if (existingResponsible) {
        return NextResponse.json(
          { error: 'Conflict', message: 'CPF já cadastrado' },
          { status: 409 }
        )
      }
    }

    const existingPhone = await responsibleContactService.findByPhone(data.phone)
    if (existingPhone) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Telefone já cadastrado' },
        { status: 409 }
      )
    }

    const responsible = await responsibleContactService.create(data)

    return NextResponse.json(
      { message: 'Responsável criado com sucesso', responsible },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating responsible:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Erro ao criar responsável' },
      { status: 500 }
    )
  }
}
