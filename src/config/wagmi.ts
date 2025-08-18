import { http } from 'viem'
import { base } from 'viem/chains'
import { cookieStorage, createStorage, createConfig } from 'wagmi'
import { injected } from '@wagmi/connectors'

if (!process.env.NEXT_PUBLIC_ALCHEMY_HTTP_URL) {
  throw new Error('NEXT_PUBLIC_ALCHEMY_HTTP_URL is not set')
}

export const config = createConfig({
  ssr: true,
  chains: [base],
  connectors: [
    injected({ shimDisconnect: true }),
    // Add more connectors later (e.g., walletConnect) if you want
  ],
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_HTTP_URL!),
  },
})
