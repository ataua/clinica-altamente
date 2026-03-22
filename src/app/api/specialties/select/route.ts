import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (isActive === 'true') {
      where.isActive = true
    }

    const specialties = await prisma.specialty.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    })

    return success({ specialties })
  } catch (err) {
    return error(err)
  }
}
