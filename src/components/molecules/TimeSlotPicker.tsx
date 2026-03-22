'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'

interface Professional {
  id: string
  name: string
}

interface TimeSlot {
  time: string
  available: boolean
  appointmentId?: string
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
  appointments?: {
    id: string
    scheduledDateTime: string
    endDateTime: string
    status: string
    professionalId: string
  }[]
  onProfessionalChange?: (professionalId: string) => void
}

function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = []
  for (let hour = 8; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hourStr = hour.toString().padStart(2, '0')
      const minStr = minute.toString().padStart(2, '0')
      slots.push({
        time: `${hourStr}:${minStr}`,
        available: true,
      })
    }
  }
  return slots
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
  appointments = [],
  onProfessionalChange,
}: TimeSlotPickerProps) {
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')

  useEffect(() => {
    if (isProfessionalOnly && myProfessionalId) {
      setSelectedProfessional(myProfessionalId)
    } else if (selectedProfessionalId) {
      setSelectedProfessional(selectedProfessionalId)
    }
  }, [isProfessionalOnly, myProfessionalId, selectedProfessionalId, isOpen])

  const slots = useMemo(() => {
    const allSlots = generateTimeSlots()
    
    const dayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledDateTime).toISOString().split('T')[0]
      return aptDate === date && apt.professionalId === selectedProfessional
    })

    return allSlots.map(slot => {
      const slotTime = `${date}T${slot.time}:00`
      const slotEnd = `${date}T${slot.time}:30`

      const conflictingAppointment = dayAppointments.find(apt => {
        const aptStart = new Date(apt.scheduledDateTime).getTime()
        const aptEnd = new Date(apt.endDateTime).getTime()
        const slotStart = new Date(slotTime).getTime()
        const slotEndTime = new Date(slotEnd).getTime()

        return (
          (slotStart >= aptStart && slotStart < aptEnd) ||
          (slotEndTime > aptStart && slotEndTime <= aptEnd) ||
          (slotStart <= aptStart && slotEndTime >= aptEnd)
        )
      })

      return {
        ...slot,
        available: !conflictingAppointment,
        appointmentId: conflictingAppointment?.id,
      }
    })
  }, [date, appointments, selectedProfessional])

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.available || !selectedProfessional) return
    onSelectSlot(slot.time, selectedProfessional)
  }

  const handleEditClick = (appointmentId: string) => {
    onEditAppointment(appointmentId)
  }

  const handleProfessionalChange = (newProfessionalId: string) => {
    setSelectedProfessional(newProfessionalId)
    onProfessionalChange?.(newProfessionalId)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
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
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available ? handleSlotClick(slot) : slot.appointmentId && handleEditClick(slot.appointmentId)}
                  disabled={slot.available && !isProfessionalOnly && !selectedProfessional}
                  className={`
                    py-3 px-2 rounded-lg text-sm font-medium transition-all
                    ${slot.available
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/50'
                    }
                    ${!slot.available && slot.appointmentId ? 'border-2 border-red-300 dark:border-red-700' : ''}
                    ${!selectedProfessional ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {slot.time}
                  {!slot.available && (
                    <span className="block text-xs opacity-75">Ocupado</span>
                  )}
                  {slot.available && (
                    <span className="block text-xs opacity-75">Livre</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span>
                <span className="text-gray-600 dark:text-gray-400">Livre</span>
              </div>
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
