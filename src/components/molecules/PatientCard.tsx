'use client'

interface ResponsibleContact {
  id: string
  name: string
  email: string | null
  phone: string
  relationship: string
}

interface PatientCardProps {
  patient: {
    id: string
    name: string
    email: string | null
    phone: string | null
    cpf: string | null
    gender: string | null
    dateOfBirth: string | null
    responsibleContact: ResponsibleContact | null
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onViewHistory?: (id: string) => void
}

export function PatientCard({ patient, onEdit, onDelete, onViewHistory }: PatientCardProps) {
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
  }

  const formatCpf = (cpf: string | null) => {
    if (!cpf) return '-'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {patient.name}
          </h3>
          {patient.email && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{patient.email}</p>
          )}
        </div>
        {patient.gender && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            patient.gender === 'MASCULINO' 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
              : 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200'
          }`}>
            {patient.gender === 'MASCULINO' ? 'Masculino' : 'Feminino'}
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Telefone:</span>
          <span className="text-gray-900 dark:text-white">{formatPhone(patient.phone)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">CPF:</span>
          <span className="text-gray-900 dark:text-white">{formatCpf(patient.cpf)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Nascimento:</span>
          <span className="text-gray-900 dark:text-white">{formatDate(patient.dateOfBirth)}</span>
        </div>
      </div>

      {patient.responsibleContact && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Responsável:</p>
          <p className="text-sm text-gray-900 dark:text-white">
            {patient.responsibleContact.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {patient.responsibleContact.relationship} • {formatPhone(patient.responsibleContact.phone)}
          </p>
        </div>
      )}

      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        {onViewHistory && (
          <button
            onClick={() => onViewHistory(patient.id)}
            className="flex-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Histórico
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(patient.id)}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Editar
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(patient.id)}
            className="flex-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  )
}
