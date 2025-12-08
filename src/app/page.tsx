'use client'
import React from 'react'
import { ConnectWalletButton } from '@/components/ConnectWalletButton'
import { useAccount } from 'wagmi'
import PriceViewer from '@/components/PriceViewer'
import AutoSiwe from '@/components/AutoSiwe'
import Marquee from '@/components/Marquee'

export default function Page() {
  const { isConnected } = useAccount()

  return (
    <>
      <AutoSiwe />

      {/* Persistent header with the ConnectButton */}
      <header className="flex justify-between items-center p-6 border-b-2 border-white bg-black sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#CCFF00] animate-pulse" />
          <h1 className="text-2xl font-bold uppercase tracking-tighter text-white select-none">
            NEXUS<span className="text-[#CCFF00]">_</span>PRICES
          </h1>
        </div>
        <ConnectWalletButton />
      </header>

      <Marquee items={['BTC', 'ETH', 'SOL', 'DOGE', 'PEPE', 'WIF', 'BONK', 'BASE', 'DEGEN', 'MOG', 'TURBO', 'LINK', 'UNI', 'AAVE', 'MKR', 'SNX', 'COMP', 'CRV', 'LDO', 'RPL', 'FXS']} />

      {/* Main content area */}
      <main className="container mx-auto max-w-3xl px-4 py-12 space-y-12">

        {/* Hero Section */}
        <section className="text-center space-y-6">
          <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter text-white leading-none">
            TERMINAL<span className="text-[#CCFF00]">_</span>V1
          </h2>
          <p className="text-xl md:text-2xl font-mono text-gray-400 uppercase tracking-widest">
            Open Access. <span className="text-white bg-black border border-white px-2">Real-Time</span>. Web3 Ready.
          </p>
          <div className="flex justify-center gap-4">
            <div className="h-1 w-24 bg-[#CCFF00]" />
            <div className="h-1 w-24 bg-[#FF00FF]" />
            <div className="h-1 w-24 bg-white" />
          </div>
        </section>

        {/* The Tool */}
        <PriceViewer />

        {/* Footer Info */}
        <footer className="text-center text-xs font-mono text-gray-600 uppercase tracking-widest pt-12">
          <p>Powered by CoinGecko API • Secured by Ethereum</p>
          <p className="mt-2">Nexus Prices © 2025</p>
        </footer>
      </main>
    </>
  )
}