'use client'

import React from 'react'
import { useConvertAmount, type PriceResp } from '@/hooks/usePrices'

type Props = {
  ticker: string                // e.g., "BTC"
  amount: string                // e.g., "0.1"
  currency: 'USD' | 'EUR'       // target fiat
  at?: string                   // optional "YYYY-MM-DDTHH:mm" (local) for historical
}

export default function ConversionView({ ticker, amount, currency, at }: Props) {
  const { data, isLoading, error } = useConvertAmount(ticker, amount, currency, at)

  if (isLoading) {
    return (
      <div className="rounded-2xl border p-4 bg-gray-50">
        <p>Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border p-4 bg-red-50">
        <p className="text-red-600 text-sm">{String((error as Error).message)}</p>
      </div>
    )
  }

  if (!data) return null

  // Ambiguous / error path with suggestions from /api/price (409)
  if ('error' in data) {
    return (
      <div className="rounded-2xl border p-4 bg-amber-50 space-y-2">
        <p className="text-amber-700 text-sm">{data.error}</p>
        {data.suggestions?.length ? (
          <div className="text-sm">
            <p className="font-medium">Did you mean:</p>
            <ul className="list-disc ml-5">
              {data.suggestions.map(s => (
                <li key={s.id}>
                  {s.symbol}
                  {s.name ? <span className="opacity-70"> — {s.name}</span> : null}
                  <span className="opacity-60"> ({s.slug})</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  // Success
  const sym = data.symbol ?? ticker.toUpperCase()
  const total = data.total
  const perUnit = data.pricePerUnit
  const timeLabel = data.at ?? data.lastUpdated ?? 'now'

  return (
    <div className="rounded-2xl border p-4 space-y-2 bg-gray-50">
      <h4 className="font-semibold">Conversion</h4>
      <p className="text-base">
        <strong>{data.amount} {sym}</strong>
        {' '}= <strong>{data.convert} {fmt2(total)}</strong>
        {' '}@ <span className="opacity-80">{timeLabel}{data.at ? ' UTC' : ''}</span>
      </p>
      <p className="text-sm opacity-80">≈ {data.convert} {fmt2(perUnit)} / 1 {sym}</p>

      <details className="text-xs">
        <summary>Raw</summary>
        <pre className="overflow-auto">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  )
}

function fmt2(n?: number) {
  if (typeof n !== 'number' || !isFinite(n)) return '—'
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
