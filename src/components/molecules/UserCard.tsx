import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'

interface UserCardProps {
  user: {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'PROFESSIONAL' | 'SECRETARY' | 'PATIENT' | 'RESPONSIBLE' | 'TEACHER' | 'COORDINATOR'
    createdAt: string | Date
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const createdAt = new Date(user.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <span className="text-blue-600 dark:text-blue-300 font-semibold text-lg">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          <div className="mt-1">
            <Badge role={user.role} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
          {createdAt}
        </span>
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
    </div>
  )
}
