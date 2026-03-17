'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Button } from '@/components/atoms/Button'
import { AppointmentStatusBadge } from '@/components/atoms/AppointmentStatusBadge'

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
  patientId: string
  patientName: string
  professionalId: string
  professionalName: string
  appointmentTypeId: string
  appointmentType: string
  scheduledDateTime: string
  endDateTime: string
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes: string | null
}

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    patientId: string
    professionalId: string
    appointmentTypeId: string
    scheduledDateTime: string
    notes: string
  }) => void
  onUpdateStatus?: (status: string) => void
  onDelete?: () => void
  initialData?: Appointment
  patients: Patient[]
  professionals: Professional[]
  appointmentTypes: AppointmentType[]
  selectedSlot?: string
  isLoading?: boolean
}

const statusOptions = [
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'NO_SHOW', label: 'Não Compareceu' },
]

export function AppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  onUpdateStatus,
  onDelete,
  initialData,
  patients,
  professionals,
  appointmentTypes,
  selectedSlot,
  isLoading,
}: AppointmentModalProps) {
  const [patientId, setPatientId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [appointmentTypeId, setAppointmentTypeId] = useState('')
  const [scheduledDateTime, setScheduledDateTime] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line
    if (!initialized) {
      setInitialized(true)
      if (initialData) {
        setPatientId(initialData.patientId)
        setProfessionalId(initialData.professionalId)
        setAppointmentTypeId(initialData.appointmentTypeId)
        setScheduledDateTime(initialData.scheduledDateTime.slice(0, 16))
        setNotes(initialData.notes || '')
      } else {
        setPatientId('')
        setProfessionalId('')
        setAppointmentTypeId('')
        setScheduledDateTime(selectedSlot ? selectedSlot.slice(0, 16) : '')
        setNotes('')
      }
      setErrors({})
    }
  }, [initialized, initialData, selectedSlot])

  useEffect(() => {
    // eslint-disable-next-line
    if (isOpen) {
      setInitialized(false)
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!patientId) newErrors.patientId = 'Paciente é obrigatório'
    if (!professionalId) newErrors.professionalId = 'Profissional é obrigatório'
    if (!appointmentTypeId) newErrors.appointmentTypeId = 'Tipo de agendamento é obrigatório'
    if (!scheduledDateTime) newErrors.scheduledDateTime = 'Data/hora é obrigatória'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    onSubmit({
      patientId,
      professionalId,
      appointmentTypeId,
      scheduledDateTime,
      notes,
    })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('pt-BR')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 my-8 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {initialData ? 'Detalhes do Agendamento' : 'Novo Agendamento'}
        </h2>

        {initialData && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
              <AppointmentStatusBadge status={initialData.status} />
            </div>
            <div className="text-sm">
              <p><span className="text-gray-500">Data/Hora:</span> {formatDateTime(initialData.scheduledDateTime)}</p>
              <p><span className="text-gray-500">Profissional:</span> {initialData.professionalName}</p>
              <p><span className="text-gray-500">Tipo:</span> {initialData.appointmentType}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!initialData && (
            <>
              <Select
                id="patient"
                label="Paciente *"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                options={[
                  { value: '', label: 'Selecione...' },
                  ...patients.map((p) => ({ value: p.id, label: p.name }))
                ]}
                error={errors.patientId}
              />

              <Select
                id="professional"
                label="Profissional *"
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                options={[
                  { value: '', label: 'Selecione...' },
                  ...professionals.map((p) => ({ value: p.id, label: p.name }))
                ]}
                error={errors.professionalId}
              />

              <Select
                id="appointmentType"
                label="Tipo de Agendamento *"
                value={appointmentTypeId}
                onChange={(e) => setAppointmentTypeId(e.target.value)}
                options={[
                  { value: '', label: 'Selecione...' },
                  ...appointmentTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.durationMinutes} min)` }))
                ]}
                error={errors.appointmentTypeId}
              />

              <Input
                id="scheduledDateTime"
                type="datetime-local"
                label="Data/Hora *"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                error={errors.scheduledDateTime}
              />
            </>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observações sobre o agendamento..."
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            {initialData && onUpdateStatus && (
              <Select
                id="status"
                label="Atualizar Status"
                value={initialData.status}
                onChange={(e) => onUpdateStatus(e.target.value)}
                options={statusOptions}
                className="flex-1 min-w-[150px]"
              />
            )}
            <div className="flex gap-3 flex-1 justify-end">
              {initialData && onDelete && (
                <Button type="button" variant="danger" onClick={onDelete}>
                  Excluir
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                Fechar
              </Button>
              {!initialData && (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Agendar'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
