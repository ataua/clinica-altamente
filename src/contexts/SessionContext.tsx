'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react'
import type { Session } from 'next-auth'

type SessionStatus = 'authenticated' | 'loading' | 'unauthenticated'

interface SessionContextValue {
  data: Session | null
  status: SessionStatus
  update: (data?: Session | null) => Promise<Session | null>
}

interface SessionContextData {
  session: Session | null
  loading: boolean
}

const ROLES_LONG_CACHE = ['ADMIN', 'SECRETARY', 'PROFESSIONAL', 'COORDINATOR']
const LONG_CACHE_TTL = 7 * 24 * 60 * 60 * 1000
const SHORT_CACHE_TTL = 10 * 60 * 1000

function getTTLForRole(role: string | undefined): number {
  if (!role) return SHORT_CACHE_TTL
  return ROLES_LONG_CACHE.includes(role) ? LONG_CACHE_TTL : SHORT_CACHE_TTL
}

function isCacheValid(session: Session | null, lastFetch: number | null): boolean {
  if (!session || !lastFetch) return false
  const ttl = getTTLForRole(session.user?.role)
  return Date.now() - lastFetch < ttl
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
  const [lastFetch, setLastFetch] = useState<number | null>(null)

  useEffect(() => {
    if (initialSession) {
      setSession(initialSession)
      setLastFetch(Date.now())
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
      setLastFetch(null)
      return null
    }

    if (data) {
      setSession(data)
      setLoading(false)
      setLastFetch(Date.now())
      return data
    }

    setLoading(true)
    
    const newSession = await fetchNewSession()
    
    setSession(newSession)
    setLoading(false)
    setLastFetch(Date.now())
    
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
