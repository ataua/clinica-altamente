import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { patientService } from '@/services/patient.service'
import { UpdatePatientDTO, PatientParamsDTO } from '@/dtos/patient.dto'

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

    const { id } = PatientParamsDTO.parse(await params)
    const patient = await patientService.findById(id)

    if (!patient) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Paciente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(patient)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Erro ao buscar paciente' },
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

    const { id } = PatientParamsDTO.parse(await params)

    const existingPatient = await patientService.findById(id)
    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Paciente não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = UpdatePatientDTO.parse(body)

    if (data.cpf && data.cpf !== existingPatient.cpf) {
      const cpfExists = await patientService.findByCpf(data.cpf)
      if (cpfExists) {
        return NextResponse.json(
          { error: 'Conflict', message: 'CPF já está em uso' },
          { status: 409 }
        )
      }
    }

    const patient = await patientService.update(id, data)

    return NextResponse.json({ message: 'Paciente atualizado com sucesso', patient })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating patient:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Erro ao atualizar paciente' },
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
        { error: 'Forbidden', message: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { id } = PatientParamsDTO.parse(await params)

    const existingPatient = await patientService.findById(id)
    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Paciente não encontrado' },
        { status: 404 }
      )
    }

    await patientService.delete(id)

    return NextResponse.json({ message: 'Paciente excluído com sucesso' })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error deleting patient:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Erro ao excluir paciente' },
      { status: 500 }
    )
  }
}
