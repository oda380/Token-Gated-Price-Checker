import { useHistoricalPrice } from '@/hooks/usePrices'

export default function HistoricalBlock({ ticker, currency, datetimeLocal }:{
  ticker: string; currency:'USD'|'EUR'; datetimeLocal: string;
}) {
  const { data, isLoading, error } = useHistoricalPrice(ticker, currency, datetimeLocal)

  if (error) {
    return (
      <div className="rounded-2xl border border-red-800 p-6 bg-red-950">
        <p className="text-red-400 text-sm">{String(error.message)}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-700 p-6 bg-slate-800 animate-pulse text-gray-400">
        <p>Loading historical data…</p>
      </div>
    )
  }

  if (!data) return null

  if ('error' in data) {
    return (
      <div className="rounded-2xl border border-amber-800 p-6 bg-amber-950">
        <p className="text-amber-400">{data.error}{data.hint ? ` — ${data.hint}` : ''}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-700 p-6 space-y-3 bg-slate-800">
      <div className="text-sm text-gray-400">
        <span className="font-semibold">{data.symbol ?? ticker.toUpperCase()}</span> • {data.convert}
      </div>
      <div className="text-xl font-bold text-white">
        <span className="text-purple-400">{data.amount} {data.symbol ?? ticker.toUpperCase()}</span>
        {' '} = {data.convert} {data.total.toLocaleString()}
      </div>
      <div className="text-xs text-gray-500">@ {data.at}</div>
    </div>
  )
}