'use client'

import { useEffect } from 'react'

export default function SwaggerPage() {
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
      if (window.SwaggerUIBundle) {
        window.SwaggerUIBundle({
          url: '/api-docs/json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            window.SwaggerUIBundle.presets.apis,
          ],
          layout: 'BaseLayout',
          docExpansion: 'list',
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          tryItOutEnabled: true,
        })
      }
    }

    return () => {
      document.body.removeChild(script1)
    }
  }, [])

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #1a73e8 0%, #4285f4 100%)',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '2em' }}>🏥 Clínica Altamente</h1>
        <p style={{ margin: '10px 0 0', opacity: 0.9 }}>API RESTful para Gestão de Clínica Médica</p>
      </div>
      <div id="swagger-ui" />
    </div>
  )
}
