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
      <div className="max-w-xl mx-auto border rounded-2xl p-6">
        <p className="text-sm opacity-80">Checking access…</p>
      </div>
    )
  }

  if (state.kind === 'unauth') {
    return (
      <div className="max-w-xl mx-auto border rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">Please connect & sign in</h2>
        <p className="text-sm opacity-80">
          Use the connect button above to link your wallet and Sign-In with Ethereum.
        </p>
      </div>
    )
  }

  if (state.kind === 'wrongchain') {
    return (
      <div className="max-w-xl mx-auto border rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">Wrong network</h2>
        <p className="text-sm opacity-80">
          This app only works on <b>Base</b>. Please switch networks to continue.
        </p>
        <div>
          <button
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={() => switchChainAsync({ chainId: base.id }).catch(() => {})}
            disabled={switching}
          >
            {switching ? 'Switching…' : 'Switch to Base'}
          </button>
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
