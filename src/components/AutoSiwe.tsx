// src/components/AutoSiwe.tsx
'use client'

import * as React from 'react'
import { useSession, signIn } from 'next-auth/react'
import { SiweMessage } from 'siwe'
import { useAccount, useChainId, useSignMessage, useSwitchChain } from 'wagmi'
import { base } from 'wagmi/chains'

export default function AutoSiwe() {
  const { status } = useSession()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { signMessageAsync } = useSignMessage()
  const { switchChainAsync } = useSwitchChain()

  const [running, setRunning] = React.useState(false)
  const [lastAddr, setLastAddr] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Only run when:
    //  - wallet is connected
    //  - NextAuth is not authenticated yet
    //  - we aren't already running
    //  - we haven't already SIWE'd this address in this session
    if (!isConnected || status !== 'unauthenticated' || running || !address) return
    if (lastAddr && lastAddr === address) return

    let alive = true
    ;(async () => {
      try {
        setRunning(true)

        // Ensure Base chain (8453) before composing SIWE
        if (chainId !== base.id) {
          try {
            await switchChainAsync({ chainId: base.id })
          } catch {
            // user rejected or wallet can't switch — stop auto-sign
            return
          }
        }

        // 1) fetch SIWE nonce
        const nonceRes = await fetch('/api/siwe/nonce', { cache: 'no-store' })
        if (!nonceRes.ok) return
        const { nonce } = (await nonceRes.json()) as { nonce: string }

        // 2) compose message
        const msg = new SiweMessage({
          domain: window.location.host,
          address: address as `0x${string}`,
          statement: 'Sign in to Token-Gated Price Checker',
          uri: window.location.origin,
          version: '1',
          chainId: base.id,
          nonce,
        })
        const prepared = msg.prepareMessage()

        // 3) user signs
        const signature = await signMessageAsync({ message: prepared })

        // 4) hand to NextAuth (credentials)
        const res = await signIn('credentials', {
          message: prepared,
          signature,
          redirect: false,
        })

        if (alive && res?.ok) {
          setLastAddr(address)
        }
      } finally {
        if (alive) setRunning(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [isConnected, status, running, address, chainId, signMessageAsync, switchChainAsync, lastAddr])

  return null
}
