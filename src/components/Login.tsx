'use client'

import React from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { SiweMessage } from 'siwe'
import { base } from 'viem/chains'
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSwitchChain
} from 'wagmi'

export default function Login() {
  const { status } = useSession()
  const authed = status === 'authenticated'

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connectors, connectAsync, isPending: isConnecting } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { switchChainAsync } = useSwitchChain()              // ⬅️ added

  const [busy, setBusy] = React.useState(false)
  const [uiMsg, setUiMsg] = React.useState<string>('')

  const btnLabel = !isConnected
    ? 'Connect & Sign In'
    : !authed
    ? 'Sign In'
    : 'Sign Out'

  async function connectIfNeeded() {
    if (isConnected) return
    const preferred =
      connectors.find((c) => c.id === 'injected') || // MetaMask / browser wallet
      connectors[0]
    if (!preferred) throw new Error('No wallet connector available')
    await connectAsync({ connector: preferred })
  }

  async function ensureBaseChain() {
    // Only switch if not already on Base
    if (chainId !== base.id) {
      try {
        setUiMsg('Switching to Base…')
        await switchChainAsync({ chainId: base.id })
      } catch (err: any) {
        // Common failures: user rejected, wallet doesn’t support chain add, etc.
        throw new Error('Please switch your wallet to Base (chainId 8453) and try again.')
      } finally {
        setUiMsg('')
      }
    }
  }

  async function doSiwe() {
    // 1) ensure wallet connected
    await connectIfNeeded()
    if (!address) throw new Error('No wallet address')

    // 2) enforce Base chain before composing SIWE
    await ensureBaseChain()                                   // ⬅️ added

    // 3) fetch nonce from our API
    const nonceResp = await fetch('/api/siwe/nonce', { cache: 'no-store' })
    if (!nonceResp.ok) throw new Error('Failed to get nonce')
    const { nonce } = await nonceResp.json()

    // 4) compose SIWE message (now guaranteed chainId === base.id)
    const msg = new SiweMessage({
      domain: window.location.host,
      address: address as `0x${string}`,
      statement: 'Sign in with Ethereum to My Gated Prices.',
      uri: window.location.origin,
      version: '1',
      chainId,                                               // still fine; just switched if needed
      nonce,
    })
    const prepared = msg.prepareMessage()

    // 5) sign + send to NextAuth
    const signature = await signMessageAsync({ message: prepared })
    const res = await signIn('credentials', {
      message: prepared,
      signature,
      redirect: false,
    })
    if (!res?.ok) throw new Error(res?.error || 'SIWE failed')
  }

  async function handleClick() {
    try {
      setBusy(true)
      setUiMsg('')
      if (authed) {
        await signOut({ redirect: false })
        // Optional: also disconnect wallet
        // await disconnectAsync().catch(() => {})
        setUiMsg('Signed out')
      } else {
        await doSiwe()
        setUiMsg('Signed in ✅')
      }
    } catch (e: any) {
      setUiMsg(e?.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''

  return (
    <div className="flex items-center gap-3">
      <button
        className="px-3 py-2 rounded border hover:bg-gray-50 disabled:opacity-50"
        onClick={handleClick}
        disabled={busy || isConnecting}
        title="Connect / Sign In / Sign Out"
      >
        {btnLabel}
      </button>

      {isConnected && (
        <span className="text-sm opacity-80">
          {short} {authed ? '• signed in' : '• connected'}
        </span>
      )}

      {uiMsg && <span className="text-sm opacity-80">{uiMsg}</span>}
    </div>
  )
}
