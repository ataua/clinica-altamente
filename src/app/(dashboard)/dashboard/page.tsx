'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  scheduledAppointments: number
  confirmedAppointments: number
  noShowRate: number
}

interface ProfessionalStats {
  professionalId: string
  professionalName: string
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
}

interface MonthlyTrend {
  month: string
  year: number
  total: number
  completed: number
  noShow: number
}

export default function DashboardPage() {
  const { status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [professionalStats, setProfessionalStats] = useState<ProfessionalStats[]>([])
  const [trend, setTrend] = useState<MonthlyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })

      const [statsRes, profRes, trendRes] = await Promise.all([
        fetch(`/api/reports?type=stats&${params}`),
        fetch(`/api/reports?type=professionals&${params}`),
        fetch(`/api/reports?type=trend&months=6`),
      ])

      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
      if (profRes.ok) {
        setProfessionalStats(await profRes.json())
      }
      if (trendRes.ok) {
        setTrend(await trendRes.json())
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">De:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Até:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total de Agendamentos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalAppointments}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Consultas Realizadas</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedAppointments}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Taxa de Faltosos</p>
                <p className="text-3xl font-bold text-red-600">{stats.noShowRate}%</p>
                <p className="text-xs text-gray-500">{stats.noShowAppointments} faltosos</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Agendados/Confirmados</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.scheduledAppointments}/{stats.confirmedAppointments}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Atendimentos por Profissional
                </h2>
                <div className="space-y-4">
                  {professionalStats.map((prof) => (
                    <div key={prof.professionalId} className="border-b dark:border-gray-700 pb-3 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {prof.professionalName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {prof.totalAppointments} consultas
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600">{prof.completedAppointments} concluídas</span>
                        <span className="text-red-600">{prof.noShowAppointments} faltosas</span>
                      </div>
                    </div>
                  ))}
                  {professionalStats.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tendência Mensal (Últimos 6 meses)
                </h2>
                <div className="space-y-4">
                  {trend.map((item, index) => {
                    const maxTotal = Math.max(...trend.map(t => t.total), 1)
                    const percentage = (item.total / maxTotal) * 100
                    return (
                      <div key={index} className="border-b dark:border-gray-700 pb-3 last:border-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {item.month}/{item.year}
                          </span>
                          <span className="text-sm text-gray-500">
                            {item.total} consultas
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex gap-4 text-xs mt-1">
                          <span className="text-green-600">{item.completed} concluídas</span>
                          <span className="text-red-600">{item.noShow} faltosas</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Resumo do Período
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalAppointments}
                  </p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completedAppointments}
                  </p>
                  <p className="text-sm text-gray-500">Concluídas</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {stats.cancelledAppointments}
                  </p>
                  <p className="text-sm text-gray-500">Canceladas</p>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.noShowAppointments}
                  </p>
                  <p className="text-sm text-gray-500">Faltosas</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
