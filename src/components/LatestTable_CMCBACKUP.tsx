'use client'

import { useLatestPrices, PriceResp } from '@/hooks/usePrices'

type Props = {
  tickers: string[]            // e.g., ['BTC','ETH','SOL']
  currency: 'USD' | 'EUR'      // selected fiat
}

export default function LatestTable({ tickers, currency }: Props) {
  if (!tickers?.length) return <p className="text-sm opacity-70">No tickers</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left">
          <tr>
            <th className="py-2 pr-4">Symbol</th>
            <th className="py-2 pr-4">Currency</th>
            <th className="py-2 pr-4">Price</th>
            <th className="py-2 pr-4">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickers.map(t => (
            <LatestRow key={t} ticker={t} currency={currency} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LatestRow({ ticker, currency }: { ticker: string; currency: 'USD' | 'EUR' }) {
  const { data, isLoading, error } = useLatestPrices(ticker, currency)

  if (isLoading) {
    return (
      <tr>
        <td className="py-2 pr-4 font-medium">{ticker.toUpperCase()}</td>
        <td className="py-2 pr-4">{currency}</td>
        <td className="py-2 pr-4">Loading…</td>
        <td className="py-2 pr-4">—</td>
      </tr>
    )
  }

  if (error) {
    return (
      <tr>
        <td className="py-2 pr-4 font-medium">{ticker.toUpperCase()}</td>
        <td className="py-2 pr-4">{currency}</td>
        <td className="py-2 pr-4 text-red-600">{String((error as Error).message)}</td>
        <td className="py-2 pr-4">—</td>
      </tr>
    )
  }

  if (!data) {
    return (
      <tr>
        <td className="py-2 pr-4 font-medium">{ticker.toUpperCase()}</td>
        <td className="py-2 pr-4">{currency}</td>
        <td className="py-2 pr-4">—</td>
        <td className="py-2 pr-4">—</td>
      </tr>
    )
  }

  // Handle unified response union
  if ('error' in data) {
    return (
      <tr>
        <td className="py-2 pr-4 font-medium">{ticker.toUpperCase()}</td>
        <td className="py-2 pr-4">{currency}</td>
        <td className="py-2 pr-4 text-amber-600">
          {data.error}
          {data.suggestions?.length ? (
            <span className="block opacity-80 text-xs mt-1">
              Did you mean: {data.suggestions.map(s => s.symbol).join(', ')}
            </span>
          ) : null}
        </td>
        <td className="py-2 pr-4">—</td>
      </tr>
    )
  }

  // Success
  return (
    <tr className="border-t">
      <td className="py-2 pr-4 font-medium">{data.symbol ?? ticker.toUpperCase()}</td>
      <td className="py-2 pr-4">{data.convert}</td>
      <td className="py-2 pr-4">{fmt(data.pricePerUnit)}</td>
      <td className="py-2 pr-4">{data.lastUpdated ?? '—'}</td>
    </tr>
  )
}

function fmt(n?: number) {
  if (typeof n !== 'number' || !isFinite(n)) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(n)
}
