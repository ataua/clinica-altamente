import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { reportService } from '@/services/report.service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR' && session.user.role !== 'PROFESSIONAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'stats'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const professionalId = searchParams.get('professionalId')

    const params = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      professionalId: professionalId || undefined,
    }

    switch (type) {
      case 'stats':
        const stats = await reportService.getDashboardStats(params)
        return NextResponse.json(stats)

      case 'professionals':
        const professionalStats = await reportService.getProfessionalStats(params)
        return NextResponse.json(professionalStats)

      case 'no-show':
        const noShowPatients = await reportService.getNoShowPatients(params)
        return NextResponse.json(noShowPatients)

      case 'trend':
        const months = parseInt(searchParams.get('months') || '6')
        const trend = await reportService.getMonthlyTrend(months)
        return NextResponse.json(trend)

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
