import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ingrid & Ulrich — Mariage 31 Juillet 2026',
  description: "Invitation au mariage d'Ingrid & Ulrich le 31 Juillet 2026 à Bandjoun, Cameroun.",
  openGraph: {
    title: 'Ingrid & Ulrich — Mariage 31 Juillet 2026',
    description: 'Célébration de mariage à Bandjoun, Ouest Cameroun',
    images: ['/couple.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
