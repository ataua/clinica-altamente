import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { success } from '@/lib/response'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return success({ teachers: [] })
    }

    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    })

    const formattedTeachers = teachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.user?.name || 'Professor',
    }))

    return success({ teachers: formattedTeachers })
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return success({ teachers: [] })
  }
}
