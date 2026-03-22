import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const letter = searchParams.get('letter') || ''
    const search = searchParams.get('search') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = { isActive: true }

    if (letter) {
      where.user = { name: { startsWith: letter, mode: 'insensitive' } }
    } else if (search) {
      where.user = { name: { contains: search, mode: 'insensitive' } }
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        select: {
          id: true,
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { user: { name: 'asc' } },
        take: limit,
        skip: offset,
      }),
      prisma.patient.count({ where }),
    ])

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

    return success({
      patients: patients.map(p => ({
        id: p.id,
        name: p.user.name || 'Sem nome',
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + patients.length < total,
      },
      letters,
    })
  } catch (err) {
    return error(err)
  }
}
