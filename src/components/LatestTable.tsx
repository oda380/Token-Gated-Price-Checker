'use client'

import { useLatestPrices } from '@/hooks/usePrices'

type Props = {
  tickers: string[]            // e.g., ['BTC','ETH','SOL']
  currency: 'USD' | 'EUR'
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

function LatestRow({ ticker, currency }: { ticker: string; currency: 'USD'|'EUR' }) {
  const { data, isLoading, error } = useLatestPrices(ticker, currency)

  if (isLoading) return row(ticker, currency, 'Loading…', '—')
  if (error) return row(ticker, currency, String((error as Error).message), '—', true)
  if (!data) return row(ticker, currency, '—', '—')

  if ('error' in data) {
    const extra = data.suggestions?.length ? ` · Did you mean: ${data.suggestions.map(s=>s.symbol).join(', ')}` : ''
    return row(ticker, currency, data.error + extra, '—', true)
  }

  return row(data.symbol ?? ticker.toUpperCase(), data.convert, fmt(data.pricePerUnit), data.lastUpdated ?? '—')
}

function row(sym: string, ccy: string, price: string, updated: string, isErr = false) {
  return (
    <tr className="border-t">
      <td className="py-2 pr-4 font-medium">{sym}</td>
      <td className="py-2 pr-4">{ccy}</td>
      <td className={`py-2 pr-4 ${isErr ? 'text-amber-600' : ''}`}>{price}</td>
      <td className="py-2 pr-4">{updated}</td>
    </tr>
  )
}
function fmt(n?: number) {
  if (typeof n !== 'number' || !isFinite(n)) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(n)
}
