'use client'

import { useEffect, useState } from 'react'
import { useSessionContext } from '@/contexts/SessionContext'

export default function SwaggerPage() {
  const { data: session } = useSessionContext()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const script1 = document.createElement('script')
    script1.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js'
    script1.async = true
    document.body.appendChild(script1)

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css'
    document.head.appendChild(link)

    script1.onload = () => {
      const SwaggerUIBundle = (window as unknown as { SwaggerUIBundle: typeof window.SwaggerUIBundle }).SwaggerUIBundle
      if (SwaggerUIBundle) {
        SwaggerUIBundle({
          url: '/api-docs/json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
          ],
          layout: 'BaseLayout',
          docExpansion: 'list',
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          tryItOutEnabled: true,
        })
        setLoaded(true)
      }
    }

    return () => {
      document.body.removeChild(script1)
    }
  }, [])

  useEffect(() => {
    if (!loaded || !session) return
    
    setTimeout(() => {
      const authorizeBtn = document.querySelector('.authorize')
      if (authorizeBtn) {
        (authorizeBtn as HTMLElement).click()
      }
    }, 1000)
  }, [loaded, session])

  if (!session) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a73e8 0%, #4285f4 100%)',
        color: 'white',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1 style={{ fontSize: '2em', margin: 0 }}>🔒 Autenticação Necessária</h1>
        <p style={{ opacity: 0.9 }}>Faça login para acessar a documentação da API</p>
        <a 
          href="/login" 
          style={{
            padding: '12px 24px',
            background: 'white',
            color: '#1a73e8',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          Fazer Login
        </a>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #1a73e8 0%, #4285f4 100%)',
        color: 'white',
        padding: '20px',
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2em' }}>🏥 Clínica Altamente</h1>
          <p style={{ margin: '10px 0 0', opacity: 0.9 }}>API RESTful para Gestão de Clínica Médica</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.9em' }}>
          <p style={{ margin: 0 }}>👤 {session.user?.name || session.user?.email}</p>
          <p style={{ margin: '5px 0 0', opacity: 0.8 }}>Role: {session.user?.role}</p>
        </div>
      </div>
      <div id="swagger-ui" />
    </div>
  )
}
