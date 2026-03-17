'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/atoms/Button'
import { AppointmentStatusBadge } from '@/components/atoms/AppointmentStatusBadge'
import { AttendanceModal } from '@/components/molecules/AttendanceModal'
import { toast } from '@/components/ui/toast'

interface Appointment {
  id: string
  scheduledDateTime: string
  endDateTime: string
  status: string
  appointmentType: {
    name: string
  }
  professional: {
    id: string
    user: {
      name: string | null
    }
    specialty: string
  }
}

interface Attendance {
  id: string
  startTime: string
  endTime: string | null
  status: string
  notes: string | null
  observations: string | null
  diagnosis: string | null
  treatmentPlan: string | null
  professional: {
    user: {
      name: string | null
    }
    specialty: string
  }
}

interface Patient {
  id: string
  user: {
    name: string | null
    email: string | null
  }
  dateOfBirth: string | null
  phone: string | null
}

export default function PatientHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'appointments' | 'attendances'>('appointments')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>()
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      const [patientRes, appointmentsRes, attendancesRes] = await Promise.all([
        fetch(`/api/patients/${patientId}`),
        fetch(`/api/appointments?patientId=${patientId}&limit=100`),
        fetch(`/api/attendances?patientId=${patientId}&limit=100`),
      ])

      const patientData = await patientRes.json()
      const appointmentsData = await appointmentsRes.json()
      const attendancesData = await attendancesRes.json()

      if (patientRes.ok) setPatient(patientData)
      if (appointmentsRes.ok) setAppointments(appointmentsData.appointments || [])
      if (attendancesRes.ok) setAttendances(attendancesData.attendances || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router, fetchData])

  const handleCreateAttendance = async (data: any) => {
    try {
      setSubmitting(true)
      const res = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast.success('Atendimento registrado com sucesso!')
        setIsModalOpen(false)
        fetchData()
      } else {
        const error = await res.json()
        toast.error('Erro ao registrar atendimento', { description: error.message })
      }
    } catch (error) {
      console.error('Error creating attendance:', error)
      toast.error('Erro ao registrar atendimento')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartAttendance = async (appointmentId: string) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      })

      if (res.ok) {
        toast.success('Atendimento iniciado!')
        fetchData()
      } else {
        toast.error('Erro ao iniciar atendimento')
      }
    } catch (error) {
      toast.error('Erro ao iniciar atendimento')
    }
  }

  const handleCompleteAttendance = async (appointmentId: string) => {
    setSelectedAppointment(appointments.find(a => a.id === appointmentId))
    setIsModalOpen(true)
  }

  const statusColors: Record<string, string> = {
    SCHEDULED: 'blue',
    CONFIRMED: 'green',
    IN_PROGRESS: 'yellow',
    COMPLETED: 'green',
    CANCELLED: 'red',
    NO_SHOW: 'orange',
    PENDING: 'gray',
  }

  const statusLabels: Record<string, string> = {
    SCHEDULED: 'Agendado',
    CONFIRMED: 'Confirmado',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
    NO_SHOW: 'Não Compareceu',
    PENDING: 'Pendente',
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Histórico do Paciente
              </h1>
              {patient && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {patient.user.name} - {patient.user.email}
                </p>
              )}
            </div>
            <Button variant="outline" onClick={() => router.push('/patients')}>
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'appointments'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Agendamentos ({appointments.length})
              </button>
              <button
                onClick={() => setActiveTab('attendances')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attendances'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Atendimentos ({attendances.length})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'appointments' ? (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500">
                Nenhum agendamento encontrado
              </div>
            ) : (
              appointments.map((apt) => (
                <div key={apt.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {apt.appointmentType.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(apt.scheduledDateTime).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Dr(a). {apt.professional.user.name} - {apt.professional.specialty}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={apt.status as any} />
                  </div>
                  {(apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED') && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleStartAttendance(apt.id)}
                      >
                        Iniciar Atendimento
                      </Button>
                    </div>
                  )}
                  {apt.status === 'IN_PROGRESS' && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCompleteAttendance(apt.id)}
                      >
                        Concluir Atendimento
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {attendances.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500">
                Nenhum atendimento encontrado
              </div>
            ) : (
              attendances.map((att) => (
                <div key={att.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(att.startTime).toLocaleString('pt-BR')}
                        {att.endTime && ` - ${new Date(att.endTime).toLocaleString('pt-BR')}`}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Dr(a). {att.professional.user.name} - {att.professional.specialty}
                      </p>
                      {att.diagnosis && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Diagnóstico:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{att.diagnosis}</p>
                        </div>
                      )}
                      {att.treatmentPlan && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Plano de Tratamento:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{att.treatmentPlan}</p>
                        </div>
                      )}
                      {att.observations && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observações:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{att.observations}</p>
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      att.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      att.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      att.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {statusLabels[att.status]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <AttendanceModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedAppointment(undefined); }}
        onSubmit={handleCreateAttendance}
        appointmentId={selectedAppointment?.id || ''}
        patientId={patientId}
        professionalId={selectedAppointment?.professional.id || ''}
        patientName={patient?.user.name || ''}
        professionalName={selectedAppointment?.professional.user.name || ''}
        appointmentDate={selectedAppointment?.scheduledDateTime || ''}
        isLoading={submitting}
      />
    </div>
  )
}
