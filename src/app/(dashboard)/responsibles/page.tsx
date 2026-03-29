'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSessionContext } from '@/contexts/SessionContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button'
import { AppointmentStatusBadge } from '@/components/atoms/AppointmentStatusBadge'
import { toast } from '@/components/ui/toast'

interface Patient {
  id: string
  name: string
  dateOfBirth: string | null
}

interface Appointment {
  id: string
  patientId: string
  patientName: string
  professionalName: string
  scheduledDateTime: string
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
}

interface Attendance {
  id: string
  startTime: string
  endTime: string | null
  status: string
  diagnosis: string | null
  treatmentPlan: string | null
  professionalName: string
  specialty: string
}

export default function ResponsiblesPage() {
  const { status, data: session } = useSessionContext()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [activeTab, setActiveTab] = useState<'appointments' | 'history'>('appointments')
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [requestData, setRequestData] = useState({
    patientId: '',
    specialty: '',
    preferredDate: '',
    notes: '',
  })

  const isResponsible = session?.user?.role === 'RESPONSIBLE'

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      
      const patientsRes = await fetch('/api/responsibles/patients')
      const patientsData = await patientsRes.json()

      if (patientsRes.ok && patientsData.data?.patients) {
        setPatients(patientsData.data.patients)
        if (patientsData.data.patients.length > 0 && !selectedPatientId) {
          setSelectedPatientId(patientsData.data.patients[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, selectedPatientId])

  const fetchAppointments = useCallback(async () => {
    if (!selectedPatientId) return

    try {
      const params = new URLSearchParams()
      params.set('patientId', selectedPatientId)
      
      const [appointmentsRes, attendancesRes] = await Promise.all([
        fetch(`/api/appointments?${params}`),
        fetch(`/api/attendances?patientId=${selectedPatientId}&status=COMPLETED`),
      ])

      const appointmentsData = await appointmentsRes.json()
      const attendancesData = await attendancesRes.json()

      if (appointmentsRes.ok) {
        setAppointments(appointmentsData.data || [])
      }
      if (attendancesRes.ok) {
        const completed = (attendancesData.data || []).map((att: {
          id: string
          startTime: Date
          endTime: Date | null
          status: string
          diagnosis: string | null
          treatmentPlan: string | null
          professional?: { user: { name: string }; specialty: string }
        }) => ({
          id: att.id,
          startTime: att.startTime instanceof Date ? att.startTime.toISOString() : String(att.startTime),
          endTime: att.endTime ? (att.endTime instanceof Date ? att.endTime.toISOString() : String(att.endTime)) : null,
          status: att.status,
          diagnosis: att.diagnosis,
          treatmentPlan: att.treatmentPlan,
          professionalName: att.professional?.user?.name || 'Profissional',
          specialty: att.professional?.specialty || '',
        }))
        setAttendances(completed)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }, [selectedPatientId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && !isResponsible) {
      router.push('/')
    } else if (status === 'authenticated' && isResponsible && session?.user?.id) {
      fetchData()
    }
  }, [status, router, isResponsible, session?.user?.id, fetchData])

  useEffect(() => {
    if (selectedPatientId) {
      fetchAppointments()
    }
  }, [selectedPatientId, fetchAppointments])

  const handleSubmitRequest = async () => {
    if (!requestData.patientId || !requestData.preferredDate) {
      toast.error('Por favor, selecione o paciente e a data desejada')
      return
    }

    try {
      const res = await fetch('/api/appointments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: requestData.patientId,
          preferredDate: requestData.preferredDate,
          notes: requestData.notes,
        }),
      })

      if (res.ok) {
        toast.success('Solicitação enviada com sucesso! Aguarde a confirmação da recepção.')
        setIsRequestModalOpen(false)
        setRequestData({
          patientId: '',
          specialty: '',
          preferredDate: '',
          notes: '',
        })
        fetchAppointments()
      } else {
        const error = await res.json()
        toast.error(error.message || 'Erro ao enviar solicitação')
      }
    } catch {
      toast.error('Erro ao enviar solicitação')
    }
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('pt-BR')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR')
  }

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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Portal do Responsável
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gerencie os agendamentos dos seus dependentes
              </p>
            </div>
            <Button onClick={() => {
              setRequestData(prev => ({ ...prev, patientId: selectedPatientId || '' }))
              setIsRequestModalOpen(true)
            }}>
              + Solicitar Agendamento
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {patients.length > 0 ? (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selecione o dependente:
              </label>
              <div className="flex flex-wrap gap-2">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPatientId === patient.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {patient.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className={`text-lg font-semibold ${
                      activeTab === 'appointments'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Agendamentos
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`text-lg font-semibold ${
                      activeTab === 'history'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Histórico de Atendimentos
                  </button>
                </div>
              </div>

              {activeTab === 'appointments' && (
                <>
                  {appointments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Nenhum agendamento encontrado para este paciente.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {appointments.map((apt) => (
                        <div key={apt.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDateTime(apt.scheduledDateTime)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Profissional: {apt.professionalName}
                            </p>
                          </div>
                          <AppointmentStatusBadge status={apt.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'history' && (
                <>
                  {attendances.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Nenhum atendimento concluído para este paciente.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {attendances.map((att) => (
                        <div key={att.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {formatDateTime(att.startTime)}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {att.professionalName} - {att.specialty}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              Concluído
                            </span>
                          </div>
                          {att.diagnosis && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Diagnóstico:</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{att.diagnosis}</p>
                            </div>
                          )}
                          {att.treatmentPlan && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Plano de Tratamento:</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{att.treatmentPlan}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Você não possui pacientes vinculados ao seu cadastro.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Entre em contato com a clínica para vincular pacientes ao seu responsável.
            </p>
          </div>
        )}
      </main>

      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsRequestModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Solicitar Agendamento
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Paciente *
                </label>
                <select
                  value={requestData.patientId}
                  onChange={(e) => setRequestData(prev => ({ ...prev, patientId: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Preferencial *
                </label>
                <input
                  type="date"
                  value={requestData.preferredDate}
                  onChange={(e) => setRequestData(prev => ({ ...prev, preferredDate: e.target.value }))}
                  min={formatDate(new Date().toISOString())}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={requestData.notes}
                  onChange={(e) => setRequestData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Descreva o motivo da consulta ou observações importantes..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitRequest}>
                Enviar Solicitação
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
