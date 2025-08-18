'use client'
import React from 'react'

export default function AccessDenied({ reason }: { reason: 'NO_NFT' | 'BLACKLISTED_TOKEN' | string }) {
  return (
    <div className="max-w-xl mx-auto border rounded-2xl p-6 space-y-3 bg-white">
      <h2 className="text-lg font-semibold">Access denied</h2>
      {reason === 'NO_NFT' && (
        <p className="text-sm opacity-80">
          You need to hold at least one valid NFT from the required collection on Base to use this app.
        </p>
      )}
      {reason === 'BLACKLISTED_TOKEN' && (
        <p className="text-sm opacity-80">
          Your wallet holds a token ID that’s blocked for this app. Please switch wallets or contact support.
        </p>
      )}
      {reason !== 'NO_NFT' && reason !== 'BLACKLISTED_TOKEN' && (
        <p className="text-sm opacity-80">Your wallet doesn’t meet the access requirements.</p>
      )}
      <ul className="text-xs list-disc pl-5 opacity-70">
        <li>Connect a different wallet that meets the gate.</li>
        <li>If you just acquired the NFT, wait a moment and retry.</li>
      </ul>
    </div>
  )
}
