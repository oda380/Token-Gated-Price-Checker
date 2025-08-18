import { useHistoricalPrice } from '@/hooks/usePrices'

export default function HistoricalBlock({ ticker, currency, datetimeLocal }:{
  ticker: string; currency:'USD'|'EUR'; datetimeLocal: string;
}) {
  const { data, isLoading, error } = useHistoricalPrice(ticker, currency, datetimeLocal)

  if (error) return <p className="text-red-500">{String(error.message)}</p>
  if (isLoading) return <p>Loading…</p>
  if (!data) return null

  if ('error' in data) {
    return <p className="text-amber-600">{data.error}{data.hint ? ` — ${data.hint}` : ''}</p>
  }

  return (
    <div>
      <div className="text-sm opacity-70">{data.symbol ?? ticker.toUpperCase()} • {data.convert}</div>
      <div className="text-xl font-semibold">{data.amount} {data.symbol ?? ticker.toUpperCase()} = {data.convert} {data.total.toLocaleString()}</div>
      <div className="text-xs opacity-60">@ {data.at}</div>
    </div>
  )
}
