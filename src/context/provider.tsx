'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cookieToInitialState, WagmiProvider, type Config, createConfig, http } from 'wagmi'
import { SessionProvider } from 'next-auth/react'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { RainbowKitSiweNextAuthProvider } from '@rainbow-me/rainbowkit-siwe-next-auth'

const queryClient = new QueryClient()

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!

// Define config here to avoid it being imported by server components
const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Token-Gated Price Checker',
  projectId: wcProjectId,
  chains: [base],
  transports: { [base.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_HTTP_URL) },
  ssr: true,
})

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
              appInfo={{ appName: process.env.NEXT_PUBLIC_APP_NAME || 'Token-Gated Price Checker' }}
            >
              {children}
            </RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  )
}
