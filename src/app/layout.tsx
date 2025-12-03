import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Space_Grotesk } from 'next/font/google'
import ContextProvider from '@/context/provider'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Token Gated Price Checker',
  description: 'Token-gated crypto price checker'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const cookies = hdrs.get('cookie')

  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.className} bg-black text-white antialiased selection:bg-[#CCFF00] selection:text-black`}>
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  )
}
