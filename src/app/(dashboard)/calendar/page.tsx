'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CalendarGrid } from '@/components/organisms/CalendarGrid'
import { AppointmentModal } from '@/components/molecules/AppointmentModal'
import { Button } from '@/components/atoms/Button'
import { toast } from '@/components/ui/toast'

interface Patient {
  id: string
  name: string
}

interface Professional {
  id: string
  name: string
}

interface AppointmentType {
  id: string
  name: string
  durationMinutes: number
}

interface Appointment {
  id: string
  patientName: string
  professionalName: string
  appointmentType: string
  scheduledDateTime: string
  endDateTime: string
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes: string | null
  patientId: string
  professionalId: string
  appointmentTypeId: string
}

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)

      const params = new URLSearchParams()
      params.set('startDate', startOfMonth.toISOString())
      params.set('endDate', endOfMonth.toISOString())
      params.set('limit', '100')

      const [appointmentsRes, patientsRes, professionalsRes, typesRes] = await Promise.all([
        fetch(`/api/appointments?${params}`),
        fetch('/api/patients?limit=100'),
        fetch('/api/appointments/professionals'),
        fetch('/api/appointments/types'),
      ])

      const appointmentsData = await appointmentsRes.json()
      const patientsData = await patientsRes.json()
      const professionalsData = await professionalsRes.json()
      const typesData = await typesRes.json()

      if (appointmentsRes.ok) {
        setAppointments(appointmentsData.appointments || [])
      }
      if (patientsRes.ok) {
        setPatients(patientsData.patients?.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) || [])
      }
      if (professionalsRes.ok) {
        setProfessionals(professionalsData.map((p: { id: string; user: { name: string } }) => ({
          id: p.id,
          name: p.user.name
        })) || [])
      }
      if (typesRes.ok) {
        setAppointmentTypes(typesData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados', {
        description: 'Não foi possível carregar os dados do calendário',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router, fetchData])

  const handleCreateAppointment = async (data: {
    patientId: string
    professionalId: string
    appointmentTypeId: string
    scheduledDateTime: string
    notes: string
  }) => {
    try {
      setSubmitting(true)
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setSelectedDate(undefined)
        fetchData()
        toast.success('Agendamento criado com sucesso!')
      } else {
        const error = await res.json()
        toast.error('Erro ao criar agendamento', {
          description: error.message || 'Verifique os dados e tente novamente',
        })
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error('Erro ao criar agendamento', {
        description: 'Tente novamente mais tarde',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        fetchData()
        toast.success('Status atualizado com sucesso!')
      } else {
        const error = await res.json()
        toast.error('Erro ao atualizar status', {
          description: error.message || 'Tente novamente',
        })
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Erro ao atualizar status', {
        description: 'Tente novamente mais tarde',
      })
    }
  }

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return

    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })

      if (res.ok) {
        setIsModalOpen(false)
        setSelectedAppointment(undefined)
        fetchData()
        toast.success('Agendamento excluído com sucesso!')
      } else {
        const error = await res.json()
        toast.error('Erro ao excluir agendamento', {
          description: error.message || 'Tente novamente',
        })
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast.error('Erro ao excluir agendamento', {
        description: 'Tente novamente mais tarde',
      })
    }
  }

  const handleEventClick = (id: string) => {
    const appointment = appointments.find((a) => a.id === id)
    if (appointment) {
      setSelectedAppointment(appointment)
      setSelectedDate(undefined)
      setIsModalOpen(true)
    }
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedAppointment(undefined)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAppointment(undefined)
    setSelectedDate(undefined)
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Calendário de Agendamentos
            </h1>
            <Button onClick={() => { setSelectedAppointment(undefined); setSelectedDate(new Date()); setIsModalOpen(true); }}>
              + Novo Agendamento
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CalendarGrid
          appointments={appointments}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
        />

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Legenda</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-500"></span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Agendado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-500"></span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-yellow-500"></span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Em Andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-gray-500"></span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500"></span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Cancelado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-orange-500"></span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Não Compareceu</span>
            </div>
          </div>
        </div>
      </main>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateAppointment}
        onUpdateStatus={selectedAppointment ? (status) => handleUpdateStatus(selectedAppointment.id, status) : undefined}
        onDelete={selectedAppointment ? () => handleDeleteAppointment(selectedAppointment.id) : undefined}
        initialData={selectedAppointment}
        patients={patients}
        professionals={professionals}
        appointmentTypes={appointmentTypes}
        selectedSlot={selectedDate?.toISOString()}
        isLoading={submitting}
      />
    </div>
  )
}
