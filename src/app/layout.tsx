import type { Metadata } from 'next'
import { headers } from 'next/headers'
import ContextProvider from '@/context/provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Gated Prices',
  description: 'Token-gated crypto prices'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const cookies = hdrs.get('cookie')
  return (
    <html lang="en">
      <body><ContextProvider cookies={cookies}>{children}</ContextProvider></body>
    </html>
  )
}
