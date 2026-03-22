'use client'

import { SessionProvider } from 'next-auth/react'
import { SessionContextProvider } from '@/contexts/SessionContext'
import type { Session } from 'next-auth'

interface AuthProviderProps {
  children: React.ReactNode
  session: Session | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider 
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <SessionContextProvider initialSession={session}>
        {children}
      </SessionContextProvider>
    </SessionProvider>
  )
}
