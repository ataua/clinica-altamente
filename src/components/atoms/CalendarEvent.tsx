'use client'

interface CalendarEventProps {
  id: string
  title: string
  time: string
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  type: string
  onClick?: (id: string) => void
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
  CONFIRMED: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
  IN_PROGRESS: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
  COMPLETED: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200',
  CANCELLED: 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
  NO_SHOW: 'bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200',
}

export function CalendarEvent({ id, title, time, status, type, onClick }: CalendarEventProps) {
  return (
    <div
      onClick={() => onClick?.(id)}
      className={`p-2 rounded border text-xs cursor-pointer hover:opacity-80 transition-opacity ${statusColors[status]}`}
    >
      <p className="font-medium truncate">{title}</p>
      <p className="opacity-75">{time}</p>
      <p className="opacity-75 truncate">{type}</p>
    </div>
  )
}
