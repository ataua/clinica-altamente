'use client'

interface TimeSlotProps {
  time: string
  isAvailable: boolean
  isSelected?: boolean
  onClick?: () => void
}

export function TimeSlot({ time, isAvailable, isSelected, onClick }: TimeSlotProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <button
      onClick={onClick}
      disabled={!isAvailable}
      className={`w-full py-2 px-3 text-sm rounded border transition-colors ${
        isSelected
          ? 'bg-blue-600 text-white border-blue-600'
          : isAvailable
          ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          : 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
      }`}
    >
      {formatTime(time)}
    </button>
  )
}
