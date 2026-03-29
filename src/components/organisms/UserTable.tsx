'use client'

import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { type User } from '@/types'

interface UserTableProps {
  users: User[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Nenhum usuário encontrado
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Usuário</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Perfil</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Criado em</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr 
              key={user.id} 
              className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <Badge role={user.role} />
              </td>
              <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
              </td>
              <td className="py-3 px-4">
                <div className="flex justify-end gap-2">
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(user.id)}>
                      Editar
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="danger" size="sm" onClick={() => onDelete(user.id)}>
                      Excluir
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
