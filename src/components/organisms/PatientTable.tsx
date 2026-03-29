'use client'

import { useState } from 'react'
import { Input } from '@/components/atoms/Input'
import { Button } from '@/components/atoms/Button'
import { PatientCard } from '@/components/molecules/PatientCard'
import { type Patient } from '@/types'

interface ResponsibleContact {
  id: string
  name: string
  email: string | null
  phone: string
  cpf: string | null
  relationship: string
}

interface PatientTableProps {
  patients: Patient[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onCreate: () => void
  onViewHistory?: (id: string) => void
  onEditResponsible?: (patientId: string, responsible: ResponsibleContact) => void
  isLoading?: boolean
}

export function PatientTable({ patients, onEdit, onDelete, onCreate, onViewHistory, onEditResponsible, isLoading }: PatientTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf?.includes(searchTerm)
  )

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-md">
          <Input
            id="search"
            placeholder="Buscar pacientes por nome, email ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode('grid')}>
            Grid
          </Button>
          <Button variant="outline" onClick={() => setViewMode('table')}>
            Lista
          </Button>
          <Button onClick={onCreate}>
            + Novo Paciente
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewHistory={onViewHistory}
              onEditResponsible={onEditResponsible}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Contato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  CPF
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nascimento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Responsável
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{patient.name}</p>
                      {patient.email && (
                        <p className="text-sm text-gray-500">{patient.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {formatPhone(patient.phone)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {patient.cpf || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(patient.dateOfBirth)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {patient.responsibleContact ? (
                      <div className="flex items-center gap-2">
                        <div>
                          <p>{patient.responsibleContact.name}</p>
                          <p className="text-xs text-gray-400">{patient.responsibleContact.relationship}</p>
                        </div>
                        {onEditResponsible && (
                          <button
                            onClick={() => onEditResponsible(patient.id, patient.responsibleContact!)}
                            className="text-green-600 hover:text-green-700 text-xs"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {onViewHistory && (
                        <button
                          onClick={() => onViewHistory(patient.id)}
                          className="text-purple-600 hover:text-purple-700 text-sm"
                        >
                          Histórico
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(patient.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(patient.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
