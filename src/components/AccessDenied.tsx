'use client'
import React from 'react'

export default function AccessDenied({ reason }: { reason: 'NO_NFT' | 'BLACKLISTED_TOKEN' | string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
      <div className="max-w-xl mx-auto rounded-2xl p-8 space-y-4 bg-slate-800 border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        {reason === 'NO_NFT' && (
          <p className="text-gray-400">
            You need to hold at least one valid NFT from the required collection on Base to use this app.
          </p>
        )}
        {reason === 'BLACKLISTED_TOKEN' && (
          <p className="text-gray-400">
            Your wallet holds a token ID that’s deactivated for this app. Please switch wallets or contact support.
          </p>
        )}
        {reason !== 'NO_NFT' && reason !== 'BLACKLISTED_TOKEN' && (
          <p className="text-gray-400">Your wallet doesn’t meet the access requirements.</p>
        )}
        <ul className="text-sm list-disc pl-5 text-gray-500 space-y-2">
          <li>Connect a different wallet that meets the gate.</li>
          <li>If you just acquired the NFT, wait a moment and retry.</li>
        </ul>
      </div>
    </div>
  )
}