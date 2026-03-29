'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/atoms/Input'
import { Button } from '@/components/atoms/Button'

interface AppointmentActionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (value: string) => void
  type: 'cancel' | 'reschedule'
  isLoading?: boolean
}

export function AppointmentActionModal({ isOpen, onClose, onSubmit, type, isLoading }: AppointmentActionModalProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setValue('')
      setError('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (type === 'cancel' && !value.trim()) {
      setError('Por favor, informe o motivo do cancelamento')
      return
    }
    
    if (type === 'reschedule' && !value.trim()) {
      setError('Por favor, informe a nova data/hora (YYYY-MM-DDTHH:mm)')
      return
    }

    onSubmit(value)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {type === 'cancel' ? 'Cancelar Agendamento' : 'Reagendar Agendamento'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'cancel' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo do Cancelamento
              </label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                placeholder="Informe o motivo do cancelamento..."
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
          ) : (
            <Input
              label="Nova Data/Hora"
              type="datetime-local"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              error={error}
            />
          )}
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
