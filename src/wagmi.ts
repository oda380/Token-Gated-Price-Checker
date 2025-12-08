import { createConfig, http, type Config } from 'wagmi'
import { base } from 'wagmi/chains'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
    rainbowWallet,
    walletConnectWallet,
    coinbaseWallet,
    injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'

function makeConfig() {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!
    const alchemyUrl = process.env.NEXT_PUBLIC_ALCHEMY_HTTP_URL!

    const connectors = connectorsForWallets(
        [
            {
                groupName: 'Recommended',
                wallets: [
                    injectedWallet,
                    rainbowWallet,
                    walletConnectWallet,
                    coinbaseWallet,
                ],
            },
        ],
        { appName: 'Token-Gated Price Checker', projectId }
    )

    return createConfig({
        chains: [base],
        transports: { [base.id]: http(alchemyUrl) },
        connectors,
        ssr: true,
    })
}

declare global {
    // eslint-disable-next-line no-var
    var __wagmiConfig: Config | undefined
}

export const config = globalThis.__wagmiConfig ?? (globalThis.__wagmiConfig = makeConfig())
