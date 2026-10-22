import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Guimarães Treinador | Gestão de alunos',
  description: 'Acompanhe alunos, treinos, progresso e agenda em um só lugar.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#292b29',
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
