import { clsx } from 'clsx'

type Role = 'ADMIN' | 'PROFESSIONAL' | 'SECRETARY' | 'PATIENT' | 'RESPONSIBLE' | 'TEACHER' | 'COORDINATOR'

interface BadgeProps {
  role: Role
  className?: string
}

const roleConfig: Record<Role, { bg: string; text: string; label: string }> = {
  ADMIN: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', label: 'Administrador' },
  PROFESSIONAL: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', label: 'Profissional' },
  SECRETARY: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200', label: 'Recepcionista' },
  PATIENT: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', label: 'Paciente' },
  RESPONSIBLE: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', label: 'Responsável' },
  TEACHER: { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-800 dark:text-indigo-200', label: 'Professor' },
  COORDINATOR: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-200', label: 'Coordenador' },
}

export function Badge({ role, className }: BadgeProps) {
  const config = roleConfig[role]
  
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.bg,
      config.text,
      className
    )}>
      {config.label}
    </span>
  )
}
