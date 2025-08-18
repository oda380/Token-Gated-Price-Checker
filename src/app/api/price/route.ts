// /app/api/price/route.ts
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { resolveToId, normalizeInput } from '@/lib/cgIndex'

type Convert = 'USD' | 'EUR'
const CG = 'https://api.coingecko.com/api/v3'

const headers = () => {
  const h: Record<string, string> = {}
  if (process.env.CG_API_KEY) h['x-cg-demo-api-key'] = process.env.CG_API_KEY
  return h
}

// nearest in array of [ms, price]
function nearestPoint(points: [number, number][], targetMs: number) {
  if (!Array.isArray(points) || points.length === 0) return null
  let best = points[0]
  let bestDiff = Math.abs(points[0][0] - targetMs)
  for (let i = 1; i < points.length; i++) {
    const d = Math.abs(points[i][0] - targetMs)
    if (d < bestDiff) { best = points[i]; bestDiff = d }
  }
  return best
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const rawInput = normalizeInput(body?.input ?? '')
    const amount = Number(body?.amount ?? 1)
    const convert = String(body?.currency ?? 'USD').toUpperCase() as Convert
    const timestampIso: string | undefined = body?.timestamp

    if (!rawInput) return NextResponse.json({ error: 'Missing input' }, { status: 400 })
    if (!['USD', 'EUR'].includes(convert)) return NextResponse.json({ error: 'Unsupported currency. Use USD or EUR.' }, { status: 400 })
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'Amount must be > 0' }, { status: 400 })

    const resolved = await resolveToId(rawInput)
    if (!resolved) return NextResponse.json({ error: 'No match. Try a symbol like BTC, a name like Ethereum, or the CoinGecko id (bitcoin).' }, { status: 404 })
    if ('suggestions' in resolved) {
      return NextResponse.json({
        error: 'Ambiguous input. Did you mean:',
        suggestions: resolved.suggestions.map(s => ({ id: s.id, symbol: s.symbol, name: s.name, slug: s.id }))
      }, { status: 409 })
    }

    const id = resolved.id
    const symbol = resolved.match.symbol
    const name = resolved.match.name

    if (timestampIso) {
      const t = Date.parse(timestampIso)
      if (Number.isNaN(t)) return NextResponse.json({ error: 'Invalid timestamp ISO' }, { status: 400 })

      const targetSec = Math.floor(t / 1000)
      const from = targetSec - 2 * 60 * 60
      const to = targetSec + 2 * 60 * 60

      const url = new URL(`${CG}/coins/${encodeURIComponent(id)}/market_chart/range`)
      url.searchParams.set('vs_currency', convert.toLowerCase())
      url.searchParams.set('from', String(from))
      url.searchParams.set('to', String(to))

      const res = await fetch(url.toString(), { headers: headers(), cache: 'no-store' })
      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: `CoinGecko range error: ${text || res.status}` }, { status: 400 })
      }
      const json = await res.json()
      const prices = (json?.prices ?? []) as [number, number][]
      const pick = nearestPoint(prices, t)
      if (!pick) {
        return NextResponse.json({
          error: `No historical datapoint near ${timestampIso}`,
          hint: 'Try a different time or just use live price.'
        }, { status: 404 })
      }

      const pricePerUnit = pick[1]
      const total = amount * pricePerUnit
      return NextResponse.json({
        ok: true,
        id, symbol, name,
        convert,
        amount,
        pricePerUnit,
        total,
        lastUpdated: new Date(pick[0]).toISOString(),
        at: timestampIso
      })
    } else {
      const url = new URL(`${CG}/simple/price`)
      url.searchParams.set('ids', id)
      url.searchParams.set('vs_currencies', convert.toLowerCase())

      const res = await fetch(url.toString(), { headers: headers(), cache: 'no-store' })
      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: `CoinGecko simple price error: ${text || res.status}` }, { status: 400 })
      }
      const json = await res.json()
      const node = json?.[id]
      const pricePerUnit = node?.[convert.toLowerCase()] as number | undefined
      if (typeof pricePerUnit !== 'number') return NextResponse.json({ error: `No ${convert} quote for ${id}` }, { status: 404 })

      const total = amount * pricePerUnit
      return NextResponse.json({
        ok: true,
        id, symbol, name,
        convert,
        amount,
        pricePerUnit,
        total,
        lastUpdated: new Date().toISOString(),
        at: undefined
      })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
