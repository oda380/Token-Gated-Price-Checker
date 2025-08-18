// /lib/cgIndex.ts
const CG = 'https://api.coingecko.com/api/v3'

export type CGRow = { id: string; symbol: string; name: string }

let INDEX: CGRow[] = []
let LAST = 0
const TTL = 6 * 60 * 60 * 1000 // 6h

const now = () => Date.now()
const headers = () => {
  const h: Record<string, string> = {}
  if (process.env.CG_API_KEY) h['x-cg-demo-api-key'] = process.env.CG_API_KEY
  return h
}

// ✅ Canonical aliases for the most common tickers
const ALIASES: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  SOL: 'solana',
  TRX: 'tron',
  TON: 'the-open-network',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  SHIB: 'shiba-inu',
  WBTC: 'wrapped-bitcoin',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  LINK: 'chainlink',
  MATIC: 'matic-network',
  NEAR: 'near',
  XLM: 'stellar',
}

export async function loadIndex(force = false): Promise<CGRow[]> {
  if (!force && INDEX.length && now() - LAST < TTL) return INDEX
  const url = `${CG}/coins/list?include_platform=false`
  const res = await fetch(url, { headers: headers(), cache: 'no-store' })
  if (!res.ok) throw new Error(`CoinGecko /coins/list failed: ${res.status}`)
  const data = (await res.json()) as CGRow[]
  INDEX = data.map(d => ({ id: d.id, symbol: d.symbol?.toUpperCase?.() ?? '', name: d.name ?? '' }))
  LAST = now()
  return INDEX
}

export type ResolveResult =
  | { id: string; match: CGRow }
  | { suggestions: CGRow[] }
  | null

export function normalizeInput(raw: string) {
  return String(raw ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^\$/, '').trim()
}

// 🔎 Ranked search using CoinGecko /search (includes market_cap_rank)
async function cgSearch(query: string): Promise<Array<{ id: string; symbol: string; name: string; rank?: number }>> {
  const url = new URL(`${CG}/search`)
  url.searchParams.set('query', query)
  const res = await fetch(url.toString(), { headers: headers(), cache: 'no-store' })
  if (!res.ok) return []
  const json = await res.json()
  const coins = Array.isArray(json?.coins) ? json.coins : []
  return coins.map((c: any) => ({
    id: String(c.id),
    symbol: String(c.symbol || '').toUpperCase(),
    name: String(c.name || ''),
    rank: typeof c.market_cap_rank === 'number' ? c.market_cap_rank : undefined,
  }))
}

export async function resolveToId(input: string): Promise<ResolveResult> {
  const idx = await loadIndex()
  const q = normalizeInput(input)
  if (!q) return null

  // 0) Alias fast-path for top assets
  const symUp = q.toUpperCase()
  if (ALIASES[symUp]) {
    const id = ALIASES[symUp]
    const hit = idx.find(r => r.id === id) || { id, symbol: symUp, name: symUp }
    return { id, match: hit }
  }

  // 1) Exact id (slug) match
  const idExact = idx.find(r => r.id.toLowerCase() === q.toLowerCase())
  if (idExact) return { id: idExact.id, match: idExact }

  // 2) Exact name match
  const nameExact = idx.find(r => r.name.toLowerCase() === q.toLowerCase())
  if (nameExact) return { id: nameExact.id, match: nameExact }

  // 3) If looks like a ticker, prefer ranked results from /search
  const looksLikeTicker = /^[A-Za-z0-9.\-]{2,10}$/.test(q) && q === symUp
  if (looksLikeTicker) {
    const ranked = await cgSearch(q)
    const exactSymbolMatches = ranked.filter(r => r.symbol === symUp)
    if (exactSymbolMatches.length) {
      exactSymbolMatches.sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999))
      const best = exactSymbolMatches[0]
      return { id: best.id, match: { id: best.id, symbol: best.symbol, name: best.name } }
    }
    if (ranked.length) {
      // Fallback: top ranked overall
      ranked.sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999))
      const best = ranked[0]
      return { id: best.id, match: { id: best.id, symbol: best.symbol, name: best.name } }
    }
  }

  // 4) Fuzzy suggestions from local index as a last resort
  const starts = idx.filter(
    r => r.symbol.startsWith(symUp) || r.id.startsWith(q.toLowerCase()) || r.name.toLowerCase().startsWith(q.toLowerCase())
  )
  if (starts.length) return { suggestions: starts.slice(0, 7) }

  const contains = idx.filter(
    r => r.symbol.includes(symUp) || r.id.includes(q.toLowerCase()) || r.name.toLowerCase().includes(q.toLowerCase())
  )
  if (contains.length) return { suggestions: contains.slice(0, 7) }

  // 5) Nothing definite; try ranked suggestions from /search to help the user
  const ranked = await cgSearch(q)
  if (ranked.length) {
    const items = ranked.slice(0, 7).map(r => ({ id: r.id, symbol: r.symbol, name: r.name }))
    return { suggestions: items }
  }

  return null
}
