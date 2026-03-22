import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reportService } from '@/services/report.service'
import { 
  getIndividualReportTemplate, 
  getConsolidatedReportTemplate 
} from '@/lib/report-templates'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR' && session.user.role !== 'PROFESSIONAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { type, patientId, startDate, endDate } = body

    if (!type || !['individual', 'consolidated'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid report type. Use "individual" or "consolidated"' },
        { status: 400 }
      )
    }

    const params = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }

    if (type === 'individual') {
      if (!patientId) {
        return NextResponse.json(
          { error: 'Patient ID is required for individual report' },
          { status: 400 }
        )
      }

      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          user: {
            select: { name: true, email: true, phone: true },
          },
        },
      })

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        )
      }

      const appointments = await prisma.appointment.findMany({
        where: { 
          patientId,
          ...(params.startDate || params.endDate ? {
            scheduledDateTime: {
              ...(params.startDate && { gte: params.startDate }),
              ...(params.endDate && { lte: params.endDate }),
            },
          } : {}),
        },
        include: {
          professional: {
            include: {
              user: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { scheduledDateTime: 'desc' },
      })

      const reportData = {
        patientName: patient.user.name || 'Paciente',
        patientEmail: patient.user.email,
        patientPhone: patient.user.phone,
        period: {
          start: params.startDate?.toLocaleDateString('pt-BR') || 'Início',
          end: params.endDate?.toLocaleDateString('pt-BR') || 'Atual',
        },
        totalAppointments: appointments.length,
        attendedAppointments: appointments.filter(a => a.status === 'COMPLETED').length,
        missedAppointments: appointments.filter(a => a.status === 'NO_SHOW').length,
        appointments: appointments.map(apt => ({
          date: new Date(apt.scheduledDateTime).toLocaleDateString('pt-BR'),
          time: new Date(apt.scheduledDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          professional: apt.professional.user.name || 'Unknown',
          status: apt.status === 'COMPLETED' ? 'Compareceu' : apt.status === 'NO_SHOW' ? 'Faltou' : apt.status,
        })),
      }

      const html = getIndividualReportTemplate(reportData)

      return NextResponse.json({
        html,
        filename: `relatorio-paciente-${patient.user.name?.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.html`,
      })
    }

    if (type === 'consolidated') {
      const stats = await reportService.getDashboardStats(params)
      const professionalStats = await reportService.getProfessionalStats(params)

      const reportData = {
        period: {
          start: params.startDate?.toLocaleDateString('pt-BR') || 'Início',
          end: params.endDate?.toLocaleDateString('pt-BR') || 'Atual',
        },
        totalAppointments: stats.totalAppointments,
        completedAppointments: stats.completedAppointments,
        cancelledAppointments: stats.cancelledAppointments,
        noShowAppointments: stats.noShowAppointments,
        noShowRate: stats.noShowRate,
        professionals: professionalStats.map(p => ({
          name: p.professionalName,
          total: p.totalAppointments,
          completed: p.completedAppointments,
          noShow: p.noShowAppointments,
        })),
      }

      const html = getConsolidatedReportTemplate(reportData)

      return NextResponse.json({
        html,
        filename: `relatorio-consolidado-${Date.now()}.html`,
      })
    }

    return NextResponse.json(
      { error: 'Invalid report type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
