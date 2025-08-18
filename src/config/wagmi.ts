

// src/config/wagmi.ts
'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'
import { http } from 'wagmi'

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!
export const config = getDefaultConfig({
  appName: 'Token-Gated Price Checker',
  projectId: wcProjectId,           // enables WalletConnect QR in the modal
  chains: [base],
  transports: { [base.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_HTTP_URL) }, // or your Alchemy/Infura http(url)
  ssr: true,
})
