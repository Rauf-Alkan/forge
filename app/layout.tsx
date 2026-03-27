import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Forge',
  description: 'Automated Faceless Video Content Engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-[#030712] text-white min-h-full font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
