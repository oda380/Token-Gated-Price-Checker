import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import ContextProvider from '@/context/provider'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nexus Prices',
  description: 'Open Access. Real-Time. Web3 Ready.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.className} bg-black text-white antialiased selection:bg-[#CCFF00] selection:text-black`}>
        <ContextProvider>{children}</ContextProvider>
      </body>
    </html>
  )
}
