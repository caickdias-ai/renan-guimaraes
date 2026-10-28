import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RegisterSW } from './register-sw'

export const metadata: Metadata = {
  title: 'Guimarães Treinador | Gestão de alunos',
  description: 'Acompanhe alunos, treinos, progresso e agenda em um só lugar.',
  generator: 'v0.app',
  icons: { icon: '/icon-32.png', apple: '/apple-icon.png' },
  appleWebApp: { capable: true, title: 'Guimarães', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#292b29',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className="antialiased"><RegisterSW />{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
