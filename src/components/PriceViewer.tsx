'use client'
import React from 'react'
import PriceForm, { type PriceFormState } from './PriceForm'

export default function PriceViewer() {
  const [form, setForm] = React.useState<PriceFormState>({
    amount: '0.1',
    ticker: '',
    inCurrency: 'USD',
    timestampLocal: ''
  })

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<null | {
    from: string
    amount: number
    currency: 'USD' | 'EUR'
    at?: string
    value?: number
    perUnit?: number
    raw?: any
    suggestions?: Array<{ id: number; symbol: string; name?: string; slug: string }>
  }>(null)

  function localToUtcIso(datetimeLocal: string) {
    if (!datetimeLocal) return ''
    const m = datetimeLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
    if (!m) return ''
    const [_, Y, M, D, h, mm] = m.map(Number)
    const dt = new Date(Y, (M ?? 1) - 1, D ?? 1, h ?? 0, mm ?? 0, 0, 0)
    return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString()
  }

  function normalizeTicker(raw: string) {
    return String(raw ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^\$/, '').trim()
  }

  async function fetchConvert({ useTimestamp }: { useTimestamp: boolean }) {
    try {
      setLoading(true); setError(null); setResult(null)

      const input = normalizeTicker(form.ticker)
      const amt = Number(form.amount)
      const currency = form.inCurrency

      if (!input) throw new Error('Enter a ticker (e.g., BTC or “ethereum”)')
      if (!Number.isFinite(amt) || amt <= 0) throw new Error('Enter a positive numeric amount')

      const payload: any = { input, currency, amount: amt }
      if (useTimestamp) {
        const iso = localToUtcIso(form.timestampLocal)
        if (!iso) throw new Error('Provide a valid timestamp or click Price Now')
        payload.timestamp = iso
      }

      const res = await fetch('/api/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store'
      })

      // Try to parse JSON either way for richer errors
      const text = await res.text()
      let json: any = null
      try { json = JSON.parse(text) } catch { /* non-JSON error */ }

      if (!res.ok) {
        const msg = (json && json.error) || text || `HTTP ${res.status}`
        // surface suggestions if ambiguous (409)
        if (json?.suggestions?.length) {
          setResult({
            from: input.toUpperCase(),
            amount: amt,
            currency,
            suggestions: json.suggestions,
            raw: json
          })
        }
        throw new Error(msg)
      }

      // Unified success shape:
      // {
      //   ok: true, id, symbol?, name?, convert, amount, pricePerUnit, total, lastUpdated?, at?
      // }
      const data = json
      if (!data?.ok || typeof data.pricePerUnit !== 'number') {
        throw new Error('No price data returned for that ticker/currency')
      }

      const perUnit = data.pricePerUnit
      const total = data.total
      const sym = (data.symbol as string | undefined) ?? input.toUpperCase()

      setResult({
        from: sym,
        amount: amt,
        currency: data.convert,
        at: data.at ?? data.lastUpdated,
        value: total,
        perUnit,
        raw: json
      })
    }  catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PriceForm
        value={form}
        onChange={(p) => setForm({ ...form, ...p })}
        onGetPrice={() => fetchConvert({ useTimestamp: true })}
        onPriceNow={() => fetchConvert({ useTimestamp: false })}
        loading={loading}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
          {result?.suggestions?.length ? (
            <div className="mt-2 text-sm">
              <p className="font-medium">Did you mean:</p>
              <ul className="list-disc ml-5">
                {result.suggestions.map(s => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="underline hover:no-underline"
                      onClick={() => setForm(f => ({ ...f, ticker: s.symbol }))}
                    >
                      {s.symbol}
                    </button>
                    {s.name ? <span className="opacity-70"> — {s.name}</span> : null}
                    <span className="opacity-60"> ({s.slug})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {result && (result.value != null) && (
        <div className="rounded-2xl border p-4 space-y-3 bg-gray-50">
          <h4 className="font-semibold">Result</h4>
          <p className="text-base">
            <strong>{result.amount} {result.from}</strong>
            {' '}= <strong>{result.currency} {fmt2(result.value)}</strong>
            {' '}
            {result.at ? <>@ <span className="opacity-80">{result.at} UTC</span></> : <>@ <span className="opacity-80">now</span></>}
            {result.perUnit != null && (
              <> &nbsp;(<span className="opacity-80">≈ {result.currency} {fmt2(result.perUnit)} / 1 {result.from}</span>)</>
            )}
          </p>

          <details className="text-xs">
            <summary>Raw</summary>
            <pre className="overflow-auto">{JSON.stringify(result.raw, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  )
}

function fmt2(n: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n)
}
