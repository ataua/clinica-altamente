import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { auth } from "@/lib/auth";

const geistSans = Geist( {
  variable: "--font-geist-sans",
  subsets: [ "latin" ],
} );

const geistMono = Geist_Mono( {
  variable: "--font-geist-mono",
  subsets: [ "latin" ],
} );

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
}

export const metadata: Metadata = {
  title: {
    default: "Clínica Altamente",
    template: "%s | Clínica Altamente",
  },
  description: "Sistema de Gestão de Consultas e Relatórios para clínicas médicas. Agende consultas, gerencie pacientes e acompanhe relatórios.",
  keywords: ["clínica", "agendamento", "consultas", "médico", "saúde", "gestão", "pacientes"],
  authors: [{ name: "Atuã Pinali" }],
  creator: "Atuã Pinali",
  publisher: "Clínica Altamente",
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://clinica-altamente.com'),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXTAUTH_URL || 'https://clinica-altamente.com',
    siteName: "Clínica Altamente",
    title: "Clínica Altamente - Sistema de Gestão",
    description: "Sistema de Gestão de Consultas e Relatórios para clínicas médicas",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clínica Altamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clínica Altamente",
    description: "Sistema de Gestão de Consultas e Relatórios",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout ( {
  children,
}: Readonly<{
  children: React.ReactNode;
}> ) {
  const session = await auth()

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={ `${ geistSans.variable } ${ geistMono.variable } antialiased` }
      >
        <AuthProvider session={session}>
          <Toaster 
            position="top-right" 
            richColors 
            toastOptions={{
              style: {
                background: '#fff',
                border: '1px solid #e5e7eb',
              },
            }}
          />
          { children }
        </AuthProvider>
      </body>
    </html>
  );
}
