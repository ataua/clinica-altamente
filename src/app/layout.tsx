import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";

const geistSans = Geist( {
  variable: "--font-geist-sans",
  subsets: [ "latin" ],
} );

const geistMono = Geist_Mono( {
  variable: "--font-geist-mono",
  subsets: [ "latin" ],
} );

export const metadata: Metadata = {
  title: "Clínica Altamente",
  description: "Sistema de Gestão de Consultas e Relatórios",
};

export default function RootLayout ( {
  children,
}: Readonly<{
  children: React.ReactNode;
}> ) {
  return (
    <html lang="pt-BR">
      <body
        className={ `${ geistSans.variable } ${ geistMono.variable } antialiased` }
      >
        <AuthProvider>
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
