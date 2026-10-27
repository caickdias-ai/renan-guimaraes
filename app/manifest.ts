import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Guimarães Treinador',
    short_name: 'Guimarães',
    description: 'Gestão de alunos, treinos e nutrição.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f5f3',
    theme_color: '#292b29',
    orientation: 'portrait',
    icons: [
      { src: '/guimaraes-logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/guimaraes-logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
