'use client'
import React from 'react'
import AccessDenied from './AccessDenied'
import { useSession } from 'next-auth/react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { base } from 'wagmi/chains'

type State =
  | { kind: 'loading' }
  | { kind: 'unauth' }
  | { kind: 'wrongchain' }
  | { kind: 'denied'; reason: string }
  | { kind: 'ok' }

export default function GateGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync, isPending: switching } = useSwitchChain()

  const [state, setState] = React.useState<State>({ kind: 'loading' })

  React.useEffect(() => {
    let alive = true

    async function check() {
      // Not connected or not signed in
      if (!isConnected || status !== 'authenticated') {
        if (!alive) return
        setState({ kind: 'unauth' })
        return
      }

      // Must be on Base
      if (chainId !== base.id) {
        if (!alive) return
        setState({ kind: 'wrongchain' })
        return
      }

      // Hit gate
      try {
        const res = await fetch('/api/gate', { cache: 'no-store' })
        if (!alive) return
        if (res.status === 200) setState({ kind: 'ok' })
        else if (res.status === 401) setState({ kind: 'unauth' })
        else if (res.status === 403) {
          const j: unknown = await res.json().catch(() => ({}))
          const reason =
            j && typeof j === 'object' && 'error' in j ? String((j as any).error) : 'DENIED'
          setState({ kind: 'denied', reason })
        } else {
          setState({ kind: 'denied', reason: 'DENIED' })
        }
      } catch {
        if (!alive) return
        setState({ kind: 'denied', reason: 'DENIED' })
      }
    }

    // While session is loading, show loading
    if (status === 'loading') {
      setState({ kind: 'loading' })
      return
    }

    check()
    return () => {
      alive = false
    }
  }, [isConnected, status, chainId])

  // UI states
  if (state.kind === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white">
        <div className="neo-card max-w-xl mx-auto text-center">
          <p className="text-[#CCFF00] font-mono animate-pulse uppercase tracking-widest">Checking access...</p>
        </div>
      </div>
    )
  }

  if (state.kind === 'unauth') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white">
        <div className="neo-card max-w-xl mx-auto space-y-4 text-center">
          <h2 className="text-2xl font-bold uppercase tracking-tighter">Authentication Required</h2>
          <p className="text-gray-300 font-mono text-sm">
            PLEASE SIGN THE MESSAGE IN YOUR WALLET TO VERIFY OWNERSHIP.
          </p>
          <div className="w-full h-1 bg-gray-800 my-4" />
          <p className="text-xs text-gray-500 uppercase">Waiting for signature...</p>
        </div>
      </div>
    )
  }

  if (state.kind === 'wrongchain') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white">
        <div className="neo-card max-w-xl mx-auto space-y-4 text-center border-red-500 shadow-[8px_8px_0px_0px_red]">
          <h2 className="text-2xl font-bold uppercase tracking-tighter text-red-500">Wrong Network</h2>
          <p className="text-gray-300 font-mono text-sm">
            ACCESS RESTRICTED TO <span className="text-white font-bold">BASE</span> NETWORK.
          </p>
          <div className="pt-4">
            <button
              className="neo-btn w-full"
              onClick={() => switchChainAsync({ chainId: base.id }).catch(() => { })}
              disabled={switching}
            >
              {switching ? 'SWITCHING...' : 'SWITCH TO BASE'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state.kind === 'denied') {
    return <AccessDenied reason={state.reason} />
  }

  // ok
  return <>{children}</>
}