'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { SessionProvider } from 'next-auth/react'
import { config } from '@/config/wagmi'

const queryClient = new QueryClient()

export default function ContextProvider({
  children,
  cookies,
}: {
  children: React.ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(config as Config, cookies || undefined)

  return (
    <SessionProvider>
      <WagmiProvider config={config as Config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  )
}

