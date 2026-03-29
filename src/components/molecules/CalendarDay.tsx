'use client'

import { CalendarEvent } from '@/components/atoms/CalendarEvent'
import { type Appointment } from '@/types'

interface CalendarDayProps {
  date: Date
  appointments: Appointment[]
  isToday: boolean
  isCurrentMonth: boolean
  onEventClick?: (id: string) => void
}

export function CalendarDay({ date, appointments, isToday, isCurrentMonth, onEventClick }: CalendarDayProps) {
  const dayNumber = date.getDate()

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      className={`min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 ${
        !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
      } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
    >
      <div className={`text-sm font-medium mb-1 ${
        isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
      }`}>
        {dayNumber}
      </div>
      <div className="space-y-1">
        {appointments.slice(0, 3).map((apt) => (
          <CalendarEvent
            key={apt.id}
            id={apt.id}
            title={apt.patientName}
            time={formatTime(apt.scheduledDateTime)}
            status={apt.status}
            onClick={onEventClick}
          />
        ))}
        {appointments.length > 3 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            +{appointments.length - 3} mais
          </p>
        )}
      </div>
    </div>
  )
}
