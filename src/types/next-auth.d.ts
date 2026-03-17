import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'ADMIN' | 'PROFESSIONAL' | 'SECRETARY' | 'PATIENT' | 'RESPONSIBLE' | 'TEACHER' | 'COORDINATOR'
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: 'ADMIN' | 'PROFESSIONAL' | 'SECRETARY' | 'PATIENT' | 'RESPONSIBLE' | 'TEACHER' | 'COORDINATOR'
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: 'ADMIN' | 'PROFESSIONAL' | 'SECRETARY' | 'PATIENT' | 'RESPONSIBLE' | 'TEACHER' | 'COORDINATOR'
  }
}

interface SwaggerUIBundle {
  (config: {
    url?: string
    spec?: object
    dom_id?: string
    deepLinking?: boolean
    presets?: unknown[]
    layout?: string
    docExpansion?: string
    filter?: boolean | string
    showExtensions?: boolean
    showCommonExtensions?: boolean
    tryItOutEnabled?: boolean
  }): unknown
  presets: {
    apis: unknown
    SwaggerUIStandalonePreset: unknown
  }
  SwaggerUIStandalonePreset: unknown
}

declare global {
  interface Window {
    SwaggerUIBundle: SwaggerUIBundle
  }
}

export {}
