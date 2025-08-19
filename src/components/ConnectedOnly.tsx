'use client'
import React from 'react'
import { useAccount } from 'wagmi'

export default function ConnectedOnly({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount()
  
  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="max-w-xl mx-auto rounded-2xl p-8 space-y-4 bg-slate-800 border border-slate-700 shadow-xl text-center">
          <h2 className="text-2xl font-bold text-white">
            Connect & Sign In
          </h2>
          <p className="text-gray-400">
            Use the button above to connect your wallet with an access NFT and sign in.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}