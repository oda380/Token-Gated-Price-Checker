// src/components/Login.tsx
'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import AutoSiwe from './AutoSiwe'

export default function Login() {
  return (
    <div className="rounded-2xl border p-4">
      <h3 className="font-semibold mb-3">Connect wallet</h3>
      <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
      <p className="text-xs opacity-60 mt-2">
        No browser wallet? Choose <b>WalletConnect</b> and scan the QR with your mobile wallet.
      </p>
      {/* Automatically performs SIWE right after a successful connection */}
      <AutoSiwe />
    </div>
  )
}
