
'use client'
import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import Login from '@/components/Login'
import GateGuard from '@/components/GateGuard'
import PriceViewer from '@/components/PriceViewer'
import AutoSiwe from '@/components/AutoSiwe'

export default function Page() {
  const { isConnected } = useAccount()

  return (
    <>
      <AutoSiwe />

      {/* Persistent header with the ConnectButton */}
      <header className="flex justify-end p-4">
        <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
      </header>

      {/* Main content area */}
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-8 text-center text-white">Crypto Price Chcker</h1>
        
        {/* Conditional rendering based on connection status */}
        {isConnected ? (
          <GateGuard>
            <PriceViewer />
          </GateGuard>
        ) : (
          <Login />
        )}
      </main>
    </>
  )
}