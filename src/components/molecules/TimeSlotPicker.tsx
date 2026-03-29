'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { type Appointment, type Professional } from '@/types'

interface OccupiedSlot {
  time: string
  appointmentId: string
}

interface TimeSlotPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectSlot: (slot: string, professionalId: string) => void
  onEditAppointment: (appointmentId: string) => void
  date: string
  professionals: Professional[]
  selectedProfessionalId?: string
  isProfessionalOnly?: boolean
  myProfessionalId?: string | null
  onProfessionalChange?: (professionalId: string) => void
}

export function TimeSlotPicker({
  isOpen,
  onClose,
  onSelectSlot,
  onEditAppointment,
  date,
  professionals,
  selectedProfessionalId,
  isProfessionalOnly = false,
  myProfessionalId,
  onProfessionalChange,
}: TimeSlotPickerProps) {
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isProfessionalOnly && myProfessionalId) {
      setSelectedProfessional(myProfessionalId)
    } else if (selectedProfessionalId) {
      setSelectedProfessional(selectedProfessionalId)
    }
  }, [isProfessionalOnly, myProfessionalId, selectedProfessionalId, isOpen])

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedProfessional || !date) {
        setOccupiedSlots([])
        setAppointments([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/appointments/slots?professionalId=${selectedProfessional}&date=${date}`)
        const data = await res.json()

        if (res.ok && data.success) {
          setOccupiedSlots(data.data.occupiedSlots || [])
          setAppointments(data.data.appointments || [])
        } else {
          setError(data.data?.message || 'Erro ao carregar horários')
          setOccupiedSlots([])
          setAppointments([])
        }
      } catch (err) {
        console.error('Error fetching slots:', err)
        setError('Erro ao carregar horários')
        setOccupiedSlots([])
        setAppointments([])
      } finally {
        setLoading(false)
      }
    }

    if (selectedProfessional) {
      fetchSlots()
    }
  }, [selectedProfessional, date])

  const handleProfessionalChange = (newProfessionalId: string) => {
    setSelectedProfessional(newProfessionalId)
    setOccupiedSlots([])
    setAppointments([])
    onProfessionalChange?.(newProfessionalId)
  }

  const handleEditClick = (appointmentId: string) => {
    onEditAppointment(appointmentId)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const formatTime = (isoString: string) => {
    const d = new Date(isoString)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Selecione o Horário
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(date)}
          </p>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          {!isProfessionalOnly && (
            <Select
              id="professional"
              label="Profissional"
              value={selectedProfessional}
              onChange={(e) => handleProfessionalChange(e.target.value)}
              options={[
                { value: '', label: 'Selecione um profissional...' },
                ...professionals.map((p) => ({ value: p.id, label: p.name }))
              ]}
            />
          )}
          {isProfessionalOnly && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Profissional: <span className="font-medium text-gray-900 dark:text-white">
                {professionals.find(p => p.id === selectedProfessional)?.name || '-'}
              </span>
            </p>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!selectedProfessional ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Selecione um profissional para ver os horários disponíveis
            </p>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 dark:text-red-400 py-8">{error}</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {occupiedSlots.map((slot) => (
                  <button
                    key={slot.appointmentId}
                    onClick={() => handleEditClick(slot.appointmentId)}
                    className="py-3 px-2 rounded-lg text-sm font-medium transition-all bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/50 border-2 border-red-300 dark:border-red-700"
                  >
                    {formatTime(slot.time)}
                    <span className="block text-xs opacity-75">Ocupado</span>
                  </button>
                ))}
              </div>
              
              {occupiedSlots.length > 0 && appointments.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Agendamentos do dia:</h4>
                  <div className="space-y-1">
                    {appointments.map((apt) => (
                      <div key={apt.id} className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{formatTime(apt.scheduledDateTime)}</span> - {apt.patientName}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {occupiedSlots.length === 0 && appointments.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4 mb-4">
                  Nenhum agendamento para este profissional neste dia
                </div>
              )}

              <Button
                onClick={() => {
                  const time = '09:00'
                  onSelectSlot(time, selectedProfessional)
                }}
                className="w-full"
              >
                Agendar em horário disponível
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Você poderá selecionar o horário específico na próxima etapa
              </p>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500"></span>
                <span className="text-gray-600 dark:text-gray-400">Ocupado (clique para editar)</span>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
