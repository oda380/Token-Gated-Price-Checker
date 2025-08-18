'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

/* -------------------------------------------------------------
   Typed JSON fetch helper (generic lives HERE so TS sees it)
------------------------------------------------------------- */
export const j = async <T,>(resOrPromise: Response | Promise<Response>): Promise<T> => {
    const res = await resOrPromise;
    const text = await res.text();
    let json: unknown = null;
    try { json = JSON.parse(text); } catch {}
    if (!res.ok) {
      const msg = (json && typeof json === 'object' && 'error' in (json as any))
        ? (json as { error?: unknown }).error
        : text || `HTTP ${res.status}`;
      throw new Error(String(msg));
    }
    return (json as T) ?? ({} as T);
  };

/* -------------------------------------------------------------
   Types matching /api/price response
------------------------------------------------------------- */
export type PriceOk = {
  ok: true
  id: number
  symbol?: string
  name?: string
  convert: 'USD' | 'EUR'
  amount: number
  pricePerUnit: number
  total: number
  lastUpdated?: string
  at?: string
}
export type PriceErr = {
  error: string
  suggestions?: Array<{ id: number; symbol: string; name?: string; slug: string }>
  hint?: string
}
export type PriceResp = PriceOk | PriceErr

/* -------------------------------------------------------------
   Helpers
------------------------------------------------------------- */
function normalizeTicker(raw: string) {
  return String(raw ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/^\$/, '')
    .trim()
}

export function localToUtcIso(datetimeLocal: string) {
  // expects "YYYY-MM-DDTHH:mm" from <input type="datetime-local">
  const m = datetimeLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!m) return ''
  const [_, Y, M, D, h, mm] = m.map(Number)
  const dt = new Date(Y, (M ?? 1) - 1, D ?? 1, h ?? 0, mm ?? 0, 0, 0)
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString()
}

/* -------------------------------------------------------------
   Hooks (all use POST /api/price)
------------------------------------------------------------- */

/** Live price for 1 unit of `ticker` in `currency`. */
export function useLatestPrices(ticker: string, currency: 'USD' | 'EUR', enabled = true) {
  const input = normalizeTicker(ticker)
  const body = useMemo(
    () => JSON.stringify({ input, currency, amount: 1 }),
    [input, currency]
  )

  return useQuery({
    queryKey: ['price', 'live', input.toUpperCase(), currency],
    enabled: !!input && enabled,
    queryFn: () =>
      j<PriceResp>(
        fetch('/api/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        })
      ),
    staleTime: 30_000,
  })
}

/** Point-in-time price for 1 unit. */
export function useHistoricalPrice(
  ticker: string,
  currency: 'USD' | 'EUR',
  datetimeLocal: string,
  enabled = true
) {
  const input = normalizeTicker(ticker)
  const isoUtc = datetimeLocal ? localToUtcIso(datetimeLocal) : ''
  const body = useMemo(
    () => JSON.stringify({ input, currency, amount: 1, ...(isoUtc ? { timestamp: isoUtc } : {}) }),
    [input, currency, isoUtc]
  )

  return useQuery({
    queryKey: ['price', 'historical', input.toUpperCase(), currency, isoUtc || ''],
    enabled: !!input && !!isoUtc && enabled,
    queryFn: () =>
      j<PriceResp>(
        fetch('/api/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        })
      ),
    staleTime: 5 * 60_000,
  })
}

/** Convert an `amount` of `fromTicker` to `toCurrency` (live or at timestamp). */
export function useConvertAmount(
  fromTicker: string,
  amount: string,
  toCurrency: 'USD' | 'EUR',
  datetimeLocal?: string,
  enabled = true
) {
  const input = normalizeTicker(fromTicker)
  const qty = Number(amount)
  const isoUtc = datetimeLocal ? localToUtcIso(datetimeLocal) : undefined

  const body = useMemo(
    () =>
      JSON.stringify({
        input,
        currency: toCurrency,
        amount: isFinite(qty) && qty > 0 ? qty : 0,
        ...(isoUtc ? { timestamp: isoUtc } : {}),
      }),
    [input, toCurrency, qty, isoUtc]
  )

  return useQuery({
    queryKey: ['price', 'convert', input.toUpperCase(), qty || 0, toCurrency, isoUtc ?? 'live'],
    enabled: !!input && qty > 0 && enabled,
    queryFn: () =>
      j<PriceResp>(
        fetch('/api/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        })
      ),
    staleTime: isoUtc ? 5 * 60_000 : 30_000,
  })
}
