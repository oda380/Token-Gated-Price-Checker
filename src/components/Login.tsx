// src/components/Login.tsx
'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Login() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center text-white">
      <div className="max-w-md mx-auto neo-card space-y-6 text-center">
        <h3 className="font-bold text-4xl mb-3 uppercase tracking-tighter">Welcome</h3>
        <p className="text-gray-300 font-mono text-sm">
          CONNECT YOUR WALLET TO ACCESS THE TERMINAL.
        </p>
        <div className="mt-6 flex justify-center">
          <ConnectButton label="CONNECT WALLET" showBalance={false} accountStatus="address" chainStatus="none" />
        </div>
      </div>
    </div>
  );
}