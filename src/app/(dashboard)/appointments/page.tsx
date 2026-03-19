'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Button } from '@/components/atoms/Button'
import { AppointmentStatusBadge } from '@/components/atoms/AppointmentStatusBadge'
import { toast } from '@/components/ui/toast'

interface Appointment {
  id: string
  patientName: string
  professionalName: string
  appointmentType: string
  scheduledDateTime: string
  endDateTime: string
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes: string | null
  cancellationReason: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'NO_SHOW', label: 'Não Compareceu' },
]

export default function AppointmentsPage() {
  const { status } = useSession()
  const router = useRouter()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/appointments?${params}`)
      const data = await res.json()
      
      if (res.ok) {
        let filtered = data.data || []
        
        if (searchTerm) {
          filtered = filtered.filter((apt: Appointment) =>
            apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.professionalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.appointmentType?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        
        setAppointments(filtered)
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Erro ao carregar agendamentos', {
        description: 'Tente novamente mais tarde',
      })
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter, searchTerm])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchAppointments()
    }
  }, [status, router, fetchAppointments])

  const handleCancelAppointment = async (id: string) => {
    const reason = prompt('Motivo do cancelamento:')
    if (!reason) return

    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (res.ok) {
        fetchAppointments()
        toast.success('Agendamento cancelado com sucesso!')
      } else {
        const error = await res.json()
        toast.error('Erro ao cancelar agendamento', {
          description: error.message || 'Tente novamente',
        })
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error('Erro ao cancelar agendamento', {
        description: 'Tente novamente mais tarde',
      })
    }
  }

  const handleReschedule = async (id: string) => {
    const newDateTime = prompt('Nova data/hora (YYYY-MM-DDTHH:mm):')
    if (!newDateTime) return

    try {
      const res = await fetch(`/api/appointments/${id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDateTime: newDateTime }),
      })

      if (res.ok) {
        fetchAppointments()
        toast.success('Agendamento reagendado com sucesso!')
      } else {
        const error = await res.json()
        toast.error('Erro ao reagendar', {
          description: error.message || 'Tente novamente',
        })
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      toast.error('Erro ao reagendar', {
        description: 'Tente novamente mais tarde',
      })
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })

      if (res.ok) {
        fetchAppointments()
        toast.success('Agendamento confirmado!')
      } else {
        toast.error('Erro ao confirmar agendamento')
      }
    } catch {
      toast.error('Erro ao confirmar agendamento')
    }
  }

  const handleStart = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      })

      if (res.ok) {
        fetchAppointments()
        toast.success('Atendimento iniciado!')
      } else {
        toast.error('Erro ao iniciar atendimento')
      }
    } catch {
      toast.error('Erro ao iniciar atendimento')
    }
  }

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      if (res.ok) {
        fetchAppointments()
        toast.success('Atendimento concluído!')
      } else {
        toast.error('Erro ao concluir atendimento')
      }
    } catch {
      toast.error('Erro ao concluir atendimento')
    }
  }

  const handleNoShow = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'NO_SHOW' }),
      })

      if (res.ok) {
        fetchAppointments()
        toast.warning('Paciente não compareceu')
      } else {
        toast.error('Erro ao registrar ausência')
      }
    } catch {
      toast.error('Erro ao registrar ausência')
    }
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('pt-BR')
  }

  if (status === 'loading' || loading && appointments.length === 0) {
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
              Agendamentos
            </h1>
            <Button onClick={() => router.push('/calendar')}>
              Ver Calendário
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por paciente, profissional ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAppointments()}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            className="w-full sm:w-48"
          />
          <Button variant="outline" onClick={fetchAppointments}>
            Buscar
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Nenhum agendamento encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Data/Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Paciente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Profissional
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {formatDateTime(apt.scheduledDateTime)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {apt.patientName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {apt.professionalName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {apt.appointmentType}
                      </td>
                      <td className="px-4 py-3">
                        <AppointmentStatusBadge status={apt.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end flex-wrap">
                          {apt.status === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => handleConfirm(apt.id)}
                                className="text-sm text-green-600 hover:text-green-700 font-medium"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => handleNoShow(apt.id)}
                                className="text-sm text-orange-600 hover:text-orange-700"
                              >
                                Não Compareceu
                              </button>
                            </>
                          )}
                          {apt.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleStart(apt.id)}
                              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                            >
                              Iniciar
                            </button>
                          )}
                          {apt.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleComplete(apt.id)}
                              className="text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                              Concluir
                            </button>
                          )}
                          {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'IN_PROGRESS') && (
                            <>
                              <button
                                onClick={() => handleReschedule(apt.id)}
                                className="text-sm text-blue-600 hover:text-blue-700"
                              >
                                Reagendar
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(apt.id)}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} agendamentos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
