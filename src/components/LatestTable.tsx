'use client'

import { useLatestPrices, type PriceOk, type PriceResp } from '@/hooks/usePrices'

type Props = {
  tickers: string[]
  currency: 'USD' | 'EUR'
}

export default function LatestTable({ tickers, currency }: Props) {
  if (!tickers || tickers.length === 0) {
    return <p className="text-sm text-gray-400">No tickers to display.</p>
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 overflow-x-auto">
      <table className="w-full text-sm text-white">
        <thead className="text-left border-b border-slate-700">
          <tr>
            <th className="py-2 pr-4 text-gray-400 font-semibold">Symbol</th>
            <th className="py-2 pr-4 text-gray-400 font-semibold">Currency</th>
            <th className="py-2 pr-4 text-gray-400 font-semibold">Price</th>
            <th className="py-2 pr-4 text-gray-400 font-semibold">Last Updated</th>
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

  if (isLoading) return row(ticker, currency, 'Loading…', '—', 'loading')
  if (error) return row(ticker, currency, String((error as Error).message), '—', 'error')
  if (!data) return row(ticker, currency, '—', '—')

  if ('error' in data) {
    const extra = data.suggestions?.length ? ` · Did you mean: ${data.suggestions.map(s => s.symbol).join(', ')}` : ''
    return row(ticker, currency, data.error + extra, '—', 'warning')
  }

  const priceData = data as PriceOk
  const priceColor = 'text-white' 

  return (
    <tr className="border-t border-slate-700 hover:bg-slate-700 transition-colors">
      <td className="py-2 pr-4 text-purple-400 font-semibold">{priceData.symbol ?? ticker.toUpperCase()}</td>
      <td className="py-2 pr-4 text-gray-400">{priceData.convert}</td>
      <td className={`py-2 pr-4 ${priceColor}`}>{fmt(priceData.pricePerUnit)}</td>
      <td className="py-2 pr-4 text-gray-500">{priceData.lastUpdated ?? '—'}</td>
    </tr>
  )
}

function row(sym: string, ccy: string, price: string, updated: string, status?: 'loading' | 'error' | 'warning') {
  let priceClasses = 'py-2 pr-4'
  if (status === 'error') priceClasses += ' text-red-400'
  else if (status === 'warning') priceClasses += ' text-amber-400'
  else priceClasses += ' text-gray-400'

  let rowClasses = 'border-t border-slate-700'
  if (status === 'loading') rowClasses += ' animate-pulse'

  return (
    <tr className={rowClasses}>
      <td className="py-2 pr-4 text-gray-400 font-semibold">{sym}</td>
      <td className="py-2 pr-4 text-gray-400">{ccy}</td>
      <td className={priceClasses}>{price}</td>
      <td className="py-2 pr-4 text-gray-500">{updated}</td>
    </tr>
  )
}

function fmt(n?: number) {
  if (typeof n !== 'number' || !isFinite(n)) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(n)
}