const CMC_BASE = 'https://pro-api.coinmarketcap.com'
const CMC_KEY = process.env.CMC_API_KEY!

async function cmcFetch(path: string, params: Record<string, string>) {
  const url = new URL(path, CMC_BASE)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: { 'X-CMC_PRO_API_KEY': CMC_KEY }
  })
  if (!res.ok) throw new Error(`CMC ${path} ${res.status}`)
  return res.json()
}

export async function cmcLatest({ symbols, convert = ['USD','EUR'] }: { symbols: string[]; convert?: string[] }) {
  const data = await cmcFetch('/v1/cryptocurrency/quotes/latest', {
    symbol: symbols.join(','),
    convert: convert.join(',')
  })
  return data.data // keyed by symbol
}

export async function cmcConvert({
    amount,
    symbol,
    convert,
    isoUtc
  }: { amount: number; symbol: string; convert: string[]; isoUtc?: string }) {
    const params: Record<string, string> = {
      amount: String(amount),
      symbol,
      convert: convert.join(',')
    }
    if (isoUtc) params.time = isoUtc
    const data = await cmcFetch('/v2/tools/price-conversion', params)
    return data.data
  }
  

  

export async function cmcAtTime({ symbol, isoUtc, convert = ['USD','EUR'] }: { symbol: string; isoUtc: string; convert?: string[] }) {
  // narrow to a ±60s window, 1m interval (GMT = UTC)
  const center = new Date(isoUtc).getTime()
  const start = new Date(center - 60_000).toISOString()
  const end   = new Date(center + 60_000).toISOString()
  const data = await cmcFetch('/v1/cryptocurrency/quotes/historical', {
    symbol,
    time_start: start,
    time_end: end,
    interval: '1m',
    convert: convert.join(',')
  })
  const quotes = data?.data?.quotes || []
  if (!quotes.length) return null
  // pick the quote with timestamp nearest to isoUtc
  let best = quotes[0]
  let bestDiff = Math.abs(new Date(quotes[0].timestamp).getTime() - center)
  for (const q of quotes) {
    const d = Math.abs(new Date(q.timestamp).getTime() - center)
    if (d < bestDiff) { best = q; bestDiff = d }
  }
  return best
}
