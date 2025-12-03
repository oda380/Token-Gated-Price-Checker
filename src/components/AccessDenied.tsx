'use client'
import React from 'react'

export default function AccessDenied({ reason }: { reason: 'NO_NFT' | 'BLACKLISTED_TOKEN' | string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-white">
      <div className="neo-card max-w-xl mx-auto space-y-6 text-center border-red-500 shadow-[8px_8px_0px_0px_red]">
        <h2 className="text-3xl font-bold uppercase tracking-tighter text-red-500">Access Denied</h2>

        <div className="space-y-4">
          {reason === 'NO_NFT' && (
            <p className="text-white font-mono text-sm uppercase">
              YOU NEED TO HOLD AT LEAST ONE VALID NFT FROM THE REQUIRED COLLECTION ON BASE TO USE THIS APP.
            </p>
          )}
          {reason === 'BLACKLISTED_TOKEN' && (
            <p className="text-white font-mono text-sm uppercase">
              YOUR WALLET HOLDS A TOKEN ID THAT’S DEACTIVATED FOR THIS APP.
            </p>
          )}
          {reason !== 'NO_NFT' && reason !== 'BLACKLISTED_TOKEN' && (
            <p className="text-white font-mono text-sm uppercase">YOUR WALLET DOESN’T MEET THE ACCESS REQUIREMENTS.</p>
          )}
        </div>

        <div className="w-full h-0.5 bg-red-900" />

        <div className="bg-red-950/50 p-4 border border-red-900">
          <p className="text-xs text-red-300 font-bold uppercase mb-2">Interested in access?</p>
          <p className="text-xs text-gray-400 font-mono">
            PLEASE CONTACT THE ADMIN TO REQUEST AN ACCESS NFT.
          </p>
        </div>

        <ul className="text-xs list-disc pl-5 text-gray-500 space-y-2 text-left font-mono uppercase">
          <li>CONNECT A DIFFERENT WALLET THAT MEETS THE GATE.</li>
          <li>IF YOU JUST ACQUIRED THE NFT, WAIT A MOMENT AND RETRY.</li>
        </ul>
      </div>
    </div>
  )
}