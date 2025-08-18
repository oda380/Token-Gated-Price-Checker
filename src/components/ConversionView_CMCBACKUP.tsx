import { useConvertAmount } from '@/hooks/usePrices' // your unified hooks

export default function ConversionView({ ticker, amount, currency, at }: {
  ticker: string; amount: string; currency: 'USD'|'EUR'; at?: string;
}) {
  const { data, isLoading, error } = useConvertAmount(ticker, amount, currency, at)

  if (error) return <p className="text-red-500">{String(error.message)}</p>
  if (isLoading) return <p>Loading…</p>
  if (!data) return null

  if ('error' in data) {
    return (
      <div className="text-amber-600">
        <p>{data.error}</p>
        {data.suggestions?.length ? (
          <ul className="list-disc ml-5">
            {data.suggestions.map(s => <li key={s.id}>{s.symbol} — {s.name}</li>)}
          </ul>
        ) : null}
      </div>
    )
  }

  return (
    <div>
      <div className="text-sm opacity-70">{data.symbol ?? ticker.toUpperCase()} • {data.convert}</div>
      <div className="text-xl font-semibold">{data.amount} {data.symbol ?? ticker.toUpperCase()} = {data.convert} {data.total.toLocaleString()}</div>
      <div className="text-xs opacity-60">@ {data.at ?? data.lastUpdated}</div>
    </div>
  )
}
