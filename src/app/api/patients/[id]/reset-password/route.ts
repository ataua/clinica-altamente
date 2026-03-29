import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/bcrypt'

function generateRandomPassword(length: number = 8): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  const array = new Uint32Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 0xffffffff)
    }
  }
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length]
  }
  return password
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: true,
      },
    })

    if (!patient || !patient.user) {
      return NextResponse.json(
        { error: 'Paciente não encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const newPassword = generateRandomPassword(8)
    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: patient.userId },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      data: {
        patientId: patient.id,
        patientName: patient.user.name,
        email: patient.user.email,
        generatedPassword: newPassword,
      },
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Erro ao resetar senha', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
