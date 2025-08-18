'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { SessionProvider } from 'next-auth/react'
import { config } from '@/config/wagmi'

import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { RainbowKitSiweNextAuthProvider } from '@rainbow-me/rainbowkit-siwe-next-auth'
import { base } from 'wagmi/chains'

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
        <QueryClientProvider client={queryClient}>
          <RainbowKitSiweNextAuthProvider
            getSiweMessageOptions={() => ({ statement: 'Sign in to Token-Gated Price Checker' })}
          >
            <RainbowKitProvider
              theme={darkTheme({ accentColor: '#0ea5e9' })}
              modalSize="compact"
              initialChain={base}
              appInfo={{ appName: 'Token-Gated Price Checker' }}
            >
              {children}
            </RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  )
}
