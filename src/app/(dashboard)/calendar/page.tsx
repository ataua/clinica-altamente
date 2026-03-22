'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CalendarGrid } from '@/components/organisms/CalendarGrid'
import { AppointmentModal } from '@/components/molecules/AppointmentModal'
import { TimeSlotPicker } from '@/components/molecules/TimeSlotPicker'
import { Button } from '@/components/atoms/Button'
import { toast } from '@/components/ui/toast'

interface Patient {
  id: string
  name: string
}

interface Specialty {
  id: string
  name: string
}

interface Professional {
  id: string
  name: string
  specialtyId?: string | null
  userId?: string
}

interface Appointment {
  id: string
  patientName: string
  professionalName: string
  scheduledDateTime: string
  endDateTime: string
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes: string | null
  patientId: string
  professionalId: string
}

export default function CalendarPage() {
  const { status, data: session } = useSession()
  const router = useRouter()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [myProfessionalId, setMyProfessionalId] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTimeSlotPickerOpen, setIsTimeSlotPickerOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>()
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [filterPatientId, setFilterPatientId] = useState<string>('')
  const [filterProfessionalId, setFilterProfessionalId] = useState<string>('')

  const canCreateAppointments = session?.user?.role === 'ADMIN' || session?.user?.role === 'SECRETARY'
  const isProfessionalOnly = session?.user?.role === 'PROFESSIONAL'

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

      if (filterPatientId) {
        params.set('patientId', filterPatientId)
      }
      if (filterProfessionalId) {
        params.set('professionalId', filterProfessionalId)
      }

      const [appointmentsRes, patientsRes, professionalsRes, specialtiesRes] = await Promise.all([
        fetch(`/api/appointments?${params}`),
        fetch('/api/patients?limit=100'),
        fetch('/api/appointments/professionals'),
        fetch('/api/specialties?isActive=true'),
      ])

      const appointmentsData = await appointmentsRes.json()
      const patientsData = await patientsRes.json()
      const professionalsData = await professionalsRes.json()
      const specialtiesData = await specialtiesRes.json()

      if (appointmentsRes.ok) {
        setAppointments(appointmentsData.data || [])
      }
      if (patientsRes.ok) {
        const patientsList = patientsData.data?.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) || []
        setPatients(patientsList.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)))
      }
      if (specialtiesRes.ok) {
        const specialtiesList = (specialtiesData.data || []).map((s: { id: string; name: string }) => ({
          id: s.id,
          name: s.name
        }))
        setSpecialties(specialtiesList.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)))
      }
      if (professionalsRes.ok) {
        const professionalsList = (professionalsData.data || []).map((p: { id: string; user: { name: string }; specialtyId?: string | null; userId?: string }) => ({
          id: p.id,
          name: p.user.name,
          specialtyId: p.specialtyId,
          userId: p.userId
        }))
        setProfessionals(professionalsList.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)))
        
        if (session?.user?.role === 'PROFESSIONAL' && session?.user?.id) {
          const myProfessional = professionalsList.find((p: Professional) => p.userId === session.user.id)
          if (myProfessional) {
            setMyProfessionalId(myProfessional.id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados', {
        description: 'Não foi possível carregar os dados do calendário',
      })
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, session?.user?.role, filterPatientId, filterProfessionalId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      const role = session?.user?.role
      if (role !== 'ADMIN' && role !== 'SECRETARY' && role !== 'PROFESSIONAL') {
        router.push('/')
        return
      }
      fetchData()
    }
  }, [status, router, fetchData, session?.user?.role])

  const handleCreateAppointment = async (data: {
    patientId: string
    professionalId: string
    scheduledDateTime: string
    notes: string
  }) => {
    try {
      setSubmitting(true)
      
      const appointmentData = {
        ...data,
        professionalId: isProfessionalOnly && myProfessionalId ? myProfessionalId : data.professionalId,
      }
      
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
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
          description: error.message || 'Verifique os dados e tente novamente',
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
          description: error.message || 'Verifique os dados e tente novamente',
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
    if (!canCreateAppointments && !isProfessionalOnly) return
    
    setSelectedDate(date)
    setSelectedAppointment(undefined)
    
    if (isProfessionalOnly) {
      setIsModalOpen(true)
    } else {
      setIsTimeSlotPickerOpen(true)
    }
  }

  const handleSlotSelect = (time: string, professionalId: string) => {
    const dateStr = selectedDate?.toISOString().split('T')[0]
    setSelectedSlot(`${dateStr}T${time}:00.000Z`)
    setSelectedProfessionalId(professionalId)
    setIsTimeSlotPickerOpen(false)
    setIsModalOpen(true)
  }

  const handleEditAppointmentFromSlot = (appointmentId: string) => {
    const appointment = appointments.find((a) => a.id === appointmentId)
    if (appointment) {
      setSelectedAppointment(appointment)
      setSelectedDate(undefined)
      setIsTimeSlotPickerOpen(false)
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAppointment(undefined)
    setSelectedDate(undefined)
    setSelectedSlot(undefined)
    setSelectedProfessionalId('')
  }

  const handleCloseTimeSlotPicker = () => {
    setIsTimeSlotPickerOpen(false)
    setSelectedDate(undefined)
  }

  const handleFilterPatientChange = (patientId: string) => {
    setFilterPatientId(patientId)
    setFilterProfessionalId('')
    fetchData()
  }

  const handleFilterProfessionalChange = (professionalId: string) => {
    setFilterProfessionalId(professionalId)
    setFilterPatientId('')
    fetchData()
  }

  const clearFilters = () => {
    setFilterPatientId('')
    setFilterProfessionalId('')
    fetchData()
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
                Calendário de Agendamentos
              </h1>
              {isProfessionalOnly && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Visualizando apenas seus agendamentos
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Paciente:</label>
                <select
                  value={filterPatientId}
                  onChange={(e) => handleFilterPatientChange(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                >
                  <option value="">Todos</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Profissional:</label>
                <select
                  value={filterProfessionalId}
                  onChange={(e) => handleFilterProfessionalChange(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                >
                  <option value="">Todos</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>
              </div>
              {(filterPatientId || filterProfessionalId) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 whitespace-nowrap"
                >
                  Limpar
                </button>
              )}
              {canCreateAppointments && (
                <Button onClick={() => { 
                  setSelectedAppointment(undefined); 
                  setSelectedDate(new Date()); 
                  setIsTimeSlotPickerOpen(true);
                }}>
                  + Novo
                </Button>
              )}
            </div>
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

      <TimeSlotPicker
        isOpen={isTimeSlotPickerOpen}
        onClose={handleCloseTimeSlotPicker}
        onSelectSlot={handleSlotSelect}
        onEditAppointment={handleEditAppointmentFromSlot}
        date={selectedDate?.toISOString().split('T')[0] || ''}
        professionals={professionals}
        selectedProfessionalId={selectedProfessionalId}
        isProfessionalOnly={isProfessionalOnly}
        myProfessionalId={myProfessionalId}
        appointments={appointments}
        onProfessionalChange={setSelectedProfessionalId}
      />

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateAppointment}
        onUpdateStatus={selectedAppointment ? (status) => handleUpdateStatus(selectedAppointment.id, status) : undefined}
        onDelete={selectedAppointment ? () => handleDeleteAppointment(selectedAppointment.id) : undefined}
        initialData={selectedAppointment}
        patients={patients}
        professionals={professionals}
        specialties={specialties}
        selectedSlot={selectedSlot || selectedDate?.toISOString()}
        isLoading={submitting}
        isProfessionalOnly={isProfessionalOnly}
        myProfessionalId={isProfessionalOnly ? myProfessionalId : selectedProfessionalId}
        forcedProfessionalId={isProfessionalOnly ? undefined : selectedProfessionalId}
      />
    </div>
  )
}
