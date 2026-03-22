import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const isAdmin = session.user.role === 'ADMIN'
  const isCoordinator = session.user.role === 'COORDINATOR'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" role="navigation" aria-label="Navegação principal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400" aria-label="Página inicial">
                Clínica Altamente
              </Link>
              <div className="hidden sm:flex items-center gap-6">
                {isAdmin && (
                  <>
                    <Link 
                      href="/admin/users" 
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      aria-label="Gerenciar usuários"
                    >
                      Usuários
                    </Link>
                    <Link 
                      href="/admin/professionals" 
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      aria-label="Gerenciar profissionais"
                    >
                      Profissionais
                    </Link>
                  </>
                )}
                <Link 
                  href="/calendar" 
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  aria-label="Calendário de consultas"
                >
                  Calendário
                </Link>
                <Link 
                  href="/patients" 
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  aria-label="Lista de pacientes"
                >
                  Pacientes
                </Link>
                {(isAdmin || isCoordinator) && (
                  <Link 
                    href="/dashboard" 
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    aria-label="Dashboard e relatórios"
                  >
                    Dashboard
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-300" aria-label={`Usuário: ${session.user.name}`}>
                {session.user.name}
              </span>
              <form action={async () => {
                'use server'
                const { signOut } = await import('@/lib/auth')
                await signOut({ redirect: true, redirectTo: '/' })
              }}>
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Sair da conta"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </div>
  )
}
