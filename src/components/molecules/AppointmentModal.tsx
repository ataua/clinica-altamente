'use client'

import { useState, useEffect, useMemo } from 'react'
import { Select } from '@/components/atoms/Select'
import { Button } from '@/components/atoms/Button'
import { AppointmentStatusBadge } from '@/components/atoms/AppointmentStatusBadge'
import { AttendanceModal } from './AttendanceModal'
import { type Patient, type Professional, type Specialty, type Appointment } from '@/types'

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    patientId: string
    professionalId: string
    scheduledDateTime: string
    notes: string
  }) => void
  onUpdateStatus?: (status: string) => void
  onDelete?: () => void
  initialData?: Appointment
  patients: Patient[]
  professionals: Professional[]
  specialties?: Specialty[]
  selectedSlot?: string
  isLoading?: boolean
  isProfessionalOnly?: boolean
  myProfessionalId?: string | null
  forcedProfessionalId?: string | null
  userRole?: string
}

function generateTimeSlots() {
  const slots: { value: string; label: string; disabled?: boolean }[] = []
  for (let hour = 8; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hourStr = hour.toString().padStart(2, '0')
      const minStr = minute.toString().padStart(2, '0')
      const value = `${hourStr}:${minStr}`
      const label = `${hourStr}:${minStr}`
      slots.push({ value, label })
    }
  }
  return slots
}

const allTimeSlots = generateTimeSlots()

