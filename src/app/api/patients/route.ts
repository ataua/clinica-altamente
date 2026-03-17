import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { patientService } from '@/services/patient.service'
import { CreatePatientDTO, PatientQueryDTO } from '@/dtos/patient.dto'
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

    const { searchParams } = new URL(request.url)
    const query = PatientQueryDTO.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
    })

    const result = await patientService.findAll(query)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching patients:', error)
    const message = error instanceof Error ? error.message : 'Erro ao buscar pacientes'
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

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SECRETARY' && session.user.role !== 'PROFESSIONAL') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = CreatePatientDTO.parse(body)

    if (data.cpf) {
      const existingPatient = await patientService.findByCpf(data.cpf)
      if (existingPatient) {
        return NextResponse.json(
          { error: 'Conflict', message: 'CPF já cadastrado' },
          { status: 409 }
        )
      }
    }

    const patient = await patientService.create(data)

    return NextResponse.json(
      { message: 'Paciente criado com sucesso', patient },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating patient:', error)
    const message = error instanceof Error ? error.message : 'Erro ao criar paciente'
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    )
  }
}
