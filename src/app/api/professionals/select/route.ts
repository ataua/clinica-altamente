import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const specialtyId = searchParams.get('specialtyId') || undefined

    const where: Record<string, unknown> = { isActive: true }
    if (specialtyId) {
      where.specialtyId = specialtyId
    }

    const professionals = await prisma.professional.findMany({
      where,
      select: {
        id: true,
        userId: true,
        specialtyId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    })

    return success({
      professionals: professionals.map(p => ({
        id: p.id,
        name: p.user.name || 'Sem nome',
        specialtyId: p.specialtyId,
        userId: p.userId,
      })),
    })
  } catch (err) {
    return error(err)
  }
}
