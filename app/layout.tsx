import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Advertorial Builder',
  description: 'Build high-converting advertorial landing pages in minutes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
