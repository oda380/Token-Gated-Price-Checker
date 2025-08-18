'use client'
import React from 'react'
import AccessDenied from './AccessDenied'
import { useSession } from 'next-auth/react'
import { useAccount } from 'wagmi'

export default function GateGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount()
  const { status } = useSession()
  const [state, setState] = React.useState<
    { kind: 'loading' } |
    { kind: 'unauth' } |
    { kind: 'denied'; reason: string } |
    { kind: 'ok' }
  >({ kind: 'loading' })

  React.useEffect(() => {
    let alive = true

    async function run() {
      // not connected or not signed in → show unauth card
      if (!isConnected || status !== 'authenticated') {
        if (!alive) return
        setState({ kind: 'unauth' })
        return
      }
      // check gate
      try {
        const res = await fetch('/api/gate', { cache: 'no-store' })
        if (!alive) return
        if (res.status === 200) {
          setState({ kind: 'ok' })
        } else if (res.status === 401) {
          setState({ kind: 'unauth' })
        } else if (res.status === 403) {
          const j = await res.json().catch(() => ({}))
          setState({ kind: 'denied', reason: j?.error || 'DENIED' })
        } else {
          setState({ kind: 'denied', reason: 'DENIED' })
        }
      } catch {
        if (!alive) return
        setState({ kind: 'denied', reason: 'DENIED' })
      }
    }

    run()
    return () => { alive = false }
  }, [isConnected, status])

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
          Use the button above to connect your wallet and sign in with Ethereum.
        </p>
      </div>
    )
  }

  if (state.kind === 'denied') {
    return <AccessDenied reason={state.reason} />
  }

  // ok
  return <>{children}</>
}
