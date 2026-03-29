'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react'
import type { Session } from 'next-auth'

type SessionStatus = 'authenticated' | 'loading' | 'unauthenticated'

interface SessionContextValue {
  data: Session | null
  status: SessionStatus
  update: (data?: Session | null) => Promise<Session | null>
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

export function SessionContextProvider({ 
  children, 
  initialSession 
}: { 
  children: ReactNode
  initialSession: Session | null 
}) {
  const [session, setSession] = useState<Session | null>(initialSession)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialSession) {
      setSession(initialSession)
    }
  }, [initialSession])

  const fetchNewSession = useCallback(async (): Promise<Session | null> => {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const newSession = await res.json()
        return newSession as Session
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
    return null
  }, [])

  const update = useCallback(async (data?: Session | null): Promise<Session | null> => {
    if (data === null) {
      setSession(null)
      setLoading(false)
      return null
    }

    if (data) {
      setSession(data)
      setLoading(false)
      return data
    }

    setLoading(true)
    
    const newSession = await fetchNewSession()
    
    setSession(newSession)
    setLoading(false)
    
    return newSession
  }, [fetchNewSession])

  const status: SessionStatus = loading 
    ? 'loading' 
    : session 
      ? 'authenticated' 
      : 'unauthenticated'

  const value = useMemo(() => ({
    data: session,
    status,
    update,
  }), [session, status, update])

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext() {
  const context = useContext(SessionContext)
  
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionContextProvider')
  }
  
  return context
}

export function useCachedSession() {
  const { data: session, status, update } = useSessionContext()
  
  const isValid = useMemo(() => {
    if (!session?.user?.role) return false
    return true
  }, [session?.user?.role])

  return { 
    data: session, 
    status, 
    update,
    isCacheValid: isValid 
  }
}