export function AppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  onUpdateStatus,
  onDelete,
  initialData,
  patients,
  professionals,
  specialties = [],
  selectedSlot,
  isLoading,
  isProfessionalOnly,
  myProfessionalId,
  forcedProfessionalId,
  userRole,
}: AppointmentModalProps) {
  const [patientId, setPatientId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [scheduledDateTime, setScheduledDateTime] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState(false)
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false)
  const [attendanceId, setAttendanceId] = useState<string | null>(null)

  const isSecretary = userRole === 'ADMIN' || userRole === 'SECRETARY' || userRole === 'COORDINATOR'
  const effectiveProfessionalId = forcedProfessionalId || myProfessionalId || ''
  const isProfessionalForced = !!forcedProfessionalId || !!myProfessionalId

  const filteredProfessionals = useMemo(() => {
    if (!selectedSpecialtyId) return professionals
    return professionals.filter((p) => p.specialtyId === selectedSpecialtyId)
  }, [professionals, selectedSpecialtyId])

  const timeSlots = useMemo(() => {
    return allTimeSlots.map((slot) => ({
      ...slot,
      disabled: occupiedSlots.includes(slot.value),
    }))
  }, [occupiedSlots])

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setPatientId(initialData.patientId)
        setProfessionalId(initialData.professionalId)
        setScheduledDateTime(initialData.scheduledDateTime.slice(0, 16))
        setNotes(initialData.notes || '')
        setSelectedSpecialtyId('')
        setOccupiedSlots([])
      } else {
        setPatientId('')
        setProfessionalId(effectiveProfessionalId)
        setScheduledDateTime(selectedSlot ? selectedSlot.slice(0, 16) : '')
        setNotes('')
        setSelectedSpecialtyId('')
        setOccupiedSlots([])
      }
      setErrors({})
    }
  }, [isOpen, initialData, selectedSlot, effectiveProfessionalId])

  useEffect(() => {
    const fetchOccupiedSlots = async () => {
      if (!effectiveProfessionalId || !selectedSlot) {
        setOccupiedSlots([])
        return
      }

      try {
        const date = selectedSlot.split('T')[0]
        const res = await fetch(`/api/appointments/slots?professionalId=${effectiveProfessionalId}&date=${date}`)
        if (res.ok) {
          const data = await res.json()
          const occupied = (data.data?.slots || []).map((slot: string) => {
            const d = new Date(slot)
            const hours = d.getHours().toString().padStart(2, '0')
            const minutes = d.getMinutes().toString().padStart(2, '0')
            return `${hours}:${minutes}`
          })
          setOccupiedSlots(occupied)
        }
      } catch (error) {
        console.error('Error fetching slots:', error)
        setOccupiedSlots([])
      }
    }

    if (effectiveProfessionalId && selectedSlot) {
      fetchOccupiedSlots()
    } else {
      setOccupiedSlots([])
    }
  }, [effectiveProfessionalId, selectedSlot])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!patientId) newErrors.patientId = 'Paciente é obrigatório'
    if (!isProfessionalForced && !professionalId) newErrors.professionalId = 'Profissional é obrigatório'
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
      scheduledDateTime,
      notes,
    })
  }

  const handleStatusUpdate = async (status: string) => {
    if (!initialData || !onUpdateStatus) return
    setActionLoading(true)
    try {
      let endpoint = `/api/appointments/${initialData.id}`
      let method = 'PUT'
      let body = JSON.stringify({ status })

      if (status === 'CONFIRMED') {
        endpoint = `/api/appointments/${initialData.id}/confirm`
        method = 'POST'
        body = '{}'
      } else if (status === 'CANCELLED') {
        const reason = prompt('Motivo do cancelamento:')
        if (!reason) {
          setActionLoading(false)
          return
        }
        endpoint = `/api/appointments/${initialData.id}/cancel`
        method = 'POST'
        body = JSON.stringify({ reason })
      } else if (status === 'NO_SHOW') {
        endpoint = `/api/appointments/${initialData.id}/no-show`
        method = 'POST'
        body = '{}'
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (res.ok) {
        onUpdateStatus(status)
      } else {
        const error = await res.json()
        alert(error.message || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Erro ao atualizar status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartAttendance = async () => {
    if (!initialData) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/appointments/${initialData.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        const data = await res.json()
        setAttendanceId(data.data?.id || null)
        setAttendanceModalOpen(true)
        onUpdateStatus?.('IN_PROGRESS')
      } else {
        const error = await res.json()
        alert(error.message || 'Erro ao iniciar atendimento')
      }
    } catch (error) {
      console.error('Error starting attendance:', error)
      alert('Erro ao iniciar atendimento')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('pt-BR')
  }

  if (!isOpen) return null

  return (
    <>
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
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Paciente:</span> {initialData.patientName}</p>
                <p><span className="text-gray-500">Data/Hora:</span> {formatDateTime(initialData.scheduledDateTime)}</p>
                {!isProfessionalForced && <p><span className="text-gray-500">Profissional:</span> {initialData.professionalName}</p>}
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

                {!isProfessionalForced && specialties.length > 0 && (
                  <Select
                    id="specialty"
                    label="Especialidade"
                    value={selectedSpecialtyId}
                    onChange={(e) => {
                      setSelectedSpecialtyId(e.target.value)
                      setProfessionalId('')
                    }}
                    options={[
                      { value: '', label: 'Todas as especialidades' },
                      ...specialties.map((s) => ({ value: s.id, label: s.name }))
                    ]}
                  />
                )}

                <Select
                  id="professional"
                  label={isProfessionalForced ? 'Profissional' : 'Profissional *'}
                  value={effectiveProfessionalId || professionalId}
                  onChange={(e) => setProfessionalId(e.target.value)}
                  options={
                    effectiveProfessionalId
                      ? [{ value: effectiveProfessionalId, label: professionals.find(p => p.id === effectiveProfessionalId)?.name || 'Profissional' }]
                      : [
                          { value: '', label: selectedSpecialtyId ? 'Selecione uma especialidade primeiro' : 'Selecione...' },
                          ...filteredProfessionals.map((p) => ({ value: p.id, label: p.name }))
                        ]
                  }
                  error={errors.professionalId}
                  disabled={!!effectiveProfessionalId}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Data</label>
                    <input
                      type="date"
                      value={selectedSlot ? selectedSlot.split('T')[0] : scheduledDateTime.split('T')[0] || ''}
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <Select
                    id="scheduledTime"
                    label="Horário *"
                    value={scheduledDateTime ? scheduledDateTime.split('T')[1]?.slice(0, 5) : ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const datePart = selectedSlot ? selectedSlot.split('T')[0] : scheduledDateTime.split('T')[0]
                      if (datePart && e.target.value) {
                        setScheduledDateTime(`${datePart}T${e.target.value}:00.000Z`)
                      }
                    }}
                    options={[
                      { value: '', label: 'Selecione...' },
                      ...timeSlots.map((slot) => ({
                        value: slot.value,
                        label: slot.disabled ? `${slot.label} (ocupado)` : slot.label,
                        disabled: slot.disabled,
                      }))
                    ]}
                    error={errors.scheduledDateTime}
                  />
                </div>
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
                <>
                  {isSecretary && initialData.status === 'SCHEDULED' && (
                    <Button
                      type="button"
                      onClick={() => handleStatusUpdate('CONFIRMED')}
                      disabled={actionLoading}
                    >
                      Confirmar
                    </Button>
                  )}
                  {isSecretary && (initialData.status === 'SCHEDULED' || initialData.status === 'CONFIRMED') && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleStatusUpdate('NO_SHOW')}
                        disabled={actionLoading}
                      >
                        Não Compareceu
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => handleStatusUpdate('CANCELLED')}
                        disabled={actionLoading}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                  {isProfessionalOnly && initialData.status === 'CONFIRMED' && (
                    <Button
                      type="button"
                      onClick={handleStartAttendance}
                      disabled={actionLoading}
                    >
                      Iniciar Atendimento
                    </Button>
                  )}
                  {isProfessionalOnly && initialData.status === 'IN_PROGRESS' && (
                    <Button
                      type="button"
                      onClick={() => {
                        if (attendanceId) {
                          setAttendanceModalOpen(true)
                        } else {
                          setAttendanceModalOpen(true)
                        }
                      }}
                      disabled={actionLoading}
                    >
                      Registrar Atendimento
                    </Button>
                  )}
                </>
              )}
              <div className="flex gap-3 flex-1 justify-end">
                {initialData && onDelete && isSecretary && (
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

      {initialData && attendanceModalOpen && (
        <AttendanceModal
          isOpen={attendanceModalOpen}
          onClose={() => setAttendanceModalOpen(false)}
          onSubmit={async (data) => {
            try {
              const res = await fetch(`/api/attendances/${attendanceId || 'new'}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              })
              if (res.ok) {
                setAttendanceModalOpen(false)
                onUpdateStatus?.('COMPLETED')
              }
            } catch (error) {
              console.error('Error completing attendance:', error)
            }
          }}
          appointmentId={initialData.id}
          patientId={initialData.patientId}
          professionalId={initialData.professionalId}
          patientName={initialData.patientName}
          professionalName={initialData.professionalName}
          appointmentDate={initialData.scheduledDateTime}
          isEditMode={!!attendanceId}
        />
      )}
    </>
  )
}
