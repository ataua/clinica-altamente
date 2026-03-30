'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/atoms/Button'

interface AttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: AttendanceFormData) => Promise<void>
  appointmentId: string
  patientId: string
  professionalId: string
  patientName: string
  professionalName: string
  appointmentDate: string
  initialData?: {
    id: string
    notes?: string | null
    observations?: string | null
    diagnosis?: string | null
    treatmentPlan?: string | null
    status: string
  }
  isLoading?: boolean
  isEditMode?: boolean
  isViewOnly?: boolean
}

interface AttendanceFormData {
  appointmentId: string
  patientId: string
  professionalId: string
  startTime: string
  notes?: string
  observations?: string
  diagnosis?: string
  treatmentPlan?: string
}

export function AttendanceModal({
  isOpen,
  onClose,
  onSubmit,
  appointmentId,
  patientId,
  professionalId,
  patientName,
  professionalName,
  appointmentDate,
  initialData,
  isLoading,
  isEditMode,
  isViewOnly,
}: AttendanceModalProps) {
  const initialFormData = useMemo(() => ({
    appointmentId,
    patientId,
    professionalId,
    startTime: appointmentDate,
    notes: '',
    observations: '',
    diagnosis: '',
    treatmentPlan: '',
  }), [appointmentId, patientId, professionalId, appointmentDate])

  const [formData, setFormData] = useState<AttendanceFormData>(initialFormData)

  useEffect(() => {
    if (initialData) {
      setFormData({
        appointmentId,
        patientId,
        professionalId,
        startTime: appointmentDate,
        notes: initialData.notes || '',
        observations: initialData.observations || '',
        diagnosis: initialData.diagnosis || '',
        treatmentPlan: initialData.treatmentPlan || '',
      })
    } else {
      setFormData(initialFormData)
    }
  }, [initialData, initialFormData, appointmentId, patientId, professionalId, appointmentDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  if (!isOpen) return null

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendente',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {isViewOnly ? 'Detalhes do Atendimento' : isEditMode ? 'Editar Atendimento' : 'Registrar Atendimento'}
          </h2>

          {initialData && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Status: {statusLabels[initialData.status] || initialData.status}
              </span>
            </div>
          )}

          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Paciente:</strong> {patientName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Profissional:</strong> {professionalName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Data:</strong> {new Date(appointmentDate).toLocaleString('pt-BR')}
            </p>
          </div>

          {isViewOnly ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <div className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white min-h-[80px]">
                  {formData.observations || 'Nenhuma observação registrada'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diagnóstico
                </label>
                <div className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white min-h-[80px]">
                  {formData.diagnosis || 'Nenhum diagnóstico registrado'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plano de Tratamento
                </label>
                <div className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white min-h-[80px]">
                  {formData.treatmentPlan || 'Nenhum plano de tratamento registrado'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas Adicionais
                </label>
                <div className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white min-h-[60px]">
                  {formData.notes || 'Nenhuma nota adicional'}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observações gerais do atendimento..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diagnóstico
                </label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Diagnóstico do paciente..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plano de Tratamento
                </label>
                <textarea
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Plano de tratamento recomendado..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas Adicionais
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notas adicionais..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
