'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm text-red-600 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label="Sair da conta"
    >
      Sair
    </button>
  )
}
