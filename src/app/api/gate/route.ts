import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkGate } from '@/lib/gate'

export async function GET() {
  const session = await getServerSession(authOptions)

    // TEMP DEBUG — remove after testing
  console.log('GATE session:', session)

  const address = (session as any)?.address as `0x${string}` | undefined

  if (!address) {
    return new Response(JSON.stringify({ ok: false, error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

    // (optional) enforce Base chain on server too
    if ((session as any)?.chainId !== 8453) {
        return new Response(JSON.stringify({ ok: false, error: 'WRONG_CHAIN' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

  const gate = await checkGate(address)
  if (!gate.ok) return new Response(JSON.stringify({ ok:false, error: gate.reason }), { status: 403 })

  return new Response(JSON.stringify({ ok: true, address }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
