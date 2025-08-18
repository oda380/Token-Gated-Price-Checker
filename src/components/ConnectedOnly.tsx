'use client'
import React from 'react'
import { useAccount } from 'wagmi'

export default function ConnectedOnly({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount()
  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto border rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">Connect & Sign In</h2>
        <p className="text-sm opacity-80">
          Use the button above to connect your wallet with an access NFT and sign in.
        </p>
      </div>
    )
  }
  return <>{children}</>
}
