'use client'

import React from 'react'
import { useConvertAmount, type PriceResp } from '@/hooks/usePrices'

type Props = {
  ticker: string
  amount: string
  currency: 'USD' | 'EUR'
  at?: string
}

export default function ConversionView({ ticker, amount, currency, at }: Props) {
  const { data, isLoading, error } = useConvertAmount(ticker, amount, currency, at)


  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-700 p-6 bg-slate-800 animate-pulse text-gray-400">
        <p>Loading conversion data…</p>
      </div>
    )
  }

 
  if (error) {
    return (
      <div className="rounded-2xl border border-red-800 p-6 bg-red-950">
        <p className="text-red-400 text-sm">{String((error as Error).message)}</p>
      </div>
    )
  }

  if (!data) return null

  
  if ('error' in data) {
    return (
      <div className="rounded-2xl border border-amber-800 p-6 bg-amber-950 space-y-3">
        <p className="text-amber-400 text-sm">{data.error}</p>
        {data.suggestions?.length ? (
          <div className="text-sm">
            <p className="font-medium text-amber-300">Did you mean:</p>
            <ul className="list-disc ml-5 text-gray-300">
              {data.suggestions.map(s => (
                <li key={s.id}>
                  <span className="font-semibold">{s.symbol}</span>
                  {s.name ? <span className="text-gray-400"> — {s.name}</span> : null}
                  <span className="text-gray-500"> ({s.slug})</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  
  const sym = data.symbol ?? ticker.toUpperCase()
  const total = data.total
  const perUnit = data.pricePerUnit
  const timeLabel = data.at ?? data.lastUpdated ?? 'now'

  return (
    <div className="rounded-2xl border border-slate-700 p-6 space-y-3 bg-slate-800">
      <h4 className="font-bold text-white text-lg">Conversion</h4>
      <p className="text-base text-gray-300">
        <strong className="text-purple-400">{data.amount} {sym}</strong>
        {' '}= <strong className="text-white">{data.convert} {fmt2(total)}</strong>
        {' '}@ <span className="text-gray-400">{timeLabel}{data.at ? ' UTC' : ''}</span>
      </p>
      <p className="text-sm text-gray-400">≈ {data.convert} {fmt2(perUnit)} / 1 {sym}</p>

      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer font-semibold">Raw</summary>
        <pre className="overflow-auto bg-slate-900 text-gray-400 p-4 rounded-lg mt-2">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  )
}

function fmt2(n?: number) {
  if (typeof n !== 'number' || !isFinite(n)) return '—'
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
