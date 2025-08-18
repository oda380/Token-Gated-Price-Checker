// /lib/cmcIndex.ts
// Local symbol index for ALL active CMC tokens.
// - Refreshes on cold start and every N hours
// - Resolves user input (symbol/slug/name) to a stable CMC id
// - Always quote by id afterwards

const CMC_BASE = 'https://pro-api.coinmarketcap.com';
const CMC_KEY = process.env.CMC_API_KEY!;
if (!CMC_KEY) {
  // Do NOT throw on import; throw only when used (prevents build issues)
  console.warn('[cmcIndex] CMC_API_KEY is missing. Set it in .env.local.');
}

export type TokenIndexRow = {
  id: number;
  symbol: string; // e.g., ETH
  slug: string;   // e.g., ethereum
  name?: string;  // e.g., Ethereum
  rank?: number;  // lower is bigger
};

let INDEX: TokenIndexRow[] = [];
let LAST_REFRESH = 0;
const REFRESH_MS = 6 * 60 * 60 * 1000; // 6h

function headers() {
  return { 'X-CMC_PRO_API_KEY': CMC_KEY };
}

function now() {
  return Date.now();
}

export function normalizeInput(raw: string) {
  return String(raw ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')  // zero-width
    .replace(/^\$/, '')                     // leading $
    .trim();
}
const upper = (s: string) => s.toUpperCase();

export async function refreshIndex(force = false) {
  if (!CMC_KEY) throw new Error('CMC_API_KEY is not set.');
  if (!force && now() - LAST_REFRESH < REFRESH_MS && INDEX.length > 0) return;

  const url = new URL(`${CMC_BASE}/v1/cryptocurrency/map`);
  url.searchParams.set('listing_status', 'active'); // you can add 'inactive' if you want legacy coins


  const res = await fetch(url.toString(), { headers: headers(), cache: 'no-store' });
  const json = await res.json();

  if (json?.status?.error_code) {
    throw new Error(`CMC map error ${json.status.error_code}: ${json.status.error_message || 'Unknown'}`);
  }

  const data = (json?.data ?? []) as any[];
  INDEX = data.map((d) => ({
    id: d.id,
    symbol: d.symbol,
    slug: d.slug,
    name: d.name,
    rank: undefined,
  }));

  // Keep a stable order by rank, then symbol
  INDEX.sort((a, b) => (a.symbol || '').localeCompare(b.symbol || '')); // optional
  LAST_REFRESH = now();

  console.log(`[cmcIndex] Loaded ${INDEX.length} active listings from CMC.`);
}

export async function loadIndex(): Promise<TokenIndexRow[]> {
  if (INDEX.length === 0) {
    await refreshIndex(true);
  } else if (now() - LAST_REFRESH >= REFRESH_MS) {
    // non-blocking refresh in background best-effort
    refreshIndex(true).catch((e) => console.warn('[cmcIndex] background refresh failed:', e?.message));
  }
  return INDEX;
}

export type ResolveResult =
  | { id: number; match: TokenIndexRow }
  | { suggestions: TokenIndexRow[] }
  | null;

// Quick alias map to short-circuit popular queries (optional, safe defaults)
const ALIASES: Record<string, number> = {
  BTC: 1,
  ETH: 1027,
  USDT: 825,
  USDC: 3408,
  BNB: 1839,
  XRP: 52,
  ADA: 2010,
  DOGE: 74,
  SOL: 5426,
  WBTC: 3717,
};

export async function resolveToId(input: string): Promise<ResolveResult> {
  const idx = await loadIndex();
  const q = normalizeInput(input);

  if (!q) return null;

  // Exact symbol (with alias fast path)
  const symU = upper(q);
  if (ALIASES[symU]) {
    const best = idx.find((r) => r.id === ALIASES[symU]);
    if (best) return { id: best.id, match: best };
  }

  const exactSymbolMatches = idx.filter((r) => upper(r.symbol) === symU);
  if (exactSymbolMatches.length) {
    exactSymbolMatches.sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999));
    return { id: exactSymbolMatches[0].id, match: exactSymbolMatches[0] };
  }

  // Exact slug
  const exactSlug = idx.find((r) => r.slug.toLowerCase() === q.toLowerCase());
  if (exactSlug) return { id: exactSlug.id, match: exactSlug };

  // Exact name
  const exactName = idx.find((r) => (r.name || '').toLowerCase() === q.toLowerCase());
  if (exactName) return { id: exactName.id, match: exactName };

  // Fuzzy: startsWith (symbol/slug/name)
  const starts = idx.filter(
    (r) =>
      upper(r.symbol).startsWith(symU) ||
      r.slug.toLowerCase().startsWith(q.toLowerCase()) ||
      (r.name || '').toLowerCase().startsWith(q.toLowerCase()),
  );
  if (starts.length) {
    // Limit suggestions
    return { suggestions: starts.slice(0, 7) };
  }

  // Fuzzy: contains
  const contains = idx.filter(
    (r) =>
      upper(r.symbol).includes(symU) ||
      r.slug.toLowerCase().includes(q.toLowerCase()) ||
      (r.name || '').toLowerCase().includes(q.toLowerCase()),
  );
  if (contains.length) {
    return { suggestions: contains.slice(0, 7) };
  }

  return null;
}
