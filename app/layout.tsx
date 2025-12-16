import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

// Metadatos SEO
export const metadata: Metadata = {
  title: 'SkillsForge - Plataforma de Talleres Profesionales',
  description: 'SkillsForge - Plataforma integral para la gestión y participación en talleres de formación profesional. Desarrolla tus habilidades técnicas y blandas.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

// Layout principal de la app
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={GeistSans.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
