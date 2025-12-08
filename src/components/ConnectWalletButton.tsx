'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function ConnectWalletButton() {
    return <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
}
