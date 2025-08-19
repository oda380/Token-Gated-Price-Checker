// src/app/layout.tsx
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import ContextProvider from '@/context/provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Token Gated Price Checker',
  description: 'Token-gated crypto price checker'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const cookies = hdrs.get('cookie')
  
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-white">
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  )
}