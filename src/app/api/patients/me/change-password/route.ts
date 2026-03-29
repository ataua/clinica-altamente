import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/bcrypt'
import { success, error } from '@/lib/response'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const role = session.user.role

    if (role !== 'PATIENT' && role !== 'RESPONSIBLE') {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters', code: 'WEAK_PASSWORD' },
        { status: 400 }
      )
    }

    const patient = await prisma.patient.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        user: true,
      },
    })

    if (!patient || !patient.user) {
      return NextResponse.json(
        { error: 'Patient not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const isValid = await verifyPassword(currentPassword, patient.user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect', code: 'INVALID_PASSWORD' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return success({ message: 'Password changed successfully' })
  } catch (err) {
    console.error('Error changing password:', err)
    return NextResponse.json(
      { error: 'Error changing password', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
